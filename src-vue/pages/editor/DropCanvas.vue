<template>
  <div
    ref="canvasRef"
    class="min-h-full p-4 transition-colors"
    :class="{ 'bg-[var(--accent-light)] border-2 border-dashed border-[var(--accent)]': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onCanvasClick"
  >
    <!-- Empty state -->
    <div
      v-if="components.length === 0"
      class="flex items-center justify-center min-h-[400px] bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border)] rounded-lg"
    >
      <div class="text-center text-[var(--text-muted)]">
        <div class="text-4xl mb-2">📦</div>
        <div>拖拽组件到此处构建页面</div>
      </div>
    </div>

    <!-- Components list -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="(comp, index) in components"
        :key="comp.id"
        draggable
        class="relative bg-[var(--bg-primary)] border-2 rounded-md transition-all cursor-pointer group"
        :class="[
          selectedId === comp.id
            ? 'border-[var(--accent)] shadow-lg ring-2 ring-[var(--accent-light)]'
            : 'border-transparent hover:border-[var(--border)]'
        ]"
        @dragstart="onRootDragStart($event, index)"
        @dragover.prevent
        @click.stop="onComponentClick(comp.id)"
      >
        <!-- Component actions toolbar -->
        <div class="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--bg-primary)] rounded shadow flex items-center gap-1 p-1">
          <!-- Up/Down for root components only -->
          <button
            v-if="!isNested(comp)"
            @click.stop="moveUp(index)"
            :disabled="index === 0"
            class="p-1 border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"
            title="上移"
          >
            <ArrowUp class="w-3 h-3" />
          </button>
          <button
            v-if="!isNested(comp)"
            @click.stop="moveDown(index)"
            :disabled="index === components.length - 1"
            class="p-1 border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"
            title="下移"
          >
            <ArrowDown class="w-3 h-3" />
          </button>
          <!-- Delete button -->
          <button
            @click.stop="onDelete(comp.id)"
            class="p-1 border border-[var(--danger)]/30 rounded hover:bg-[var(--danger)]/10 text-[var(--danger)]"
            :title="isNested(comp) ? '移除' : '删除'"
          >
            <Trash2 class="w-3 h-3" />
          </button>
          <!-- Drag handle -->
          <div class="p-1 border border-[var(--border)] rounded text-[var(--text-muted)] cursor-grab" title="拖拽">
            <GripVertical class="w-3 h-3" />
          </div>
        </div>

        <!-- Component content -->
        <div :class="isContainerType(comp.type) ? 'pb-2' : ''">
          <!-- Container drop zone -->
          <div
            v-if="isContainerType(comp.type)"
            class="min-h-16 border-2 border-dashed rounded m-2 p-2 transition-colors"
            :class="[
              dragOverContainerId === comp.id
                ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]'
            ]"
            @dragover.prevent="onContainerDragOver($event, comp.id)"
            @dragleave="onContainerDragLeave"
            @drop.prevent="onContainerDrop($event, comp.id)"
            @click.stop="onComponentClick(comp.id)"
          >
            <!-- Container children -->
            <template v-if="getContainerChildren(comp).length > 0">
              <div class="flex flex-col gap-2">
                <div
                  v-for="(child, childIndex) in getContainerChildren(comp)"
                  :key="child.id"
                  draggable
                  class="relative bg-[var(--bg-primary)] border-2 rounded-md transition-all cursor-pointer nested-component"
                  :class="selectedId === child.id ? 'border-[var(--accent)]' : 'border-transparent'"
                  @dragstart="onNestedDragStart($event, comp.id, childIndex)"
                  @dragover.prevent
                  @click.stop="onComponentClick(child.id)"
                >
                  <!-- Nested component actions -->
                  <div class="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--bg-primary)] rounded shadow flex items-center gap-1 p-1">
                    <button
                      @click.stop="removeFromContainer(comp.id, child.id)"
                      class="p-1 border border-[var(--danger)]/30 rounded hover:bg-[var(--danger)]/10 text-[var(--danger)]"
                      title="移除"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>

                  <!-- Nested component content -->
                  <div class="p-4">
                    <ComponentRenderer :component="child" :editable="true" />
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-[var(--text-muted)] text-sm py-4">
                拖拽组件到这里
              </div>
            </template>
          </div>

          <!-- Regular component -->
          <div v-else class="p-4">
            <ComponentRenderer :component="comp" :editable="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-vue-next'
import ComponentRenderer from './ComponentRenderer.vue'
import type { CanvasComponent } from './types'

interface Props {
  components: CanvasComponent[]
  selectedId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [id: string | null]
  reorder: [fromIndex: number, toIndex: number]
  delete: [id: string]
  drop: [data: { fromPalette: boolean, type?: string, label?: string, defaultProps?: Record<string, unknown> } | null]
  addChildToContainer: [containerId: string, component: CanvasComponent, tabIndex?: number]
  removeFromContainer: [containerId: string, childId: string]
  moveChildToRoot: [containerId: string, childId: string, insertIndex: number]
  'update-component': [id: string, key: string, value: any]
}>()

const canvasRef = ref<HTMLElement | null>(null)
const isDragOver = ref(false)
const dragOverContainerId = ref<string | null>(null)

// Drag state
const dragState = ref<{
  dragType: 'new' | 'reorder' | 'nested'
  sourceContainerId: string | null
  sourceIndex: number
}>({
  dragType: 'new',
  sourceContainerId: null,
  sourceIndex: -1,
})

// Container types that support nested children
const isContainerType = (type: string) => type === 'card' || type === 'tabs' || type === 'collapse'

// Check if component is nested (inside a container)
const isNested = (comp: CanvasComponent) => false // Root level only

// Get children for a container component
const getContainerChildren = (comp: CanvasComponent): CanvasComponent[] => {
  if (comp.type === 'tabs') {
    const childrenMap = comp.props?.childrenMap as Record<string, string[]> | undefined
    if (childrenMap) {
      const tabIndex = String(comp.props?.activeTab || 0)
      const childIds = childrenMap[tabIndex] || []
      return (comp.children || []).filter(c => childIds.includes(c.id))
    }
    return comp.children || []
  }
  return comp.children || []
}

// Generate unique ID
const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Event handlers
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  console.log('[DropCanvas] onDragOver called')
  isDragOver.value = true
}

const onDragLeave = (e: DragEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) {
    const { clientX, clientY } = e
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      isDragOver.value = false
    }
  }
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  dragOverContainerId.value = null
  
  console.log('[DropCanvas] onDrop called')
  
  // Parse drop data before emitting
  const data = e.dataTransfer?.getData('application/json')
  console.log('[DropCanvas] dataTransfer:', data)
  
  let parsed = null
  if (data) {
    try {
      parsed = JSON.parse(data)
      console.log('[DropCanvas] parsed:', parsed)
    } catch (err) {
      console.error('Failed to parse drop data:', err)
    }
  }
  emit('drop', parsed)
}

const onCanvasClick = () => {
  emit('select', null)
}

const onComponentClick = (id: string) => {
  emit('select', id)
}

// Move component up
const moveUp = (index: number) => {
  if (index > 0) {
    emit('reorder', index, index - 1)
  }
}

// Move component down
const moveDown = (index: number) => {
  if (index < props.components.length - 1) {
    emit('reorder', index, index + 1)
  }
}

// Delete component
const onDelete = (id: string) => {
  emit('delete', id)
}

// Drag from palette (new component)
const onPaletteDragStart = (e: DragEvent, type: string, label: string, defaultProps?: Record<string, unknown>) => {
  dragState.value = {
    dragType: 'new',
    sourceContainerId: null,
    sourceIndex: -1,
  }
  e.dataTransfer?.setData('application/json', JSON.stringify({
    fromPalette: true,
    type,
    label,
    defaultProps,
  }))
}

// Drag from root component (reorder)
const onRootDragStart = (e: DragEvent, index: number) => {
  dragState.value = {
    dragType: 'reorder',
    sourceContainerId: null,
    sourceIndex: index,
  }
  e.dataTransfer?.setData('application/json', JSON.stringify({
    fromRoot: true,
    index,
  }))
}

// Drag from nested component (move out of container)
const onNestedDragStart = (e: DragEvent, containerId: string, index: number) => {
  dragState.value = {
    dragType: 'nested',
    sourceContainerId: containerId,
    sourceIndex: index,
  }
  e.dataTransfer?.setData('application/json', JSON.stringify({
    fromNested: true,
    containerId,
    index,
  }))
}

// Container drag over
const onContainerDragOver = (e: DragEvent, containerId: string) => {
  e.preventDefault()
  e.stopPropagation()
  dragOverContainerId.value = containerId
}

const onContainerDragLeave = (e: DragEvent) => {
  e.stopPropagation()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const { clientX, clientY } = e
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    dragOverContainerId.value = null
  }
}

// Container drop
const onContainerDrop = (e: DragEvent, containerId: string) => {
  e.preventDefault()
  e.stopPropagation()
  dragOverContainerId.value = null

  const data = e.dataTransfer?.getData('application/json')
  if (!data) return

  try {
    const parsed = JSON.parse(data)

    if (parsed.fromPalette) {
      // New component from palette
      const newComponent: CanvasComponent = {
        id: generateId(),
        componentId: `${parsed.type}_${Date.now()}`,
        type: parsed.type,
        label: parsed.label,
        props: parsed.defaultProps || {},
      }
      const tabIndex = parsed.type === 'tabs' ? (parsed.defaultProps?.activeTab as number || 0) : undefined
      emit('addChildToContainer', containerId, newComponent, tabIndex)
    } else if (parsed.fromRoot) {
      // Moving from root to container
      emit('moveChildToRoot', containerId, '', parsed.index)
    } else if (parsed.fromNested) {
      // Moving from one container to another
      if (parsed.containerId !== containerId) {
        emit('moveChildToRoot', containerId, '', parsed.index)
      }
    }
  } catch (err) {
    console.error('Failed to parse drop data:', err)
  }
}

// Remove from container
const removeFromContainer = (containerId: string, childId: string) => {
  emit('removeFromContainer', containerId, childId)
}

// Update component prop
const updateComponentProp = (id: string, key: string, value: any) => {
  emit('update-component', id, key, value)
}

// Expose for parent component
defineExpose({
  onPaletteDragStart,
  generateId,
})
</script>

<style scoped>
.nested-component {
  margin-left: 0;
}
</style>

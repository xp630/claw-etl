<template>
  <div
    ref="canvasRef"
    class="min-h-0 w-full overflow-y-auto p-4 transition-colors"
    :class="{ 'bg-[var(--accent-light)] border-2 border-dashed border-[var(--accent)]': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onCanvasClick"
  >
    <!-- Empty state -->
    <div
      v-if="components.length === 0"
      class="flex items-center justify-center min-h-[400px] min-w-[1280px] bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border)] rounded-lg"
    >
      <div class="text-center text-[var(--text-muted)]">
        <div class="text-4xl mb-2">📦</div>
        <div>拖拽组件到此处构建页面</div>
      </div>
    </div>

    <!-- Components list -->
    <div v-else class="flex flex-col gap-3 min-w-[1280px]">
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
        @dblclick.stop="onComponentDoubleClick(comp.id)"
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
        <div class="p-2">
          <!-- Container type: render container structure (children handled by ComponentRenderer in canvasMode) -->
          <template v-if="isContainerType(comp.type)">
            <div
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
              @dblclick.stop="onComponentDoubleClick(comp.id)"
            >
              <ComponentRenderer
                :component="comp"
                :editable="true"
                canvas-mode
                :show-children="getContainerChildren(comp)"
                :container-id="comp.id"
                @remove-child="(containerId, childId) => removeFromContainer(containerId, childId)"
                @drag-start-nested="onNestedDragStart"
                @select="onComponentClick"
                @drop-on-tab="onDropOnTab"
                @open-props="(id: string) => emit('open-props', id)"
              />
            </div>
          </template>
          <!-- Regular component -->
          <template v-else>
            <ComponentRenderer :component="comp" :editable="true" canvas-mode @select="onComponentClick" @open-props="(id: string) => emit('open-props', id)" />
          </template>
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
  'add-child': [containerId: string, component: CanvasComponent, insertIndex: number, tabIndex?: number]
  'remove-child': [containerId: string, childId: string]
  'move-child-to-root': [containerId: string, childId: string, insertIndex: number, tabIndex?: number]
  'update-component': [id: string, key: string, value: any]
  'drag-start': []
  'drag-end': []
  'open-props': [id: string]
}>()

const canvasRef = ref<HTMLElement | null>(null)
const isDragOver = ref(false)
const dragOverContainerId = ref<string | null>(null)
const dragOverIndex = ref<number>(0)  // Track insert position within container

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
    const childrenMap = comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
    if (childrenMap) {
      const tabIndex = String(comp.props?.activeTab || 0)
      const childIds = childrenMap[tabIndex] || []
      const children = (comp.children || []).filter(c =>
        childIds.includes(c.componentId as any) || childIds.includes(c.id as any)
      )
      console.log('[DropCanvas] getContainerChildren tabs:', {
        compId: comp.id,
        tabIndex,
        childIds,
        childrenIds: children.map(c => ({ id: c.id, componentId: c.componentId, type: c.type }))
      })
      return children
    }
    return comp.children || []
  }
  return comp.children || []
}

// Check if targetId is the same as or a descendant of sourceId (prevents dropping container into itself)
const isDescendantOf = (targetId: string, sourceId: string): boolean => {
  if (targetId === sourceId) return true
  const findComponent = (comps: CanvasComponent[], id: string): CanvasComponent | null => {
    for (const c of comps) {
      if (c.id === id) return c
      if (c.children?.length) {
        const found = findComponent(c.children, id)
        if (found) return found
      }
    }
    return null
  }
  const source = findComponent(props.components, sourceId)
  if (!source) return false
  // Check if targetId is in source's descendants
  const checkDescendants = (comp: CanvasComponent): boolean => {
    if (comp.id === targetId) return true
    return comp.children?.some(checkDescendants) || false
  }
  return checkDescendants(source)
}

// Generate unique ID
const generateId = () => Date.now()

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
  e.stopPropagation()
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
  emit('drag-end')
}

const onCanvasClick = () => {
  emit('select', null)
}

const onComponentClick = (id: string) => {
  emit('select', id)
}

// Double-click to open props panel
const onComponentDoubleClick = (id: string) => {
  emit('open-props', id)
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
  emit('drag-start')
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
  emit('drag-start')
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
// Calculate insert index based on mouse Y position within container
const calcInsertIndex = (e: DragEvent, containerId: string): number => {
  const containerEl = (e.currentTarget as HTMLElement)
  const children = getContainerChildren(props.components.find(c => c.id === containerId)!)
  if (children.length === 0) return 0
  
  const containerRect = containerEl.getBoundingClientRect()
  const relY = e.clientY - containerRect.top
  
  // Find the child element under mouse
  const childEls = containerEl.querySelectorAll('[data-child-index]')
  for (const childEl of childEls) {
    const rect = childEl.getBoundingClientRect()
    const midY = rect.top + rect.height / 2 - containerRect.top
    if (relY < midY) {
      return parseInt((childEl as HTMLElement).dataset.childIndex || '0', 10)
    }
  }
  return children.length
}

const onContainerDragOver = (e: DragEvent, containerId: string) => {
  e.preventDefault()
  e.stopPropagation()
  dragOverContainerId.value = containerId
  dragOverIndex.value = calcInsertIndex(e, containerId)
}

const onContainerDragLeave = (e: DragEvent) => {
  e.stopPropagation()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const { clientX, clientY } = e
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    dragOverContainerId.value = null
  }
}

// Drop on a specific tab within a tabs container
const onDropOnTab = (containerId: string, tabIndex: number, data: any) => {
  console.log('[DropCanvas] onDropOnTab called:', { containerId, tabIndex, data })
  
  try {
    // Check if trying to drop a container into itself
    if (data.fromRoot) {
      const comp = props.components[data.index]
      if (comp && isContainerType(comp.type) && isDescendantOf(containerId, comp.id)) {
        console.warn('[DropCanvas] Cannot drop container into itself or its descendant')
        emit('drag-end')
        return
      }
    } else if (data.fromNested) {
      // For nested moves, we need the actual component - check via parent chain
      // The actual check will be done in handleMoveChildToRoot/handleAddChildToContainer
    }

    if (data.fromPalette) {
      // New component from palette - add to specific tab
      const newComponent: CanvasComponent = {
        id: generateId(),
        componentId: `${data.type}_${Date.now()}`,
        type: data.type,
        label: data.label,
        props: data.defaultProps || {},
      }
      emit('add-child', containerId, newComponent, tabIndex)
    } else if (data.fromRoot) {
      // Dragging root component INTO a container → add-child
      const rootComp = props.components[data.index]
      if (rootComp) {
        emit('add-child', containerId, rootComp, data.index, tabIndex)
      }
    } else if (data.fromNested) {
      // Dragging nested component to another container → move-child-to-root
      const srcContainer = props.components.find(c => c.id === data.containerId)
      const child = srcContainer?.children?.[data.index]
      emit('move-child-to-root', containerId, child?.id || '', data.index, tabIndex)
    }
  } catch (err) {
    console.error('Failed to handle drop on tab:', err)
  }
  emit('drag-end')
}

// Container drop
const onContainerDrop = (e: DragEvent, containerId: string) => {
  e.preventDefault()
  e.stopPropagation()
  dragOverContainerId.value = null

  console.log('[DropCanvas] onContainerDrop called, containerId:', containerId)
  const data = e.dataTransfer?.getData('application/json')
  console.log('[DropCanvas] onContainerDrop data:', data)
  if (!data) {
    emit('drag-end')
    return
  }

  try {
    const parsed = JSON.parse(data)

    if (parsed.fromPalette) {
      // New component from palette - use temp id for client-side, backend will assign real id on save
      const newComponent: CanvasComponent = {
        id: generateId(),  // Temporary client-side id
        componentId: `${parsed.type}_${Date.now()}`, 
        type: parsed.type,
        label: parsed.label,
        props: parsed.defaultProps || {},
      }
      const tabIndex = parsed.type === 'tabs' ? (parsed.defaultProps?.activeTab as number || 0) : undefined
      emit('add-child', containerId, newComponent, dragOverIndex.value, tabIndex)
    } else if (parsed.fromRoot) {
      // Dragging root component INTO a container → add-child
      const comp = props.components[parsed.index]
      if (comp && isContainerType(comp.type) && isDescendantOf(containerId, comp.id)) {
        console.warn('[DropCanvas] Cannot drop container into itself or its descendant')
        emit('drag-end')
        return
      }
      // Root component → add to container (NOT move-child-to-root)
      emit('add-child', containerId, comp, dragOverIndex.value)
    } else if (parsed.fromNested) {
      // Moving from one container to another → add-child (add to new container)
      if (parsed.containerId !== containerId) {
        const srcContainer = props.components.find(c => c.id === parsed.containerId)
        const child = srcContainer?.children?.[parsed.index]
        emit('add-child', containerId, child, dragOverIndex.value)
      }
    }
  } catch (err) {
    console.error('Failed to parse drop data:', err)
  }
  emit('drag-end')
}

// Remove from container
const removeFromContainer = (containerId: string, childId: string) => {
  emit('remove-child', containerId, childId)
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

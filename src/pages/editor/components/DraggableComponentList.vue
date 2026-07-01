<template>
  <draggable
    v-model="localComponents"
    item-key="id"
    handle=".drag-handle"
    :animation="200"
    ghost-class="ghost"
    chosen-class="chosen"
    drag-class="dragging"
    class="flex flex-col gap-3 min-w-[1280px]"
    @start="onDragStart"
    @end="onDragEnd"
    @change="onChange"
  >
    <template #item="{ element: comp, index }">
      <div
        class="relative bg-[var(--bg-primary)] border-2 rounded-md transition-all cursor-pointer group"
        :class="[
          selectedId === comp.id
            ? 'border-[var(--accent)] shadow-lg ring-2 ring-[var(--accent-light)]'
            : 'border-transparent hover:border-[var(--border)]'
        ]"
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
            :disabled="index === localComponents.length - 1"
            class="p-1 border border-[var(--border)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-30"
            title="下移"
          >
            <ArrowDown class="w-3 h-3" />
          </button>
          <!-- Delete button -->
          <button
            @click.stop="onDelete(comp.id)"
            class="p-1 border border-[var(--danger)]/30 rounded hover:bg-[var(--danger)]/10 text-[var(--danger)]"
            title="删除"
          >
            <Trash2 class="w-3 h-3" />
          </button>
          <!-- Drag handle -->
          <div class="drag-handle p-1 border border-[var(--border)] rounded text-[var(--text-muted)] cursor-grab active:cursor-grabbing" title="拖拽排序">
            <GripVertical class="w-3 h-3" />
          </div>
        </div>

        <!-- Component content -->
        <div class="p-2">
          <!-- Container type: render container structure -->
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
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import ComponentRenderer from '../ComponentRenderer.vue'
import type { CanvasComponent } from '../types'

interface Props {
  components: CanvasComponent[]
  selectedId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null
})

const emit = defineEmits<{
  'update:components': [value: CanvasComponent[]]
  select: [id: string | null]
  reorder: [fromIndex: number, toIndex: number]
  delete: [id: string]
  'add-child': [containerId: string, component: CanvasComponent, insertIndex: number, tabIndex?: number]
  'remove-child': [containerId: string, childId: string]
  'move-child-to-root': [containerId: string, childId: string, insertIndex: number, tabIndex?: number]
  'update-component': [id: string, key: string, value: any]
  'drag-start': []
  'drag-end': []
  'open-props': [id: string]
}>()

// Local copy for draggable
const localComponents = computed({
  get: () => props.components,
  set: (val) => emit('update:components', val)
})

const dragOverContainerId = ref<string | null>(null)
const isDroppingToTab = ref(false)

// Container types
const isContainerType = (type: string) => type === 'card' || type === 'tabs' || type === 'collapse'
const isNested = (_comp: CanvasComponent) => false

// Get children for a container
const getContainerChildren = (comp: CanvasComponent): CanvasComponent[] => {
  if (comp.type === 'tabs') {
    const activeTabId = comp.props?.activeTab as string || 'tab_0'
    return (comp.children || []).filter(c => (c as any).tabId === activeTabId)
  }
  return comp.children || []
}

// Generate unique ID
const generateId = () => Date.now()

// Event handlers
const onComponentClick = (id: string) => emit('select', id)
const onComponentDoubleClick = (id: string) => emit('open-props', id)

const moveUp = (index: number) => {
  if (index > 0) emit('reorder', index, index - 1)
}

const moveDown = (index: number) => {
  if (index < localComponents.value.length - 1) emit('reorder', index, index + 1)
}

const onDelete = (id: string) => emit('delete', id)

const onDragStart = () => emit('drag-start')
const onDragEnd = () => emit('drag-end')

const onChange = (evt: any) => {
  if (evt.added) {
    emit('reorder', evt.added.oldIndex, evt.added.newIndex)
  }
}

const onNestedDragStart = (e: DragEvent, containerId: string, index: number) => {
  emit('drag-start')
  e.dataTransfer?.setData('application/json', JSON.stringify({
    fromNested: true,
    containerId,
    index,
  }))
}

const onContainerDragOver = (e: DragEvent, containerId: string) => {
  e.preventDefault()
  dragOverContainerId.value = containerId
}

const onContainerDragLeave = (e: DragEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const { clientX, clientY } = e
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    dragOverContainerId.value = null
  }
}

const onDropOnTab = (containerId: string, tabIndex: number, data: any) => {
  isDroppingToTab.value = true
  try {
    if (data.fromPalette) {
      const newComponent: CanvasComponent = {
        id: generateId(),
        componentId: `${data.type}_${Date.now()}`,
        type: data.type,
        label: data.label,
        props: data.defaultProps || {},
      }
      emit('add-child', containerId, newComponent, tabIndex)
    } else if (data.fromNested) {
      emit('remove-child', data.containerId, data.childId)
      emit('add-child', containerId, data.child, -1, tabIndex)
    }
  } catch (err) {
    console.error('Failed to handle drop on tab:', err)
  }
  emit('drag-end')
}

const onContainerDrop = (e: DragEvent, containerId: string) => {
  if (isDroppingToTab.value) {
    isDroppingToTab.value = false
    return
  }
  e.preventDefault()
  e.stopPropagation()
  dragOverContainerId.value = null

  const data = e.dataTransfer?.getData('application/json')
  if (!data) {
    emit('drag-end')
    return
  }

  try {
    const parsed = JSON.parse(data)
    if (parsed.fromPalette) {
      const newComponent: CanvasComponent = {
        id: generateId(),
        componentId: `${parsed.type}_${Date.now()}`,
        type: parsed.type,
        label: parsed.label,
        props: parsed.defaultProps || {},
      }
      emit('add-child', containerId, newComponent, -1)
    } else if (parsed.fromNested) {
      emit('remove-child', parsed.containerId, parsed.childId)
      emit('add-child', containerId, parsed.child, -1)
    }
  } catch (err) {
    console.error('Failed to parse drop data:', err)
  }
  emit('drag-end')
}

const removeFromContainer = (containerId: string, childId: string) => {
  emit('remove-child', containerId, childId)
}
</script>

<style scoped>
.ghost {
  opacity: 0.5;
  background: var(--accent-light, #ecf5ff);
  border: 2px dashed var(--accent, #409eff);
}

.chosen {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dragging {
  cursor: grabbing !important;
}
</style>

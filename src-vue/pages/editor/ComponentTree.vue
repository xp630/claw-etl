<template>
  <div class="component-tree h-full flex flex-col bg-[var(--bg-primary)]">
    <!-- Header -->
    <div v-if="showHeader" class="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
      <h3 class="text-xs font-medium text-[var(--text-primary)]">组件层</h3>
    </div>

    <!-- Tree Content -->
    <div class="flex-1 overflow-auto py-1">
      <div v-if="components.length === 0" class="text-xs text-[var(--text-muted)] px-3 py-2">
        暂无组件
      </div>
      <div v-else>
        <TreeNode
          v-for="comp in components"
          :key="comp.id"
          :component="comp"
          :selected-id="selectedId"
          :depth="0"
          :drag-state="dragState"
          @select="handleSelect"
          @delete="handleDelete"
          @move="handleMove"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @drag-enter="handleDragEnter"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { typeLabels, isContainerType } from './constants'
import { ElIcon } from 'element-plus'
import { Folder, Table, Layout, Document, Delete, More, ChevronRight, ChevronDown, Grid } from '@element-plus/icons-vue'

interface DragState {
  dragId: string | null
  dropId: string | null
  position: 'before' | 'after' | 'inside'
}

const props = defineProps<{
  components: any[]
  selectedId: string | null
  showHeader?: boolean
}>()

const emit = defineEmits<{
  select: [id: string | null]
  delete: [id: string]
  move: [dragId: string, dropId: string, position: 'before' | 'after' | 'inside']
}>()

const dragState = ref<DragState | null>(null)

const typeIcons: Record<string, any> = {
  card: Layout,
  tabs: Folder,
  table: Table,
  form: Document,
  text: Document,
  button: Document,
  input: Document,
  default: Document,
}

function getIcon(type: string) {
  return typeIcons[type] || typeIcons.default
}

function handleSelect(id: string) {
  emit('select', id)
}

function handleDelete(id: string) {
  emit('delete', id)
}

function handleMove(dragId: string, dropId: string, position: 'before' | 'after' | 'inside') {
  emit('move', dragId, dropId, position)
}

function handleDragStart(id: string) {
  dragState.value = { dragId: id, dropId: null, position: 'inside' }
}

function handleDragEnd() {
  dragState.value = null
}

function handleDragEnter(id: string, position: 'before' | 'after' | 'inside') {
  if (dragState.value && dragState.value.dragId !== id) {
    dragState.value = { ...dragState.value, dropId: id, position }
  }
}

// TreeNode component defined inline
const TreeNode = {
  name: 'TreeNode',
  props: {
    component: { type: Object, required: true },
    selectedId: { type: String as () => string | null, default: null },
    depth: { type: Number, default: 0 },
    dragState: { type: Object as () => DragState | null, default: null },
  },
  emits: ['select', 'delete', 'move', 'drag-start', 'drag-end', 'drag-enter'],
  setup(props: any, { emit }: any) {
    const expanded = ref(true)
    const isContainer = () => isContainerType(props.component.type)
    const hasChildren = () => props.component.children && props.component.children.length > 0
    
    const handleDragStart = (e: DragEvent) => {
      e.dataTransfer.setData('text/plain', props.component.id)
      e.dataTransfer.effectAllowed = 'move'
      emit('drag-start', props.component.id)
    }
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (!props.dragState?.dragId || props.dragState.dragId === props.component.id) return
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const threshold = rect.height / 4
      let position: 'before' | 'after' | 'inside' = 'inside'
      if (y < threshold) position = 'before'
      else if (y > rect.height - threshold) position = 'after'
      emit('drag-enter', props.component.id, position)
    }
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const dragId = e.dataTransfer.getData('text/plain')
      if (!dragId || dragId === props.component.id) return
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const threshold = rect.height / 4
      let position: 'before' | 'after' | 'inside' = 'inside'
      if (y < threshold) position = 'before'
      else if (y > rect.height - threshold) position = 'after'
      emit('move', dragId, props.component.id, position)
    }
    
    const handleDragEnd = () => {
      emit('drag-end')
    }
    
    const toggleExpand = (e: Event) => {
      e.stopPropagation()
      expanded.value = !expanded.value
    }
    
    const isDropTarget = () => props.dragState?.dropId === props.component.id && props.dragState?.dragId !== props.component.id
    const position = () => props.dragState?.position as 'before' | 'after' | 'inside' | undefined
    
    const getDropIndicator = () => {
      if (position() === 'before') {
        return { top: '-1px', height: '2px', left: '0', right: '0', bottom: 'auto', background: 'var(--accent)', position: 'absolute' as const }
      }
      if (position() === 'after') {
        return { bottom: '-1px', height: '2px', left: '0', right: '0', top: 'auto', background: 'var(--accent)', position: 'absolute' as const }
      }
      if (position() === 'inside' && isContainer()) {
        return { inset: '0', border: '2px solid var(--accent)', borderRadius: '4px', background: 'rgba(var(--accent-rgb), 0.1)', position: 'absolute' as const }
      }
      return null
    }
    
    return () => {
      const comp = props.component
      const isSelected = props.selectedId === comp.id
      const isDragging = props.dragState?.dragId === comp.id
      const dropIndicator = isDropTarget() ? getDropIndicator() : null
      
      return (
        <div class="group relative">
          <div
            class={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors relative ${
              isSelected ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'hover:bg-[var(--bg-hover)]'
            } ${isDragging ? 'opacity-50' : ''}`}
            style={{ paddingLeft: `${props.depth * 16 + 8}px` }}
            draggable={true}
            onDragstart={handleDragStart}
            onDragover={handleDragOver}
            onDrop={handleDrop}
            onDragend={handleDragEnd}
            onClick={() => emit('select', comp.id)}
          >
            {dropIndicator && (
              <div style={dropIndicator} />
            )}
            <span class="w-4 flex-shrink-0 cursor-grab opacity-0 group-hover:opacity-100 text-[var(--text-muted)]">
              <More />
            </span>
            {isContainer() && hasChildren() ? (
              <span onClick={toggleExpand} class="p-0.5 hover:bg-[var(--bg-hover)] rounded flex-shrink-0">
                {expanded.value ? <ChevronDown /> : <ChevronRight />}
              </span>
            ) : (
              <span class="w-4 flex-shrink-0" />
            )}
            <ElIcon class="flex-shrink-0" style={{ color: isContainer() ? 'var(--accent)' : 'var(--text-muted)' }}>
              <Grid />
            </ElIcon>
            <span class="text-xs truncate flex-1 text-[var(--text-primary)]">
              {comp.label || typeLabels[comp.type] || comp.type}
            </span>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e: Event) => { e.stopPropagation(); emit('delete', comp.id) }}
                class="p-0.5 hover:bg-red-500/20 rounded"
                title="删除"
              >
                <Delete class="w-3 h-3 text-[var(--danger)]" />
              </button>
            </div>
          </div>
          {hasChildren() && expanded.value && (
            <div>
              {comp.children.map((child: any) => (
                <TreeNode
                  key={child.id}
                  component={child}
                  selectedId={props.selectedId}
                  depth={props.depth + 1}
                  dragState={props.dragState}
                  onSelect={(id: string) => emit('select', id)}
                  onDelete={(id: string) => emit('delete', id)}
                  onMove={(dragId: string, dropId: string, position: 'before' | 'after' | 'inside') => emit('move', dragId, dropId, position)}
                  onDragStart={(id: string) => emit('drag-start', id)}
                  onDragEnd={() => emit('drag-end')}
                  onDragEnter={(id: string, pos: 'before' | 'after' | 'inside') => emit('drag-enter', id, pos)}
                />
              ))}
            </div>
          )}
        </div>
      )
    }
  }
}
</script>

<style scoped>
</style>

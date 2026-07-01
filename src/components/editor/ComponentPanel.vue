<template>
  <div class="component-panel">
    <div class="px-4 py-3 border-b border-[var(--border-light)]">
      <h4 class="text-sm font-medium text-[var(--text-primary)]">组件库</h4>
      <p class="text-xs text-[var(--text-muted)] mt-1">拖拽组件到画布</p>
    </div>

    <div class="p-2 overflow-y-auto flex-1">
    <div v-for="category in componentCategories" :key="category.name" class="mb-4">
      <div class="text-xs text-[var(--text-muted)] mb-2 px-2 font-medium uppercase tracking-wide">{{ category.name }}</div>
      <div class="flex flex-col gap-1">
        <div
          v-for="comp in category.components"
          :key="comp.type"
          class="component-item flex items-center gap-3 p-3 rounded-lg cursor-grab transition-all duration-150 hover:translate-x-1 active:cursor-grabbing select-none group"
          draggable="true"
          @dragstart="onDragStart($event, comp)"
        >
          <div class="w-8 h-8 rounded-md bg-[var(--bg-tertiary)] flex items-center justify-center text-sm group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
            {{ getComponentIcon(comp.type) }}
          </div>
          <span class="text-sm text-[var(--text-primary)] font-medium">{{ comp.label }}</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getComponentCategories, getComponentIcon } from '@/pages/editor/component-registry'
import type { ComponentCategory } from '@/pages/editor/types'

interface ComponentItem {
  type: string
  label: string
  icon: string
  defaultProps?: Record<string, unknown>
}

const emit = defineEmits<{
  'drag-start': [event: DragEvent, type: string, label: string, defaultProps?: Record<string, unknown>]
}>()

const componentCategories = getComponentCategories()

function onDragStart(event: DragEvent, comp: ComponentItem) {
  console.log('[ComponentPanel] onDragStart:', comp.type, comp.label)
  if (event.dataTransfer) {
    const dragData = {
      fromPalette: true,
      type: comp.type,
      label: comp.label,
      defaultProps: comp.defaultProps || {},
    }
    console.log('[ComponentPanel] setting dataTransfer:', JSON.stringify(dragData))
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
  }
  emit('drag-start', event, comp.type, comp.label, comp.defaultProps)
}
</script>

<style scoped>
.component-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  user-select: none;
}

.component-item {
  background: var(--bg-primary);
  border: 1px solid transparent;
}

.component-item:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.component-item:active {
  transform: scale(0.98);
}
</style>

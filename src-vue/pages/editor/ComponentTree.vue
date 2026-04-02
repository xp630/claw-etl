<template>
  <div class="component-tree h-full flex flex-col bg-[var(--bg-primary)]">
    <!-- Header -->
    <div v-if="showHeader" class="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
      <h3 class="text-xs font-medium text-[var(--text-primary)]">组件层</h3>
    </div>

    <!-- Tree Content -->
    <div class="flex-1 overflow-auto py-1">
      <div v-if="props.components.length === 0" class="text-xs text-[var(--text-muted)] px-3 py-2">
        暂无组件
      </div>
      <div v-else>
        <ComponentTreeNode
          v-for="comp in props.components"
          :key="comp.id"
          :comp="comp"
          :depth="0"
          :selected-id="props.selectedId"
          :expanded="expanded"
          @select="emit('select', $event)"
          @delete="emit('delete', $event)"
          @toggle-expand="handleToggleExpand"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ComponentTreeNode from './ComponentTreeNode.vue'
import type { CanvasComponent } from './types'

interface Props {
  components: CanvasComponent[]
  selectedId: string | null
  showHeader?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()

// Shared expanded state - reactive Set (proxy handles mutations reactively)
const expanded = ref<string[]>([])

// Prevent duplicate rapid clicks
let lastToggleTime = 0
function handleToggleExpand(id: string) {
  const now = Date.now()
  if (now - lastToggleTime < 200) {
    console.log('[handleToggleExpand] REJECTED duplicate click for:', id)
    return
  }
  lastToggleTime = now
  console.log('[handleToggleExpand] id:', id, 'current expanded:', expanded.value)
  // Use array for reactivity
  if (expanded.value.includes(id)) {
    expanded.value = expanded.value.filter(x => x !== id)
  } else {
    expanded.value = [...expanded.value, id]
  }
  console.log('[handleToggleExpand] new expanded:', expanded.value)
}
</script>

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
          v-model:expanded="expanded"
          @select="emit('select', $event)"
          @delete="emit('delete', $event)"
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

const expanded = ref<string[]>([])

// Auto-expand root components on mount
watch(() => props.components, (comps) => {
  if (comps.length > 0 && expanded.value.length === 0) {
    expanded.value = comps.map(c => String(c.id))
  }
}, { immediate: true })
</script>

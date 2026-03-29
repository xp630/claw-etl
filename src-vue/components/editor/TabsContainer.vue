<template>
  <div class="tabs-container">
    <!-- Tab Headers -->
    <div class="flex border-b border-[var(--border-light)] mb-2">
      <button
        v-for="(tabTitle, index) in tabTitles"
        :key="index"
        class="px-4 py-2 text-sm transition-colors"
        :class="[
          Number(component.props.activeTab) === index
            ? 'text-blue-500 border-b-2 border-blue-500'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        ]"
        @click="setActiveTab(index)"
      >
        {{ tabTitle }}
      </button>
    </div>
    <!-- Tab Content -->
    <div class="tabs-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'

interface Props {
  component: CanvasComponent
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [key: string, value: any]
}>()

// Tabs titles from tabs array prop
const tabTitles = computed(() => {
  const tabs = props.component.props.tabs as string[] | undefined
  if (tabs && tabs.length > 0) return tabs
  // Fallback: generate from tabCount
  const count = (props.component.props.tabCount as number) || 2
  return Array.from({ length: count }, (_, i) => props.component.props[`tab${i}Title`] as string || `标签页 ${i + 1}`)
})

const setActiveTab = (index: number) => {
  emit('update', 'activeTab', index)
}
</script>

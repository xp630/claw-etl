<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'

interface Props {
  component: CanvasComponent
}

interface TabItem {
  id: string
  label: string
  children?: (string | number)[]
  [key: string]: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [key: string, value: any]
}>()

// New format: tabs is TabItem[]
const tabItems = computed<TabItem[]>(() => {
  const tabs = props.component.props.tabs as TabItem[] | undefined
  return tabs || []
})

// activeTab is string ID like "tab_0"
const activeTabId = computed(() => props.component.props.activeTab as string || '')

function setActiveTab(tabId: string) {
  emit('update', 'activeTab', tabId)
}
</script>

<template>
  <div class="tabs-container">
    <!-- Tab Headers -->
    <div class="flex border-b border-[var(--border-light)] mb-2">
      <button
        v-for="tab in tabItems"
        :key="tab.id"
        class="px-4 py-2 text-sm transition-colors"
        :class="[
          activeTabId === tab.id
            ? 'text-blue-500 border-b-2 border-blue-500'
            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        ]"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <!-- Tab Content -->
    <div class="tabs-content">
      <slot />
    </div>
  </div>
</template>

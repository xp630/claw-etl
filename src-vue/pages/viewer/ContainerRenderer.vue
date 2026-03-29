<template>
  <div class="container-renderer" :style="containerStyle">
    <!-- Card -->
    <div v-if="type === 'card'" class="w-full bg-[var(--bg-secondary)] rounded-lg p-4 flex flex-col border border-[var(--border-light)]" :class="{ 'border': bordered !== false }">
      <div v-if="props.title" class="font-medium text-[var(--text-primary)] mb-3 text-sm flex-shrink-0">{{ props.title }}</div>
      <div class="flex-1 min-h-0"><slot /></div>
    </div>
    <!-- Tabs -->
    <div v-else-if="type === 'tabs'" class="w-full bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg flex flex-col">
      <div class="flex border-b border-[var(--border-light)] px-4 mb-3 -mx-4">
        <div v-for="(tab, i) in tabs" :key="i" class="px-4 py-2 text-sm cursor-pointer transition-colors border-b-2 -mb-px"
          :class="i === activeTab ? 'text-blue-500 border-blue-500 font-medium' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]'"
          @click="activeTab = i">{{ tab }}</div>
      </div>
      <div class="flex-1 min-h-0 overflow-hidden">
        <template v-for="(child, idx) in tabChildren" :key="child.id || idx">
          <ElementRenderer v-if="!isContainer(child.type)" :type="child.type" :props="child.props" />
          <ContainerRenderer v-else :type="child.type" :props="child.props" :children="child.children" />
        </template>
      </div>
    </div>
    <!-- Collapse -->
    <div v-else-if="type === 'collapse'" class="w-full bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg flex flex-col">
      <div v-for="(panel, i) in panels" :key="i" class="border border-[var(--border-light)] rounded mb-2 last:mb-0 flex flex-col" :class="{ 'mt-2': i > 0 }">
        <div class="px-4 py-2.5 bg-[var(--bg-table-header)] flex items-center justify-between flex-shrink-0">
          <span class="text-sm font-medium text-[var(--text-primary)]">{{ panel.title }}</span>
          <span class="text-[var(--text-muted)]">▼</span>
        </div>
        <div class="p-4 flex-1 min-h-0"><slot v-if="i === 0" /></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ElementRenderer from './ElementRenderer.vue'
import ContainerRenderer from './ContainerRenderer.vue'

const props = defineProps<{ type: string; props: Record<string, unknown>; children?: any[] }>()
const activeTab = ref(0)
const containerStyle = computed(() => ({ width: (props.props.width as number | string) ?? '100%', minWidth: 0, flex: 1, borderRadius: '8px', padding: '16px' }))
const tabs = computed(() => (props.props.tabs as string[]) || [])
const panels = computed(() => (props.props.panels as Array<{ title: string; content: string }>) || [])
const bordered = computed(() => props.props.bordered)

const isContainer = (type: string) => ['card', 'tabs', 'collapse'].includes(type)

// For tabs: get children of the active tab
const tabChildren = computed(() => {
  if (!props.children || props.children.length === 0) return []
  const childrenMap = props.props.childrenMap as Record<string, string[]> | undefined
  if (childrenMap) {
    const tabKey = String(activeTab.value)
    const childIds = childrenMap[tabKey] || []
    return props.children.filter(c => childIds.includes(c.id))
  }
  return props.children
})
</script>

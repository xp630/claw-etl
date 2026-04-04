<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'

interface Props {
  comp: CanvasComponent
  depth?: number
  selectedId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  selectedId: null
})

const emit = defineEmits<{ select: [id: string] }>()

const expanded = ref(props.depth < 2)

const typeIcons: Record<string, string> = {
  card: '📦',
  tabs: '📑',
  collapse: '📂',
  table: '📊',
  form: '📝',
  button: '🔘',
  input: '✏️',
  text: '🔤',
  image: '🖼️',
  chart: '📈',
  default: '📄'
}

const icon = computed(() => typeIcons[props.comp.type] || typeIcons.default)
const isSelected = computed(() => props.selectedId === props.comp.id)

// For tabs: actual children are in comp.children (resolved from parentId relationship)
// NOT in tabs.props.tabs - those are just tab metadata
const actualChildren = computed(() => {
  if (props.comp.type === 'tabs') {
    // Tabs: show comp.children as the actual child components
    return props.comp.children || []
  }
  return props.comp.children || []
})

const hasChildren = computed(() => actualChildren.value.length > 0)

const label = computed(() => 
  props.comp.props?.label 
  || props.comp.props?.title 
  || props.comp.props?.name
  || props.comp.label 
  || props.comp.type
)

function toggle() {
  expanded.value = !expanded.value
}

function select() {
  emit('select', props.comp.id)
}
</script>

<template>
  <div class="tree-node">
    <!-- Self -->
    <div
      class="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors text-xs"
      :class="isSelected ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="select"
    >
      <!-- Expand/collapse -->
      <button
        v-if="hasChildren"
        class="w-4 h-4 flex items-center justify-center text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        @click.stop="toggle"
      >
        {{ expanded ? '▼' : '▶' }}
      </button>
      <span v-else class="w-4" />

      <!-- Icon -->
      <span class="text-sm">{{ icon }}</span>

      <!-- Type badge -->
      <span class="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
        {{ comp.type }}
      </span>

      <!-- Label -->
      <span class="flex-1 truncate">{{ label }}</span>

      <!-- ID -->
      <span class="text-[10px] text-[var(--text-muted)]">{{ comp.id }}</span>

      <!-- Children count (only for non-tabs, tabs show their actual children) -->
      <span v-if="comp.type !== 'tabs' && actualChildren.length > 0" class="text-[10px] text-[var(--text-muted)]">
        {{ actualChildren.length }}
      </span>
    </div>

    <!-- Tabs metadata (only show tab names, not as children) -->
    <template v-if="comp.type === 'tabs' && comp.props?.tabs?.length">
      <div
        v-for="tab in comp.props.tabs"
        :key="tab.id"
        class="flex items-center gap-2 py-1 px-2 text-[var(--text-muted)]"
        :style="{ paddingLeft: `${(depth + 1) * 16 + 8}px` }"
      >
        <span class="w-4" />
        <span class="text-sm">📑</span>
        <span class="text-[var(--text-secondary)]">{{ tab.label || 'Tab' }}</span>
        <span v-if="tab.children?.length" class="text-[10px]">({{ tab.children.length }})</span>
      </div>
    </template>

    <!-- Actual Children (for tabs: comp.children; for others: comp.children) -->
    <template v-if="hasChildren && expanded">
      <TreeNode
        v-for="child in actualChildren"
        :key="child.id"
        :comp="child"
        :depth="comp.type === 'tabs' ? depth + 1 : depth + 1"
        :selected-id="selectedId"
        @select="emit('select', $event)"
      />
    </template>
  </div>
</template>

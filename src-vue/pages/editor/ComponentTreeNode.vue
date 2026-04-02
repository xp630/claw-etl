<template>
  <div class="tree-node">
    <div
      class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors group"
      :class="{
        'bg-[var(--accent-light)] text-[var(--accent)]': selectedId === comp.id,
        'hover:bg-[var(--bg-hover)]': selectedId !== comp.id
      }"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="emit('select', comp.id)"
    >
      <span
        v-if="isContainer(comp.type) && hasChildren"
        @click.stop="toggleExpand(String(comp.id))"
        class="p-0.5 hover:bg-[var(--bg-hover)] rounded"
      >
        <ChevronDown v-if="isExpanded" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </span>
      <span v-else class="w-4" />

      <component :is="getIcon(comp.type)" class="w-3 h-3 text-[var(--text-muted)]" />
      <span class="text-xs truncate flex-1">{{ comp.label || getTypeLabel(comp.type) }}</span>
      <span class="text-xs text-[var(--text-muted)]">({{ getTypeLabel(comp.type) }})</span>

      <button
        @click.stop="emit('delete', comp.id)"
        class="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
      >
        <Trash2 class="w-3 h-3 text-red-500" />
      </button>
    </div>

    <template v-if="isContainer(comp.type) && isExpanded && hasChildren && comp.type === 'tabs'">
      <ComponentTreeNode
        v-for="(childIds, tabKey) in (comp.props?.childrenMap || {})"
        :key="'tab-' + tabKey"
        :comp="{ id: 'tab-' + comp.id + '-' + tabKey, type: 'tab', label: 'Tab ' + (Number(tabKey) + 1), children: getTabChildren(tabKey) }"
        :depth="depth + 1"
        :selected-id="selectedId"
        :expanded="expanded"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
        @update:expanded="emit('update:expanded', $event)"
      />
    </template>

    <!-- For tab nodes (virtual): always render children directly -->
    <template v-if="comp.type === 'tab' && comp.children && comp.children.length > 0">
      <ComponentTreeNode
        v-for="child in comp.children"
        :key="child.id"
        :comp="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :expanded="expanded"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
        @update:expanded="emit('update:expanded', $event)"
      />
    </template>

    <template v-if="isContainer(comp.type) && isExpanded && hasChildren && comp.type !== 'tabs' && comp.type !== 'tab'">
      <ComponentTreeNode
        v-for="child in comp.children"
        :key="child.id"
        :comp="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :expanded="expanded"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
        @update:expanded="emit('update:expanded', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Layout,
  Table,
  Trash2,
  BarChart3,
  LineChart,
  PieChart,
  Grid3X3,
  Image,
  Link2,
  ToggleLeft,
  Type,
  Calendar,
  Minus,
  Square
} from 'lucide-vue-next'
import type { CanvasComponent } from './types'

const props = defineProps<{
  comp: CanvasComponent
  depth: number
  selectedId: string | null
  expanded: string[]
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  'update:expanded': [value: string[]]
}>()

const containerTypes = ['card', 'tabs', 'collapse', 'grid']

const isExpanded = computed(() => {
  return props.expanded.includes(String(props.comp.id))
})

function getTabChildren(tabKey: string) {
  const childrenMap = props.comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
  if (!childrenMap || !childrenMap[tabKey]) return []
  const childIds = (childrenMap[tabKey] || []).map(id => String(id))
  console.log('[getTabChildren] tabKey:', tabKey, 'childIds:', childIds, 'comp.children:', props.comp.children?.map(c => ({id: c.id, componentId: c.componentId})))
  const result = (props.comp.children || []).filter(c => childIds.includes(String(c.componentId)) || childIds.includes(String(c.id)))
  console.log('[getTabChildren] result:', result.map(c => c.id))
  return result
}

const hasChildren = computed(() => {
  if (props.comp.children && props.comp.children.length > 0) return true
  const childrenMap = props.comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
  if (childrenMap && Object.keys(childrenMap).length > 0) return true
  return false
})

console.log('[CTN]', props.comp.type, props.comp.id, 'hasChildren:', hasChildren.value, 'children:', props.comp.children?.length, 'isContainer:', isContainer(props.comp.type))

function isContainer(type: string): boolean {
  return containerTypes.includes(type)
}

function toggleExpand(id: string) {
  const current = [...props.expanded]
  if (current.includes(id)) {
    emit('update:expanded', current.filter(x => x !== id))
  } else {
    emit('update:expanded', [...current, id])
  }
}

const typeLabels: Record<string, string> = {
  card: '卡片', tabs: '标签页', table: '表格', form: '表单', text: '文本',
  button: '按钮', input: '输入框', select: '下拉框', date: '日期', switch: '开关',
  slider: '滑块', lineChart: '折线图', barChart: '柱状图', pieChart: '饼图',
  grid: '栅格', divider: '分割线', blank: '空白', image: '图片', link: '链接',
  collapse: '折叠面板',
}

function getTypeLabel(type: string): string {
  return typeLabels[type] || type
}

function getIcon(type: string) {
  const icons: Record<string, any> = {
    card: Layout, tabs: Layout, table: Table, form: File, text: Type,
    button: Square, input: Type, select: Folder, date: Calendar, switch: ToggleLeft,
    slider: Minus, lineChart: LineChart, barChart: BarChart3, pieChart: PieChart,
    grid: Grid3X3, divider: Minus, blank: Square, image: Image, link: Link2,
    collapse: ChevronDown,
  }
  return icons[type] || File
}
</script>

<style scoped>
.tree-node:hover .opacity-0 { opacity: 1; }
</style>

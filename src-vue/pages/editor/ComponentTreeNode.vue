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
      <!-- Expand/collapse toggle for containers -->
      <span
        v-if="isContainer(comp.type) && hasChildren"
        @click.stop="toggleExpand(String(comp.id))"
        class="p-0.5 hover:bg-[var(--bg-hover)] rounded"
      >
        <ChevronDown v-if="props.expanded.has(String(comp.id))" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </span>
      <span v-else class="w-4" />

      <!-- Type icon -->
      <component :is="getIcon(comp.type)" class="w-3 h-3 text-[var(--text-muted)]" />
      
      <!-- Label -->
      <span class="text-xs truncate flex-1">{{ comp.label || getTypeLabel(comp.type) }}</span>
      <span class="text-xs text-[var(--text-muted)]">({{ getTypeLabel(comp.type) }})</span>

      <!-- Delete button -->
      <button
        @click.stop="emit('delete', comp.id)"
        class="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
      >
        <Trash2 class="w-3 h-3 text-red-500" />
      </button>
    </div>

    <!-- Children (recursive) -->
    <template v-if="(isContainer(comp.type) && props.expanded.has(String(comp.id)) && hasChildren) || comp.type === 'tabs'">
      <span style="color:red;font-size:10px">OUTER: type={{comp.type}} isC={{isContainer(comp.type)}} exp={{props.expanded.has(String(comp.id))}} hasC={{hasChildren}}</span>
      <!-- For tabs: render virtual tab nodes, each containing its children -->
      <template v-if="comp.type === 'tabs'">
        <span style="color:green;font-size:10px">TABS BRANCH: comp.type={{comp.type}} id={{comp.id}} cm={{JSON.stringify(comp.props?.childrenMap)}}</span>
        <span :data-debug="'tabs:' + comp.id + ',cm:' + JSON.stringify(comp.props?.childrenMap) + ',children:' + (comp.children?.length||0)" style="color:blue;font-size:10px">DEBUG: type={{comp.type}} childrenMap={{JSON.stringify(comp.props?.childrenMap)}} children={{comp.children?.length}}</span>
        <template v-for="(childIds, tabKey) in (comp.props?.childrenMap || {})" :key="tabKey">
          <ComponentTreeNode
            :comp="{ id: comp.id + '-tab-' + tabKey, type: 'tab', label: 'Tab ' + (Number(tabKey) + 1), children: getTabChildren(tabKey) }"
            :depth="depth + 1"
            :selected-id="selectedId"
            :expanded="expanded"
            @select="emit('select', $event)"
            @delete="emit('delete', $event)"
          />
        </template>
      </template>
      <!-- For other containers: render direct children -->
      <ComponentTreeNode
        v-else
        v-for="child in comp.children"
        :key="child.id"
        :comp="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :expanded="expanded"
        @select="emit('select', $event)"
        @delete="emit('delete', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref } from 'vue'
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
  expanded: Ref<Set<string>>
}>()

const emit = defineEmits<{
  select: [id: string]
  delete: [id: string]
  'toggle-expand': [id: string]
}>()

const containerTypes = ['card', 'tabs', 'collapse', 'grid']


// For tabs: get children of a specific tab
function getTabChildren(tabKey: string) {
  const childrenMap = props.comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
  if (!childrenMap || !childrenMap[tabKey]) return []
  const childIds = childrenMap[tabKey]
  return (props.comp.children || []).filter(c => childIds.includes(c.componentId as any) || childIds.includes(c.id as any))
}

const hasChildren = computed(() => {
  // Debug
  const type = props.comp.type
  const childCount = props.comp.children?.length || 0
  const childrenMap = props.comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
  const cmKeys = childrenMap ? Object.keys(childrenMap) : []
  const hasCM = cmKeys.length > 0
  if (type === 'table') {
    console.log('[hasChildren TABLE]', props.comp.id, 'children:', childCount, 'cmKeys:', cmKeys)
  }
  // Direct children (card, collapse, grid)
  if (props.comp.children && props.comp.children.length > 0) return true
  // Tabs: childrenMap contains tab children
  if (hasCM) return true
  return false
})

function isContainer(type: string): boolean {
  return containerTypes.includes(type)
}

function toggleExpand(id: string) {
  console.log('[toggleExpand] called with id:', id, 'expanded:', [...props.expanded])
  emit('toggle-expand', id)
}

const typeLabels: Record<string, string> = {
  card: '卡片',
  tabs: '标签页',
  table: '表格',
  form: '表单',
  text: '文本',
  button: '按钮',
  input: '输入框',
  select: '下拉框',
  date: '日期',
  switch: '开关',
  slider: '滑块',
  lineChart: '折线图',
  barChart: '柱状图',
  pieChart: '饼图',
  grid: '栅格',
  divider: '分割线',
  blank: '空白',
  image: '图片',
  link: '链接',
  collapse: '折叠面板',
}

function getTypeLabel(type: string): string {
  return typeLabels[type] || type
}

function getIcon(type: string) {
  const icons: Record<string, any> = {
    card: Layout,
    tabs: Layout,
    table: Table,
    form: File,
    text: Type,
    button: Square,
    input: Type,
    select: Folder,
    date: Calendar,
    switch: ToggleLeft,
    slider: Minus,
    lineChart: LineChart,
    barChart: BarChart3,
    pieChart: PieChart,
    grid: Grid3X3,
    divider: Minus,
    blank: Square,
    image: Image,
    link: Link2,
    collapse: ChevronDown,
  }
  return icons[type] || File
}
</script>

<style scoped>
.tree-node:hover .opacity-0 {
  opacity: 1;
}
</style>

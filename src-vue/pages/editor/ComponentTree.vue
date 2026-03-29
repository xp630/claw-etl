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
        <div v-for="comp in props.components" :key="comp.id" class="tree-node">
          <div
            class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors"
            :class="{
              'bg-[var(--accent-light)] text-[var(--accent)]': props.selectedId === comp.id,
              'hover:bg-[var(--bg-hover)]': props.selectedId !== comp.id
            }"
            :style="{ paddingLeft: `${0 * 16 + 8}px` }"
            @click="emit('select', comp.id)"
          >
            <span
              v-if="isContainer(comp.type) && comp.children?.length"
              @click.stop="toggleExpand(comp.id!)"
              class="p-0.5 hover:bg-[var(--bg-hover)] rounded"
            >
              <ChevronDown v-if="expanded.has(comp.id!)" class="w-4 h-4" />
              <ChevronRight v-else class="w-4 h-4" />
            </span>
            <span v-else class="w-4" />
            <File class="w-3 h-3 text-[var(--text-muted)]" />
            <span class="text-xs truncate">{{ comp.label || getTypeLabel(comp.type) }}</span>
            <span class="text-xs text-[var(--text-muted)] ml-auto">({{ getTypeLabel(comp.type) }})</span>
            <button
              @click.stop="emit('delete', comp.id)"
              class="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
            >
              <Trash2 class="w-3 h-3 text-red-500" />
            </button>
          </div>

          <!-- Children -->
          <div v-if="isContainer(comp.type) && expanded.has(comp.id!) && comp.children?.length">
            <div
              v-for="child in comp.children"
              :key="child.id"
              class="flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors"
              :class="{
                'bg-[var(--accent-light)] text-[var(--accent)]': props.selectedId === child.id,
                'hover:bg-[var(--bg-hover)]': props.selectedId !== child.id
              }"
              :style="{ paddingLeft: `${1 * 16 + 8}px` }"
              @click="emit('select', child.id)"
            >
              <span class="w-4" />
              <File class="w-3 h-3 text-[var(--text-muted)]" />
              <span class="text-xs truncate">{{ child.label || getTypeLabel(child.type) }}</span>
              <span class="text-xs text-[var(--text-muted)] ml-auto">({{ getTypeLabel(child.type) }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, ChevronDown, File, Folder, Layout, Table, Trash2 } from 'lucide-vue-next'
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

const expanded = ref<Set<string>>(new Set())

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

const containerTypes = ['card', 'tabs', 'collapse', 'grid']

function getTypeLabel(type: string): string {
  return typeLabels[type] || type
}

function isContainer(type: string): boolean {
  return containerTypes.includes(type)
}

function toggleExpand(id: string) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}
</script>

<style scoped>
.tree-node:hover .opacity-0 {
  opacity: 1;
}
</style>

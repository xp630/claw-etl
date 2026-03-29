<template>
  <div class="component-renderer">
    <!-- Text component -->
    <div v-if="component.type === 'text'" class="text-sm text-[var(--text-primary)]">
      {{ component.props.content || '文本' }}
    </div>

    <!-- Button component -->
    <button
      v-else-if="component.type === 'button'"
      type="button"
      :class="buttonClass"
    >
      {{ component.props.text || '按钮' }}
    </button>

    <!-- Input component -->
    <div v-else-if="component.type === 'input'" class="flex flex-col gap-1">
      <label v-if="component.props.label" class="text-xs text-[var(--text-muted)]">
        {{ component.props.label }}
      </label>
      <input
        type="text"
        :placeholder="String(component.props.placeholder || '')"
        class="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-blue-500"
      />
    </div>

    <!-- Select component -->
    <div v-else-if="component.type === 'select'" class="flex flex-col gap-1">
      <label v-if="component.props.label" class="text-xs text-[var(--text-muted)]">
        {{ component.props.label }}
      </label>
      <select class="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-blue-500">
        <option value="">{{ component.props.placeholder || '请选择' }}</option>
        <option
          v-for="(opt, i) in (component.props.options as string[] || [])"
          :key="i"
          :value="opt"
        >
          {{ opt }}
        </option>
      </select>
    </div>

    <!-- Date component -->
    <div v-else-if="component.type === 'date'" class="flex flex-col gap-1">
      <label v-if="component.props.label" class="text-xs text-[var(--text-muted)]">
        {{ component.props.label }}
      </label>
      <input
        type="date"
        class="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-blue-500"
      />
    </div>

    <!-- Switch component -->
    <div v-else-if="component.type === 'switch'" class="flex items-center gap-2">
      <label v-if="component.props.label" class="text-xs text-[var(--text-muted)]">
        {{ component.props.label }}
      </label>
      <button
        type="button"
        :class="['w-10 h-5 rounded-full transition-colors', component.props.value ? 'bg-blue-500' : 'bg-gray-300']"
      >
        <div
          :class="[
            'w-4 h-4 bg-white rounded-full shadow transition-transform',
            component.props.value ? 'translate-x-5' : 'translate-x-0.5'
          ]"
        />
      </button>
    </div>

    <!-- Slider component -->
    <div v-else-if="component.type === 'slider'" class="flex flex-col gap-1 w-full">
      <label v-if="component.props.label" class="text-xs text-[var(--text-muted)]">
        {{ component.props.label }}
      </label>
      <input
        type="range"
        :min="Number(component.props.min) || 0"
        :max="Number(component.props.max) || 100"
        :value="Number(component.props.value) || 50"
        class="w-full"
      />
      <div class="text-xs text-[var(--text-muted)] text-center">
        {{ Number(component.props.value) || 50 }}
      </div>
    </div>

    <!-- Table component -->
    <div v-else-if="component.type === 'table'" class="border border-[var(--border-light)] rounded overflow-hidden">
      <!-- Table Header -->
      <div class="bg-[var(--bg-table-header)] px-3 py-2 border-b border-[var(--border-light)] flex items-center justify-between">
        <span class="text-sm font-medium">{{ component.props.title || '数据表' }}</span>
        <div class="flex gap-2">
          <span v-if="component.props.showAdd" class="text-xs px-2 py-1 border border-[var(--border)] rounded">➕ 新增</span>
          <span v-if="component.props.showExport" class="text-xs px-2 py-1 border border-[var(--border)] rounded">📤 导出</span>
        </div>
      </div>
      <!-- Search Bar -->
      <div v-if="component.props.showSearch" class="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)] flex gap-2">
        <input
          type="text"
          class="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded"
          placeholder="搜索..."
          disabled
        />
        <button class="px-3 py-1 text-xs bg-[var(--accent)] text-white rounded" disabled>查询</button>
        <button class="px-3 py-1 text-xs border border-[var(--border)] rounded" disabled>重置</button>
      </div>
      <!-- Table Preview -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[var(--bg-hover)]">
              <th
                v-for="(col, index) in (component.props.columns || []).slice(0, 6)"
                :key="index"
                class="px-3 py-2 text-left font-medium text-[var(--text-secondary)] border-r border-[var(--border-light)] last:border-r-0"
              >
                {{ col.label || col.key || `列${index + 1}` }}
                <span v-if="col.sortable" class="text-[var(--text-muted)] ml-1">↕</span>
              </th>
              <th v-if="(component.props.columns?.length || 0) > 6" class="px-3 py-2 text-[var(--text-muted)]">
                +{{ (component.props.columns?.length || 0) - 6 }} 列
              </th>
              <th v-if="component.props.columns?.length === 0" class="px-3 py-2 text-[var(--text-muted)]">
                未配置列
              </th>
              <th v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-[var(--border-light)]">
              <td
                v-for="(col, index) in (component.props.columns || []).slice(0, 6)"
                :key="index"
                class="px-3 py-2 text-[var(--text-muted)] border-r border-[var(--border-light)] last:border-r-0"
              >
                ...
              </td>
              <td v-if="(component.props.columns?.length || 0) > 6" class="px-3 py-2 text-[var(--text-muted)]">
              </td>
              <td v-if="component.props.columns?.length === 0" class="px-3 py-2 text-[var(--text-muted)]">
              </td>
              <td v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)]">
                <span v-if="component.props.showDetail" class="text-xs text-[var(--accent)] mr-2">详情</span>
                <span v-if="component.props.showEdit" class="text-xs text-[var(--accent)] mr-2">编辑</span>
                <span v-if="component.props.showDelete" class="text-xs text-[var(--danger)]">删除</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination Footer -->
      <div v-if="component.props.pagination" class="bg-[var(--bg-table-header)] px-3 py-2 border-t border-[var(--border-light)] flex items-center justify-between">
        <span class="text-xs text-[var(--text-muted)]">共 ? 条</span>
        <div class="flex items-center gap-1">
          <span class="px-2 py-1 text-xs border border-[var(--border)] rounded cursor-not-allowed opacity-50">‹</span>
          <span class="px-2 py-1 text-xs bg-[var(--accent)] text-white rounded">1</span>
          <span class="px-2 py-1 text-xs border border-[var(--border)] rounded cursor-not-allowed opacity-50">›</span>
        </div>
      </div>
    </div>

    <!-- Form component -->
    <div v-else-if="component.type === 'form'" class="border border-[var(--border-light)] rounded p-4 bg-[var(--bg-table-header)]">
      <div class="text-sm text-[var(--text-secondary)]">
        📝 表单组件 - {{ component.props.title || '表单' }}
      </div>
      <div class="text-xs text-[var(--text-muted)] mt-1">
        数据源ID: {{ component.props.datasourceId || '未配置' }}
      </div>
    </div>

    <!-- Chart components -->
    <div
      v-else-if="['lineChart', 'barChart', 'pieChart'].includes(component.type)"
      class="border border-[var(--border-light)] rounded p-4 bg-[var(--bg-table-header)] text-center"
    >
      <div class="text-sm text-[var(--text-secondary)]">
        {{ chartIcon }} {{ component.props.title || component.type }}
      </div>
    </div>

    <!-- Grid component -->
    <div
      v-else-if="component.type === 'grid'"
      class="border border-[var(--border-light)] rounded p-3 bg-[var(--bg-table-header)]"
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${Number(component.props.cols) || 3}, 1fr)`,
        gap: `${Number(component.props.gap) || 10}px`
      }"
    >
      <div class="text-xs text-[var(--text-muted)] text-center py-4">栅格布局</div>
    </div>

    <!-- Divider component -->
    <hr v-else-if="component.type === 'divider'" class="border-[var(--border)] my-2" />

    <!-- Blank component -->
    <div
      v-else-if="component.type === 'blank'"
      class="bg-gradient-to-r from-gray-100 to-gray-50"
      :style="{ height: `${Number(component.props.height) || 50}px` }"
    />

    <!-- Image component -->
    <img
      v-else-if="component.type === 'image'"
      :src="String(component.props.src || 'https://via.placeholder.com/200x100')"
      :alt="String(component.props.alt || '图片')"
      class="max-w-full h-auto"
    />

    <!-- Link component -->
    <a
      v-else-if="component.type === 'link'"
      :href="String(component.props.url || '#')"
      class="text-blue-500 hover:underline text-sm"
    >
      {{ component.props.text || '链接' }}
    </a>

    <!-- Card container -->
    <div
      v-else-if="component.type === 'card'"
      class="border border-[var(--border-light)] rounded-lg p-4 bg-[var(--bg-secondary)] shadow-sm"
    >
      <div v-if="component.props.title" class="font-medium mb-2">
        {{ component.props.title }}
      </div>
      <slot />
    </div>

    <!-- Tabs container -->
    <div v-else-if="component.type === 'tabs'">
      <div class="flex border-b border-[var(--border-light)] mb-2">
        <button
          v-for="(tabTitle, index) in tabTitles"
          :key="index"
          class="px-4 py-2 text-sm transition-colors"
          :class="[
            currentTabIndex === index
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          ]"
          @click="handleTabClick(index)"
        >
          {{ tabTitle }}
        </button>
      </div>
      <slot />
    </div>

    <!-- Collapse container -->
    <div v-else-if="component.type === 'collapse'" class="border border-[var(--border-light)] rounded">
      <div
        class="p-3 bg-[var(--bg-table-header)] cursor-pointer flex justify-between items-center"
        @click="handleCollapseClick"
      >
        <span>{{ component.props.title || '折叠面板' }}</span>
        <span>{{ isCollapsed ? '▼' : '▲' }}</span>
      </div>
      <div v-show="!isCollapsed" class="p-3">
        <slot />
      </div>
    </div>

    <!-- Unknown component -->
    <div v-else class="text-[var(--text-muted)] text-sm">
      未知组件: {{ component.type }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CanvasComponent } from './types'

interface Props {
  component: CanvasComponent
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

const emit = defineEmits<{
  'update-component': [id: string, key: string, value: any]
}>()

// ============ State ============

// Tabs: use local state only in editable mode, otherwise use prop
const currentTabIndex = ref(Number(props.component.props.activeTab) || 0)

watch(() => props.component.props.activeTab, (val) => {
  if (!props.editable) {
    currentTabIndex.value = Number(val) || 0
  }
})

// Collapse: use local state only in editable mode
const isCollapsed = ref(false)

// ============ Computed ============

// Tabs titles from tabs array prop
const tabTitles = computed(() => {
  const tabs = props.component.props.tabs as string[] | undefined
  if (tabs && tabs.length > 0) return tabs
  const count = (props.component.props.tabCount as number) || 2
  return Array.from({ length: count }, (_, i) => props.component.props[`tab${i}Title`] as string || `标签页 ${i + 1}`)
})

// Chart icon
const chartIcon = computed(() => {
  switch (props.component.type) {
    case 'lineChart': return '📈'
    case 'barChart': return '📊'
    case 'pieChart': return '🥧'
    default: return '📊'
  }
})

// Button class
const buttonClass = computed(() => {
  const btnType = props.component.props.buttonType || 'primary'
  const baseClass = 'px-4 py-1.5 text-sm rounded'
  switch (btnType) {
    case 'primary': return `${baseClass} bg-blue-500 text-white`
    case 'success': return `${baseClass} bg-green-500 text-white`
    case 'warning': return `${baseClass} bg-yellow-500 text-white`
    case 'danger': return `${baseClass} bg-red-500 text-white`
    case 'default': return `${baseClass} bg-[var(--bg-table-header)] text-[var(--text-secondary)]`
    default: return `${baseClass} bg-blue-500 text-white`
  }
})

// ============ Event Handlers ============

function handleTabClick(index: number) {
  if (props.editable) {
    emit('update-component', props.component.id, 'activeTab', index)
  } else {
    currentTabIndex.value = index
  }
}

function handleCollapseClick() {
  if (props.editable) {
    // In editable mode, emit event
    emit('update-component', props.component.id, 'collapsed', !isCollapsed.value)
  } else {
    // In preview mode, use local state
    isCollapsed.value = !isCollapsed.value
  }
}
</script>

<style scoped>
.component-renderer {
  width: 100%;
}
</style>

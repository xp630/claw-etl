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
          <span v-if="component.props.showAdd" class="text-xs px-2 py-1 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--bg-hover)]">➕ 新增</span>
          <span v-if="component.props.showExport" class="text-xs px-2 py-1 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--bg-hover)]">📤 导出</span>
        </div>
      </div>
      <!-- Search Bar -->
      <div v-if="component.props.showSearch" class="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)] flex gap-2">
        <input
          type="text"
          class="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded"
          placeholder="搜索..."
        />
        <button class="px-3 py-1 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">查询</button>
        <button class="px-3 py-1 text-xs border border-[var(--border)] rounded cursor-pointer">重置</button>
      </div>
      <!-- Table with all columns and horizontal scroll -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[var(--bg-hover)]">
              <th
                v-for="col in (component.props.columns || [])"
                :key="col.key || col.fieldName"
                class="px-3 py-2 text-left font-medium text-[var(--text-secondary)] border-r border-[var(--border-light)] last:border-r-0 whitespace-nowrap"
                :style="{ minWidth: '80px' }"
              >
                {{ col.label || col.key || col.fieldName }}
                <span v-if="col.sortable" class="text-[var(--text-muted)] ml-1">↕</span>
              </th>
              <th v-if="component.props.columns?.length === 0" class="px-3 py-2 text-[var(--text-muted)]">
                未配置列
              </th>
              <th v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)] min-w-[120px]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- 有 queryApiId：调用 API 获取真实数据 -->
            <template v-if="component.props.queryApiId">
              <tr v-if="tableLoading" class="border-b border-[var(--border-light)]">
                <td :colspan="(component.props.columns?.length || 0) + 1" class="px-3 py-8 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
              <tr v-else-if="tableData.length === 0" class="border-b border-[var(--border-light)]">
                <td :colspan="(component.props.columns?.length || 0) + 1" class="px-3 py-8 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
              <tr v-for="(row, rowIndex) in tableData" :key="'api-' + rowIndex" class="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover-light)]">
                <td
                  v-for="col in (component.props.columns || [])"
                  :key="col.key || col.fieldName"
                  class="px-3 py-2 border-r border-[var(--border-light)] last:border-r-0 whitespace-nowrap"
                >
                  {{ getCellValue(row, col) }}
                </td>
                <td v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)] whitespace-nowrap">
                  <span v-if="component.props.showDetail" class="text-xs text-[var(--accent)] mr-2 cursor-pointer hover:underline">详情</span>
                  <span v-if="component.props.showEdit" class="text-xs text-[var(--accent)] mr-2 cursor-pointer hover:underline">编辑</span>
                  <span v-if="component.props.showDelete" class="text-xs text-[var(--danger)] cursor-pointer hover:underline">删除</span>
                </td>
              </tr>
            </template>
            <!-- 无 queryApiId：显示预览数据 -->
            <template v-else>
              <tr v-for="rowIndex in 5" :key="'preview-' + rowIndex" class="border-b border-[var(--border-light)]">
                <td
                  v-for="col in (component.props.columns || [])"
                  :key="col.key || col.fieldName"
                  class="px-3 py-2 text-[var(--text-muted)] border-r border-[var(--border-light)] last:border-r-0 whitespace-nowrap"
                >
                  {{ col.label || col.key || col.fieldName }}-{{ rowIndex }}
                </td>
                <td v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)]">
                  <span v-if="component.props.showDetail" class="text-xs text-[var(--accent)] mr-2">详情</span>
                  <span v-if="component.props.showEdit" class="text-xs text-[var(--accent)] mr-2">编辑</span>
                  <span v-if="component.props.showDelete" class="text-xs text-[var(--danger)]">删除</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <!-- Pagination Footer -->
      <div v-if="component.props.pagination" class="bg-[var(--bg-table-header)] px-3 py-2 border-t border-[var(--border-light)] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--text-muted)]">共 {{ tableTotal }} 条</span>
          <select
            v-model="pageSize"
            class="px-2 py-1 text-xs border border-[var(--border)] rounded"
            @change="handlePageSizeChange"
          >
            <option :value="5">5条/页</option>
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
          </select>
        </div>
        <div class="flex items-center gap-1">
          <button
            class="px-2 py-1 text-xs border border-[var(--border)] rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="tablePage <= 1"
            @click="tablePage--; loadTableData()"
          >
            ‹
          </button>
          <span class="px-2 py-1 text-xs">
            第 {{ tablePage }} / {{ totalPages }} 页
          </span>
          <button
            class="px-2 py-1 text-xs border border-[var(--border)] rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="tablePage >= totalPages"
            @click="tablePage++; loadTableData()"
          >
            ›
          </button>
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
      <!-- Tab 标题显示 -->
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
      <!-- Tab 内容 - 画布模式下从 childrenMap 获取子组件 -->
      <div v-if="editable" class="min-h-[100px]">
        <div v-if="tabChildren.length > 0" class="flex flex-col gap-2">
          <div
            v-for="child in tabChildren"
            :key="child.id"
            class="bg-[var(--bg-primary)] rounded"
          >
            <ComponentRenderer :component="child" :editable="true" />
          </div>
        </div>
        <div v-else class="min-h-[100px] bg-[var(--bg-hover-light)] rounded border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
          拖拽组件到标签页
        </div>
      </div>
      <!-- 非画布模式使用 slot -->
      <slot v-else />
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
import { computed, ref, watch, onMounted } from 'vue'
import { api } from '@/lib/api'
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

// Tabs: get children for current tab
const tabChildren = computed(() => {
  const childrenMap = props.component.props?.childrenMap as Record<string, string[]> | undefined
  if (childrenMap) {
    const tabKey = String(currentTabIndex.value)
    const childIds = childrenMap[tabKey] || []
    return (props.component.children || []).filter(c => childIds.includes(c.id))
  }
  return props.component.children || []
})

// Table data
const tableData = ref<any[]>([])
const tableLoading = ref(false)
const tableTotal = ref(0)
const tablePage = ref(1)
const pageSize = ref(10)

// Total pages computed
const totalPages = computed(() => {
  return Math.ceil(tableTotal.value / pageSize.value) || 1
})

// Load table data when queryApiId changes
watch(() => props.component.props.queryApiId, async (apiId) => {
  if (apiId) {
    tablePage.value = 1
    await loadTableData()
  } else {
    tableData.value = []
    tableTotal.value = 0
  }
}, { immediate: true })

onMounted(async () => {
  if (props.component.props.queryApiId) {
    await loadTableData()
  }
})

function handlePageSizeChange() {
  tablePage.value = 1
  loadTableData()
}

async function loadTableData() {
  const apiId = props.component.props.queryApiId
  if (!apiId) return
  
  tableLoading.value = true
  try {
    // 调用 API 获取数据
    const res = await api.post('/apiManager/detail', { id: apiId })
    if (res.data?.code === 0 || res.data?.code === 1) {
      const apiDetail = res.data?.data
      if (apiDetail?.path) {
        // 调用实际的业务接口获取数据
        const dataRes = await api.post(apiDetail.path, { page: tablePage.value, pageSize: pageSize.value })
        if (dataRes.data?.code === 0 || dataRes.data?.code === 1) {
          tableData.value = dataRes.data?.data?.list || dataRes.data?.data || []
          tableTotal.value = dataRes.data?.data?.total || tableData.value.length || 0
        }
      }
    }
  } catch (error) {
    console.error('Failed to load table data:', error)
    tableData.value = []
    tableTotal.value = 0
  } finally {
    tableLoading.value = false
  }
}

function getCellValue(row: any, col: any): string {
  const key = col.key || col.fieldName
  if (!key) return ''
  let val = row[key]
  // 处理数据字典
  if (col.dataDictionary && val !== null && val !== undefined) {
    // 暂时显示原始值
    return String(val)
  }
  return val !== null && val !== undefined ? String(val) : ''
}

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

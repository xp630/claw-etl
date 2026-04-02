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
    <div v-else-if="component.type === 'table'" class="border border-[var(--border-light)] rounded overflow-x-auto">
      <!-- Table Header -->
      <div class="bg-[var(--bg-table-header)] px-3 py-2 border-b border-[var(--border-light)] flex items-center justify-between">
        <span class="text-sm font-medium">{{ component.props.title || '数据表' }}</span>
        <div class="flex gap-2">
          <span v-if="component.props.showAdd" class="text-xs px-2 py-1 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--bg-hover)]">➕ 新增</span>
          <span v-if="component.props.showExport" class="text-xs px-2 py-1 border border-[var(--border)] rounded cursor-pointer hover:bg-[var(--bg-hover)]">📤 导出</span>
        </div>
      </div>
      <!-- Search Bar -->
      <div v-if="component.props.showSearch && queryColumns.length > 0" class="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)] flex gap-3 flex-wrap items-center">
        <div
          v-for="col in queryColumns"
          :key="col.key || col.fieldName"
          class="flex items-center gap-1 shrink-0"
        >
          <span class="text-xs text-[var(--text-muted)] whitespace-nowrap truncate max-w-[80px]" :title="col.label || col.key || col.fieldName">{{ col.label || col.key || col.fieldName }}:</span>
          <!-- Select with dict or fixed values -->
          <select
            v-if="col.fieldType === 'select'"
            v-model="tableSearchParams[col.key || col.fieldName]"
            class="px-1 py-1 text-xs border border-[var(--border)] rounded w-[100px] shrink-0 bg-[var(--el-fill-color-blank)]"
            style="color: var(--el-text-color-regular);"
          >
            <option value="">请选择</option>
            <option
              v-for="item in getColumnOptions(col)"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
          <!-- Date picker -->
          <input
            v-else-if="col.fieldType === 'date'"
            type="date"
            v-model="tableSearchParams[col.key || col.fieldName]"
            class="px-1 py-1 text-xs border border-[var(--border)] rounded w-[100px] shrink-0 bg-[var(--el-fill-color-blank)] text-[var(--text-primary)]"
          />
          <!-- Number input -->
          <input
            v-else-if="col.fieldType === 'number'"
            type="number"
            v-model="tableSearchParams[col.key || col.fieldName]"
            class="px-1 py-1 text-xs border border-[var(--border)] rounded w-[100px] shrink-0 bg-[var(--el-fill-color-blank)] text-[var(--text-primary)]"
            placeholder="输入"
          />
          <!-- Text input (default) -->
          <input
            v-else
            type="text"
            v-model="tableSearchParams[col.key || col.fieldName]"
            class="px-1 py-1 text-xs border border-[var(--border)] rounded w-[100px] shrink-0 bg-[var(--el-fill-color-blank)] text-[var(--text-primary)]"
            placeholder="输入"
          />
        </div>
        <button class="px-3 py-1 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">查询</button>
        <button
          class="px-3 py-1 text-xs border border-[var(--border)] rounded cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          @click="tableSearchParams = {}"
        >重置</button>
      </div>
      <!-- Table with all columns, horizontal scroll and vertical scroll -->
      <div class="overflow-x-auto" :class="{ 'max-h-[300px] overflow-y-auto': editable }">
        <table class="w-full text-sm bg-[var(--bg-primary)]" style="table-layout: fixed;">
          <colgroup>
            <col v-for="(col, idx) in component.props.columns" :key="idx" :style="{ minWidth: (col.colspan || 1) * 150 + 'px' }" />
            <col v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" style="minWidth: 120px" />
          </colgroup>
          <thead class="sticky top-0 z-10 bg-[var(--bg-table-header)]">
            <tr>
              <th
                v-for="col in (component.props.columns || [])"
                :key="col.key || col.fieldName"
                class="px-3 text-left font-medium text-[var(--text-secondary)] border-r border-[var(--border-light)] last:border-r-0 overflow-hidden whitespace-nowrap"
                :class="getOverflowClass(col.headerOverflow)"
                :style="{
                  minWidth: (col.colspan || 1) * 150 + 'px',
                  height: component.props.headerHeight === 'small' ? '32px' : component.props.headerHeight === 'large' ? '48px' : '40px',
                  lineHeight: component.props.headerHeight === 'small' ? '32px' : component.props.headerHeight === 'large' ? '48px' : '40px',
                  maxWidth: (col.colspan || 1) * 120 + 'px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }"
              >
                <span :title="col.label || col.key || col.fieldName">{{ col.label || col.key || col.fieldName }}</span>
                <span v-if="col.sortable" class="text-[var(--text-muted)] ml-1">↕</span>
              </th>
              <th v-if="component.props.columns?.length === 0" class="px-3 py-2 text-[var(--text-muted)]">
                未配置列
              </th>
              <th v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)]" style="width: 120px; minWidth: 120px;">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- 有 queryApiId：调用 API 获取真实数据 -->
            <template v-if="component.props.queryApiId">
              <tr v-if="tableLoading" class="border-b border-[var(--border-light)]">
                <td :colspan="(component.props.columns?.length || 0) + ((component.props.showEdit || component.props.showDelete || component.props.showDetail) ? 1 : 0)" class="px-3 py-8 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
              <tr v-else-if="tableData.length === 0" class="border-b border-[var(--border-light)]">
                <td :colspan="(component.props.columns?.length || 0) + ((component.props.showEdit || component.props.showDelete || component.props.showDetail) ? 1 : 0)" class="px-3 py-8 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
              <tr v-for="(row, rowIndex) in tableData" :key="'api-' + rowIndex" class="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover)]">
                <td
                  v-for="col in (component.props.columns || [])"
                  :key="col.key || col.fieldName"
                  class="px-3 py-2 border-r border-[var(--border-light)] last:border-r-0 overflow-hidden"
                  :class="getOverflowClass(col.overflow)"
                  :style="{ minWidth: (col.colspan || 1) * 150 + 'px' }"
                >
                  <img
                    v-if="col.fieldType === 'image' && getCellValue(row, col)"
                    :src="getCellValue(row, col)"
                    class="h-8 w-auto object-cover rounded"
                    @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
                  />
                  <span v-else>{{ getCellValue(row, col) }}</span>
                </td>
                <td v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)] overflow-hidden" style="minWidth: 120px;">
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
                  class="px-3 py-2 text-[var(--text-muted)] border-r border-[var(--border-light)] last:border-r-0 overflow-hidden"
                  :class="getOverflowClass(col.overflow)"
                  :style="{ minWidth: (col.colspan || 1) * 150 + 'px' }"
                >
                  {{ col.label || col.key || col.fieldName }}-{{ rowIndex }}
                </td>
                <td v-if="component.props.showEdit || component.props.showDelete || component.props.showDetail" class="px-3 py-2 text-center border-l border-[var(--border-light)] overflow-hidden" style="minWidth: 120px;">
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
      <div v-if="component.props.pagination" class="bg-[var(--bg-secondary)] px-3 py-2 border-t border-[var(--border-light)] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--text-muted)]">共 {{ tableTotal }} 条</span>
          <select
            v-model="pageSize"
            class="px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--el-fill-color-blank)] text-[var(--text-primary)]"
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
            :disabled="tablePage <= 1 || props.editable"
            @click="!props.editable && (tablePage--, loadTableData())"
          >
            ‹
          </button>
          <span class="px-2 py-1 text-xs">
            第 {{ tablePage }} / {{ totalPages }} 页
          </span>
          <button
            class="px-2 py-1 text-xs border border-[var(--border)] rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="tablePage >= totalPages || props.editable"
            @click="!props.editable && (tablePage++, loadTableData())"
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
      <!-- Show children if available -->
      <div v-if="showChildren && showChildren.length > 0" class="flex flex-col gap-2">
        <div
          v-for="(child, idx) in showChildren"
          :key="child.id"
          class="relative bg-[var(--bg-primary)] rounded"
          :class="{ 'cursor-pointer': canvasMode }"
        >
          <div v-if="canvasMode" class="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--bg-primary)] rounded shadow flex items-center gap-1 p-1">
            <button
              @click.stop="emit('remove-child', props.containerId, child.id)"
              class="p-1 border border-red-300 rounded hover:bg-red-50 text-red-500"
              title="移除"
            >
              🗑
            </button>
          </div>
          <div @click.stop="canvasMode && emit('select', child.id)">
            <ComponentRenderer :component="child" :editable="canvasMode" :canvas-mode="canvasMode" />
          </div>
        </div>
      </div>
      <div v-else-if="canvasMode" class="min-h-[60px] bg-[var(--bg-hover-light)] rounded border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
        拖拽组件到卡片
      </div>
      <slot v-else-if="$slots.default" />
      <div v-else class="text-xs text-[var(--text-muted)] text-center py-4">
        暂无内容
      </div>
    </div>

    <!-- Tabs container -->
    <!-- Tabs container -->
    <div v-else-if="component.type === 'tabs'">
      <!-- DEBUG: print full tabs component structure -->
      <div style="display:none">{{ logTabs() }}</div>
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
          @click.stop="handleTabClick(index)"
          @dragover.prevent="onTabDragOver($event, index)"
          @dragleave="onTabDragLeave($event)"
        >
          {{ tabTitle }}
        </button>
      </div>
      <!-- Tab 内容 -->
      <div
        @dragover.prevent="onTabDragOver($event, currentTabIndex)"
        @drop.prevent="onTabDrop"
      >
        <!-- Show children if available -->
        <div v-if="tabChildren && tabChildren.length > 0" class="flex flex-col gap-2">
          <div
            v-for="(child, idx) in tabChildren"
            :key="child.id"
            class="relative bg-[var(--bg-primary)] rounded"
            :class="{ 'cursor-pointer': canvasMode }"
            :draggable="canvasMode"
            @dragstart="(e) => canvasMode && emit('drag-start-nested', e, props.component.id, idx)"
          >
            <!-- Child action buttons -->
            <div v-if="canvasMode" class="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--bg-primary)] rounded shadow flex items-center gap-1 p-1">
              <button
                @click.stop="emit('remove-child', props.containerId, child.id)"
                class="p-1 border border-red-300 rounded hover:bg-red-50 text-red-500"
                title="移除"
              >
                🗑
              </button>
            </div>
            <div @click.stop="canvasMode && emit('select', child.id)" @dblclick.stop="canvasMode && emit('open-props', child.id)">
              <ComponentRenderer :component="child" :editable="canvasMode" :canvas-mode="canvasMode" />
            </div>
          </div>
        </div>
        <div v-else-if="canvasMode" class="min-h-[60px] bg-[var(--bg-hover-light)] rounded border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
          拖拽组件到标签页 | activeTab={{ component.props.activeTab }} | tab0_children={{ (component.props.childrenMap || {})['0'] }} | comp.children={{ component.children ? component.children.map(c => c.id) : [] }} | showChildren={{ showChildren ? showChildren.map(c => c.id) : [] }}
        </div>
        <slot v-else-if="$slots.default" />
        <div v-else class="min-h-[60px] bg-[var(--bg-hover-light)] rounded border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
          暂无内容
        </div>
      </div>
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
        <!-- Show children if available -->
        <div v-if="showChildren && showChildren.length > 0" class="flex flex-col gap-2">
          <div
            v-for="(child, idx) in showChildren"
            :key="child.id"
            class="relative bg-[var(--bg-primary)] rounded"
            :class="{ 'cursor-pointer': canvasMode }"
            :draggable="canvasMode"
            @dragstart="(e) => canvasMode && emit('drag-start-nested', e, props.component.id, idx)"
          >
            <div v-if="canvasMode" class="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--bg-primary)] rounded shadow flex items-center gap-1 p-1">
              <button
                @click.stop="emit('remove-child', props.containerId, child.id)"
                class="p-1 border border-red-300 rounded hover:bg-red-50 text-red-500"
                title="移除"
              >
                🗑
              </button>
            </div>
            <div @click.stop="canvasMode && emit('select', child.id)" @dblclick.stop="canvasMode && emit('open-props', child.id)">
              <ComponentRenderer :component="child" :editable="canvasMode" :canvas-mode="canvasMode" />
            </div>
          </div>
        </div>
        <div v-else-if="canvasMode" class="min-h-[60px] bg-[var(--bg-hover-light)] rounded border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">
          拖拽组件到折叠面板
        </div>
        <slot v-else-if="$slots.default" />
        <div v-else class="text-xs text-[var(--text-muted)] text-center py-4">
          暂无内容
        </div>
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
import { api, getAllDictItems } from '@/lib/api'
import type { CanvasComponent } from './types'

interface Props {
  component: CanvasComponent
  editable?: boolean
  // canvas mode: true = canvas editing (no children rendering), false = preview/runtime (render children)
  canvasMode?: boolean
  // For canvas mode: pass children to render inside container
  showChildren?: CanvasComponent[]
  containerId?: string
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  canvasMode: false
})

const emit = defineEmits<{
  'update-component': [id: string, key: string, value: any]
  'remove-child': [containerId: string, childId: string]
  'drag-start-nested': [event: DragEvent, containerId: string, index: number]
  'select': [id: string]
  'drop': [data: any]
  'drop-on-tab': [containerId: string, tabIndex: number, data: any]
}>()

// ============ State ============

// Tabs: track which tab is being dragged over for drop targeting
const dragOverTabIndex = ref<number | null>(null)

// Tabs: computed children from component.children + childrenMap (not from prop)
const tabChildren = computed(() => {
  const childrenMap = props.component.props?.childrenMap as Record<string, (string | number)[]> | undefined
  const activeTab = Number(props.component.props?.activeTab) || 0
  const tabKey = String(activeTab)
  const childIds = childrenMap?.[tabKey] || []
  const children = props.component.children || []
  const result = children.filter(c => childIds.includes(c.componentId as any) || childIds.includes(c.id as any))
  console.log('[tabChildren computed] activeTab:', activeTab, 'childIds:', childIds, 'children:', children.map(c => c.id), 'result:', result.map(c => c.id))
  return result
})

// Tabs: use local ref, synced with prop via watch
const currentTabIndex = ref(Number(props.component.props.activeTab) || 0)
watch(() => props.component.props.activeTab, (val) => {
  currentTabIndex.value = Number(val) || 0
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
const pageSize = ref(props.editable ? 5 : 10)

// Search params for table query
const tableSearchParams = ref<Record<string, any>>({})

// Query columns (filtered by queryCondition)
const queryColumns = computed(() => {
  return (props.component.props.columns || []).filter((col: any) => col.queryCondition)
})

// Dict items cache for select columns
const dictItemsCache = ref<Record<string, any[]>>({})

// Total pages computed
const totalPages = computed(() => {
  return Math.ceil(tableTotal.value / pageSize.value) || 1
})

// Load table data when queryApiId changes (only in preview mode, not editable)
watch(() => props.component.props.queryApiId, async (apiId) => {
  if (!props.editable) {
    if (apiId) {
      tablePage.value = 1
      await loadTableData()
    } else {
      tableData.value = []
      tableTotal.value = 0
    }
  }
}, { immediate: true })

// Reload dict cache when columns change (only in preview mode, not editable)
watch(() => props.component.props.columns, async () => {
  if (!props.editable && props.component.type === 'table') {
    await loadDictForColumns()
  }
}, { deep: true })

onMounted(async () => {
  console.log('[Table] ComponentRenderer mounted, type:', props.component.type, 'editable:', props.editable, 'queryApiId:', props.component.props.queryApiId)
  // Only load data in preview mode (not in editable/canvas mode)
  if (props.editable) return
  if (props.component.type === 'table') {
    await loadDictForColumns()
    if (props.component.props.queryApiId) {
      await loadTableData()
    }
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

function getCellValue(row: any, col: any): any {
  const key = col.key || col.fieldName
  if (!key) return ''
  let val = row[key]
  if (val === null || val === undefined) return ''

  // 处理图片类型 - 返回图片URL
  if (col.fieldType === 'image') {
    // val 可能是完整URL，也可能是相对路径
    if (String(val).startsWith('http')) {
      return val
    }
    // 相对路径，拼接基础URL
    return `${import.meta.env.VITE_API_BASE_URL || ''}${val}`
  }

  // 处理下拉类型 - 转换值为显示文本
  if (col.fieldType === 'select') {
    const options = getColumnOptions(col)
    const found = options.find(opt => String(opt.value) === String(val))
    return found ? found.label : String(val)
  }

  return String(val)
}

// 获取列的下拉选项（数据字典或固定值）
function getColumnOptions(col: any): { label: string; value: string }[] {
  // 优先使用固定值
  if (col.fixedValues) {
    console.log('[Table] getColumnOptions fixedValues:', col.fixedValues)
    // fixedValues 可能是 JSON 字符串，也可能是已经解析好的数组
    if (Array.isArray(col.fixedValues)) {
      const result = col.fixedValues.map((item: any) => ({
        label: item.label || item.itemLabel || String(item.value || item.itemValue),
        value: String(item.value || item.itemValue || '')
      }))
      console.log('[Table] getColumnOptions result from array:', result)
      return result
    }
    try {
      const result = JSON.parse(col.fixedValues)
      console.log('[Table] getColumnOptions result from JSON:', result)
      return result
    } catch {
      console.log('[Table] getColumnOptions JSON parse failed')
      return []
    }
  }
  // 其次使用数据字典（从缓存获取）
  if (col.dataDictionary) {
    const dictCode = col.dataDictionary
    if (dictItemsCache.value[dictCode]) {
      return dictItemsCache.value[dictCode].map((item: any) => ({
        label: item.itemLabel || item.label || item.name || String(item.itemValue || item.value),
        value: String(item.itemValue || item.value)
      }))
    }
  }
  return []
}

// 加载数据字典（批量加载所有查询列需要的字典）
async function loadDictForColumns() {
  const cols = (props.component.props.columns || []).filter((col: any) =>
    col.fieldType === 'select' && col.dataDictionary
  )
  console.log('[TableProps] loadDictForColumns called, select cols:', cols.length, cols.map((c: any) => c.dataDictionary))
  if (cols.length === 0) return

  try {
    const allDictItems = await getAllDictItems()
    console.log('[TableProps] getAllDictItems returned keys:', Object.keys(allDictItems))
    // allDictItems 是 Record<dictCode, DictItem[]>
    // 遍历需要的列，只缓存有数据的
    for (const col of cols) {
      const dictCode = col.dataDictionary
      console.log('[TableProps] looking for dictCode:', dictCode, 'exists:', !!allDictItems[dictCode])
      if (dictCode && allDictItems[dictCode]) {
        dictItemsCache.value[dictCode] = allDictItems[dictCode]
      }
    }
    console.log('[TableProps] dictItemsCache after load:', dictItemsCache.value)
  } catch (e) {
    console.error('Failed to load dict items:', e)
  }
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

// ============ Overflow ============

function getOverflowClass(mode?: string) {
  switch (mode) {
    case 'wrap': return 'whitespace-normal'
    case 'ellipsis': return 'whitespace-nowrap text-overflow-ellipsis overflow-hidden'
    case 'truncate': return 'whitespace-nowrap truncate'
    default: return 'whitespace-nowrap'
  }
}

// ============ Event Handlers ============

function handleTabClick(index: number) {
  if (props.editable) {
    currentTabIndex.value = index
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

// Tabs: drag over tab content area - track which tab we're over
function onTabDragOver(e: DragEvent, tabIndex: number) {
  if (!props.editable) return
  e.preventDefault()
  // Update BOTH currentTabIndex and dragOverTabIndex
  currentTabIndex.value = tabIndex
  dragOverTabIndex.value = tabIndex
  console.log('[ComponentRenderer] onTabDragOver tabIndex:', tabIndex, 'currentTabIndex:', currentTabIndex.value)
}

// Tabs: drag leave on tab button
function onTabDragLeave(e: DragEvent) {
  if (!props.editable) return
  dragOverTabIndex.value = null
}

// Tabs: drop on tab content area - emit with specific tab index
function onTabDrop(e: DragEvent) {
  if (!props.editable) return
  e.preventDefault()
  e.stopPropagation() // Prevent event from bubbling up to parent container's onDrop
  dragOverTabIndex.value = null
  const data = e.dataTransfer?.getData('application/json')
  console.log('[ComponentRenderer] onTabDrop called, data:', data)
  if (!data) return
  try {
    const parsed = JSON.parse(data)
    console.log('[ComponentRenderer] onTabDrop parsed:', parsed)
    emit('drop-on-tab', props.component.id, currentTabIndex.value, parsed)
  } catch (err) {
    console.error('Failed to parse drop data:', err)
  }
}
</script>

<style scoped>
.component-renderer {
  width: 100%;
}
</style>

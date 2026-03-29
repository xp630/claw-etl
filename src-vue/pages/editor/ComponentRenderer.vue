<template>
  <div class="component-renderer">
    <!-- Text component -->
    <div v-if="component.type === 'text'" class="text-sm text-[var(--text-primary)]">
      {{ component.props.content || '文本' }}
    </div>

    <!-- Button component -->
    <button
      v-else-if="component.type === 'button'"
      :type="'button'"
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

    <!-- Table component (simplified) -->
    <div v-else-if="component.type === 'table'" class="border border-[var(--border-light)] rounded p-4 bg-[var(--bg-table-header)]">
      <div class="text-sm text-[var(--text-secondary)]">
        📊 表格组件 - {{ component.props.title || '数据表' }}
      </div>
      <div class="text-xs text-[var(--text-muted)] mt-1">
        数据源ID: {{ component.props.apiId || component.props.queryApiId || '未配置' }}
      </div>
    </div>

    <!-- Form component (simplified) -->
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
            Number(component.props.activeTab) === index
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          ]"
          @click="setActiveTab(index)"
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
        @click="toggleCollapse"
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
import { computed, ref } from 'vue'
import type { CanvasComponent } from './types'

interface Props {
  component: CanvasComponent
}

const props = defineProps<Props>()

// Button class based on type
const buttonClass = computed(() => {
  const btnType = props.component.props.buttonType || 'primary'
  const baseClass = 'px-4 py-1.5 text-sm rounded'
  switch (btnType) {
    case 'primary':
      return `${baseClass} bg-blue-500 text-white`
    case 'success':
      return `${baseClass} bg-green-500 text-white`
    case 'warning':
      return `${baseClass} bg-yellow-500 text-white`
    case 'danger':
      return `${baseClass} bg-red-500 text-white`
    case 'default':
      return `${baseClass} bg-[var(--bg-table-header)] text-[var(--text-secondary)]`
    default:
      return `${baseClass} bg-blue-500 text-white`
  }
})

// Tabs titles from tabs array prop
const tabTitles = computed(() => {
  const tabs = props.component.props.tabs as string[] | undefined
  if (tabs && tabs.length > 0) return tabs
  // Fallback: generate from tabCount
  const count = (props.component.props.tabCount as number) || 2
  return Array.from({ length: count }, (_, i) => props.component.props[`tab${i}Title`] as string || `标签页 ${i + 1}`)
})

// Chart icon
const chartIcon = computed(() => {
  switch (props.component.type) {
    case 'lineChart':
      return '📈'
    case 'barChart':
      return '📊'
    case 'pieChart':
      return '🥧'
    default:
      return '📊'
  }
})

// Collapse state
const isCollapsed = ref(false)
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Set active tab
const setActiveTab = (index: number) => {
  // This would emit an event to update the component props
  console.log('Set active tab:', index)
}
</script>

<style scoped>
.component-renderer {
  width: 100%;
}
</style>

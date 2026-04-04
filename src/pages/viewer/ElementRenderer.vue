<template>
  <!-- Text -->
  <div v-if="type === 'text'" class="text-sm text-[var(--text-primary)]" :style="props.style">{{ props.content || '文本' }}</div>

  <!-- Button -->
  <button v-else-if="type === 'button'" :class="buttonClass">{{ props.text || '按钮' }}</button>

  <!-- Input -->
  <div v-else-if="type === 'input'" class="flex flex-col gap-1">
    <label v-if="props.label" class="text-xs text-[var(--text-muted)]">{{ props.label }}</label>
    <el-select v-if="props.dataDictionary" v-model="inputValue" :placeholder="props.placeholder || '请选择'" class="w-full" filterable>
      <el-option v-for="item in dictItems" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <input v-else type="text" v-model="inputValue" :placeholder="String(props.placeholder || '')" class="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-blue-500 w-full" />
  </div>

  <!-- Select -->
  <div v-else-if="type === 'select'" class="flex flex-col gap-1">
    <label v-if="props.label" class="text-xs text-gray-500">{{ props.label }}</label>
    <select v-model="inputValue" class="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-blue-500 w-full bg-[var(--input-bg)]">
      <option value="">{{ props.placeholder || '请选择' }}</option>
      <option v-for="(opt, i) in (props.options as string[] || [])" :key="i" :value="opt">{{ opt }}</option>
    </select>
  </div>

  <!-- Date -->
  <div v-else-if="type === 'date'" class="flex flex-col gap-1">
    <label v-if="props.label" class="text-xs text-[var(--text-muted)]">{{ props.label }}</label>
    <input type="date" v-model="inputValue" class="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-blue-500 w-full" />
  </div>

  <!-- Switch -->
  <div v-else-if="type === 'switch'" class="flex items-center gap-2">
    <label v-if="props.label" class="text-xs text-[var(--text-muted)]">{{ props.label }}</label>
    <el-switch v-model="switchValue" />
  </div>

  <!-- Slider -->
  <div v-else-if="type === 'slider'" class="flex flex-col gap-1 w-full">
    <label v-if="props.label" class="text-xs text-[var(--text-muted)]">{{ props.label }}</label>
    <el-slider v-model="sliderValue" :min="Number(props.min) || 0" :max="Number(props.max) || 100" />
    <div class="text-xs text-[var(--text-muted)] text-center">{{ sliderValue }}</div>
  </div>

  <!-- Table -->
  <div v-else-if="type === 'table'" class="border border-[var(--border-light)] rounded bg-[var(--bg-secondary)]">
    <el-table :data="tableData" stripe border style="width: 100%">
      <el-table-column v-for="col in tableColumns" :key="col.key" :prop="col.key" :label="col.label" :width="col.width" />
    </el-table>
  </div>

  <!-- Charts -->
  <div v-else-if="type === 'lineChart'" class="border border-[var(--border-light)] rounded p-6 bg-[var(--bg-table-header)] text-center">
    <div class="text-sm text-[var(--text-secondary)]">📈 {{ props.title || '折线图' }}</div>
  </div>
  <div v-else-if="type === 'barChart'" class="border border-[var(--border-light)] rounded p-6 bg-[var(--bg-table-header)] text-center">
    <div class="text-sm text-[var(--text-secondary)]">📊 {{ props.title || '柱状图' }}</div>
  </div>
  <div v-else-if="type === 'pieChart'" class="border border-[var(--border-light)] rounded p-6 bg-[var(--bg-table-header)] text-center">
    <div class="text-sm text-[var(--text-secondary)]">🥧 {{ props.title || '饼图' }}</div>
  </div>

  <!-- Grid -->
  <div v-else-if="type === 'grid'" class="border border-[var(--border-light)] rounded p-3 bg-[var(--bg-table-header)]"
    :style="{ display: 'grid', gridTemplateColumns: `repeat(${Number(props.cols) || 3}, 1fr)`, gap: `${Number(props.gap) || 10}px` }">
    <div class="text-xs text-[var(--text-muted)] text-center py-4">栅格布局</div>
  </div>

  <!-- Divider -->
  <hr v-else-if="type === 'divider'" class="border-[var(--border)] my-2" />

  <!-- Blank -->
  <div v-else-if="type === 'blank'" class="bg-gradient-to-r from-gray-100 to-gray-50" :style="{ height: `${Number(props.height) || 50}px` }" />

  <!-- Image -->
  <img v-else-if="type === 'image'" :src="String(props.src || 'https://via.placeholder.com/200x100')" :alt="String(props.alt || '图片')" class="max-w-full h-auto" />

  <!-- Link -->
  <a v-else-if="type === 'link'" :href="String(props.url || '#')" class="text-blue-500 hover:underline text-sm">{{ props.text || '链接' }}</a>

  <!-- Form -->
  <div v-else-if="type === 'form'" class="border border-[var(--border-light)] rounded p-4 bg-[var(--bg-secondary)]">
    <div class="text-sm text-[var(--text-secondary)]">📝 表单组件（预览模式）</div>
  </div>

  <!-- Unknown -->
  <div v-else class="text-[var(--text-muted)] text-sm">未知组件: {{ type }}</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAllDictItems, getDictByName } from '@/lib/api'

interface DictOption { label: string; value: string }

const props = defineProps<{ type: string; props: Record<string, unknown> }>()

const inputValue = ref('')
const switchValue = ref(false)
const sliderValue = ref(50)
const tableData = ref<Record<string, any>[]>([])
const tableColumns = ref<Array<{ key: string; label: string; width?: number }>>([])
const dictItems = ref<DictOption[]>([])

watch(() => props.props.dataDictionary, async (dictCode) => {
  if (dictCode && typeof dictCode === 'string') {
    const allItems = await getAllDictItems()
    if (allItems[dictCode]) {
      dictItems.value = allItems[dictCode].map(item => ({ label: item.itemLabel, value: item.itemValue }))
    } else {
      dictItems.value = await getDictByName(dictCode)
    }
  }
}, { immediate: true })

const buttonClass = (() => {
  const btnType = props.props.buttonType || 'primary'
  const base = 'px-4 py-1.5 text-sm rounded transition-colors'
  switch (btnType) {
    case 'primary': return `${base} bg-blue-500 text-white hover:bg-blue-600`
    case 'success': return `${base} bg-green-500 text-white hover:bg-green-600`
    case 'warning': return `${base} bg-yellow-500 text-white hover:bg-yellow-600`
    case 'danger': return `${base} bg-red-500 text-white hover:bg-red-600`
    case 'default': return `${base} bg-[var(--bg-table-header)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]`
    case 'text': return `${base} bg-transparent text-blue-500 hover:bg-blue-50`
    default: return `${base} bg-blue-500 text-white hover:bg-blue-600`
  }
})()
</script>

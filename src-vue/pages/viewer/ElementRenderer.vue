<template>
  <!-- Text -->
  <div v-if="type === 'text'" class="text-sm text-gray-800" :style="props.style">
    {{ props.content || '文本' }}
  </div>

  <!-- Button -->
  <button
    v-else-if="type === 'button'"
    :class="buttonClass"
  >
    {{ props.text || '按钮' }}
  </button>

  <!-- Input with dataDictionary support -->
  <div v-else-if="type === 'input'" class="flex flex-col gap-1">
    <label v-if="props.label" class="text-xs text-gray-500">
      {{ props.label }}
    </label>
    <!-- If has dataDictionary, render select -->
    <el-select
      v-if="props.dataDictionary"
      v-model="inputValue"
      :placeholder="props.placeholder || '请选择'"
      class="w-full"
      :loading="dictLoading"
      filterable
    >
      <el-option
        v-for="item in dictItems"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <!-- Otherwise render text input -->
    <input
      v-else
      type="text"
      v-model="inputValue"
      :placeholder="String(props.placeholder || '')"
      class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 w-full"
    />
  </div>

  <!-- Select -->
  <div v-else-if="type === 'select'" class="flex flex-col gap-1">
    <label v-if="props.label" class="text-xs text-gray-500">
      {{ props.label }}
    </label>
    <select
      v-model="inputValue"
      class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 w-full bg-white"
    >
      <option value="">{{ props.placeholder || '请选择' }}</option>
      <option
        v-for="(opt, i) in (props.options as string[] || [])"
        :key="i"
        :value="opt"
      >
        {{ opt }}
      </option>
    </select>
  </div>

  <!-- Date -->
  <div v-else-if="type === 'date'" class="flex flex-col gap-1">
    <label v-if="props.label" class="text-xs text-gray-500">
      {{ props.label }}
    </label>
    <input
      type="date"
      v-model="inputValue"
      class="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 w-full"
    />
  </div>

  <!-- Switch -->
  <div v-else-if="type === 'switch'" class="flex items-center gap-2">
    <label v-if="props.label" class="text-xs text-gray-500">
      {{ props.label }}
    </label>
    <el-switch v-model="switchValue" />
  </div>

  <!-- Slider -->
  <div v-else-if="type === 'slider'" class="flex flex-col gap-1 w-full">
    <label v-if="props.label" class="text-xs text-gray-500">
      {{ props.label }}
    </label>
    <el-slider v-model="sliderValue" :min="Number(props.min) || 0" :max="Number(props.max) || 100" />
    <div class="text-xs text-gray-400 text-center">{{ sliderValue }}</div>
  </div>

  <!-- Table - using el-table -->
  <div v-else-if="type === 'table'" class="border border-gray-200 rounded bg-white">
    <el-table :data="tableData" stripe border style="width: 100%">
      <el-table-column
        v-for="col in tableColumns"
        :key="col.key"
        :prop="col.key"
        :label="col.label"
        :width="col.width"
      />
    </el-table>
  </div>

  <!-- Line Chart -->
  <div v-else-if="type === 'lineChart'" class="border border-gray-200 rounded p-6 bg-gray-50 text-center">
    <div class="text-sm text-gray-600">📈 {{ props.title || '折线图' }}</div>
  </div>

  <!-- Bar Chart -->
  <div v-else-if="type === 'barChart'" class="border border-gray-200 rounded p-6 bg-gray-50 text-center">
    <div class="text-sm text-gray-600">📊 {{ props.title || '柱状图' }}</div>
  </div>

  <!-- Pie Chart -->
  <div v-else-if="type === 'pieChart'" class="border border-gray-200 rounded p-6 bg-gray-50 text-center">
    <div class="text-sm text-gray-600">🥧 {{ props.title || '饼图' }}</div>
  </div>

  <!-- Grid -->
  <div
    v-else-if="type === 'grid'"
    class="border border-gray-200 rounded p-3 bg-gray-50"
    :style="{
      display: 'grid',
      gridTemplateColumns: `repeat(${Number(props.cols) || 3}, 1fr)`,
      gap: `${Number(props.gap) || 10}px`
    }"
  >
    <div class="text-xs text-gray-400 text-center py-4">栅格布局</div>
  </div>

  <!-- Divider -->
  <hr v-else-if="type === 'divider'" class="border-gray-300 my-2" />

  <!-- Blank -->
  <div
    v-else-if="type === 'blank'"
    class="bg-gradient-to-r from-gray-100 to-gray-50"
    :style="{ height: `${Number(props.height) || 50}px` }"
  />

  <!-- Image -->
  <img
    v-else-if="type === 'image'"
    :src="String(props.src || 'https://via.placeholder.com/200x100')"
    :alt="String(props.alt || '图片')"
    class="max-w-full h-auto"
  />

  <!-- Link -->
  <a
    v-else-if="type === 'link'"
    :href="String(props.url || '#')"
    class="text-blue-500 hover:underline text-sm"
  >
    {{ props.text || '链接' }}
  </a>

  <!-- Form (simplified) -->
  <div v-else-if="type === 'form'" class="border border-gray-200 rounded p-4 bg-white">
    <div class="text-sm text-gray-600">📝 表单组件（预览模式）</div>
  </div>

  <!-- Unknown -->
  <div v-else class="text-gray-400 text-sm">
    未知组件: {{ type }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getAllDictItems, getDictByName } from '../../lib/api'

interface DictOption {
  label: string
  value: string
}

const props = defineProps<{
  type: string
  props: Record<string, unknown>
}>()

const emit = defineEmits<{
  event: [componentId: string, event: string, data: any]
}>()

// Form values
const inputValue = ref('')
const switchValue = ref(false)
const sliderValue = ref(50)

// Table data
const tableData = ref<Record<string, any>[]>([])
const tableColumns = ref<Array<{ key: string; label: string; width?: number }>>([])

// Dict items for Input with dataDictionary
const dictItems = ref<DictOption[]>([])
const dictLoading = ref(false)

// Load dict data when dataDictionary prop changes
watch(() => props.props.dataDictionary, async (dictCode) => {
  if (dictCode && typeof dictCode === 'string') {
    dictLoading.value = true
    try {
      // Try to get from all items first (faster)
      const allItems = await getAllDictItems()
      if (allItems[dictCode]) {
        dictItems.value = allItems[dictCode].map(item => ({
          label: item.itemLabel,
          value: item.itemValue
        }))
      } else {
        // Fallback to getDictByName
        dictItems.value = await getDictByName(dictCode)
      }
    } catch (error) {
      console.error('Failed to load dict:', error)
      dictItems.value = []
    } finally {
      dictLoading.value = false
    }
  }
}, { immediate: true })

// Button class based on type
const buttonClass = computed(() => {
  const btnType = props.props.buttonType || 'primary'
  const baseClass = 'px-4 py-1.5 text-sm rounded transition-colors'
  switch (btnType) {
    case 'primary':
      return `${baseClass} bg-blue-500 text-white hover:bg-blue-600`
    case 'success':
      return `${baseClass} bg-green-500 text-white hover:bg-green-600`
    case 'warning':
      return `${baseClass} bg-yellow-500 text-white hover:bg-yellow-600`
    case 'danger':
      return `${baseClass} bg-red-500 text-white hover:bg-red-600`
    case 'default':
      return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`
    case 'text':
      return `${baseClass} bg-transparent text-blue-500 hover:bg-blue-50`
    default:
      return `${baseClass} bg-blue-500 text-white hover:bg-blue-600`
  }
})

const handleEvent = (event: string, data: any) => {
  emit('event', '', event, data)
}
</script>

<style scoped>
.el-select {
  width: 100%;
}
</style>

<template>
  <div class="component-panel p-4">
    <h4 class="text-sm text-gray-500 mb-4 font-medium">组件库</h4>
    
    <div v-for="category in componentCategories" :key="category.name" class="mb-5">
      <div class="text-xs text-gray-400 mb-2 px-1">{{ category.name }}</div>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="comp in category.components"
          :key="comp.type"
          class="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md text-sm cursor-grab transition-colors hover:bg-gray-100 active:cursor-grabbing select-none"
          draggable="true"
          @dragstart="onDragStart($event, comp)"
        >
          <span class="text-gray-600">{{ comp.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ComponentItem {
  type: string
  label: string
  icon: string
  defaultProps?: Record<string, unknown>
}

interface ComponentCategory {
  name: string
  components: ComponentItem[]
}

const emit = defineEmits<{
  'drag-start': [event: DragEvent, type: string, label: string, defaultProps?: Record<string, unknown>]
}>()

const componentCategories: ComponentCategory[] = [
  {
    name: '基础组件',
    components: [
      { type: 'text', label: '文本', icon: 'Text', defaultProps: { content: '这是一段文本' } },
      { type: 'button', label: '按钮', icon: 'Button', defaultProps: { text: '按钮', buttonType: 'primary' } },
      { type: 'image', label: '图片', icon: 'Picture', defaultProps: { src: '', alt: '图片' } },
      { type: 'link', label: '链接', icon: 'Link', defaultProps: { text: '链接', url: '#' } },
    ],
  },
  {
    name: '表单组件',
    components: [
      { type: 'input', label: '输入框', icon: 'Edit', defaultProps: { placeholder: '请输入', label: '输入框' } },
      { type: 'select', label: '下拉框', icon: 'Document', defaultProps: { placeholder: '请选择', label: '下拉框', options: ['选项1', '选项2', '选项3'] } },
      { type: 'date', label: '日期选择', icon: 'Calendar', defaultProps: { placeholder: '请选择日期', label: '日期选择' } },
      { type: 'switch', label: '开关', icon: 'Open', defaultProps: { label: '开关', value: false } },
      { type: 'slider', label: '滑动条', icon: 'DCaret', defaultProps: { label: '滑动条', min: 0, max: 100, value: 50 } },
    ],
  },
  {
    name: '数据组件',
    components: [
      { type: 'table', label: '表格', icon: 'Grid', defaultProps: { title: '数据表格' } },
      { type: 'lineChart', label: '折线图', icon: 'DataLine', defaultProps: { title: '折线图' } },
      { type: 'barChart', label: '柱状图', icon: 'Histogram', defaultProps: { title: '柱状图' } },
      { type: 'pieChart', label: '饼图', icon: 'PieChart', defaultProps: { title: '饼图' } },
    ],
  },
  {
    name: '布局组件',
    components: [
      { type: 'card', label: '卡片', icon: 'Menu', defaultProps: { title: '卡片标题' } },
      { type: 'tabs', label: '标签页', icon: 'Menu', defaultProps: { tabs: ['标签页1', '标签页2'], activeTab: 0 } },
      { type: 'collapse', label: '折叠面板', icon: 'Menu', defaultProps: { title: '折叠面板标题' } },
      { type: 'grid', label: '栅格', icon: 'Menu', defaultProps: { cols: 3, gap: 10 } },
      { type: 'divider', label: '分割线', icon: 'Minus', defaultProps: { direction: 'horizontal' } },
      { type: 'blank', label: '空白', icon: 'View', defaultProps: { height: 50 } },
    ],
  },
]

function onDragStart(event: DragEvent, comp: ComponentItem) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({
      fromPalette: true,
      type: comp.type,
      label: comp.label,
      defaultProps: comp.defaultProps || {},
    }))
    event.dataTransfer.effectAllowed = 'copy'
  }
  emit('drag-start', event, comp.type, comp.label, comp.defaultProps)
}
</script>

<style scoped>
.component-panel {
  height: 100%;
  overflow-y: auto;
  background: #fff;
  user-select: none;
}
</style>

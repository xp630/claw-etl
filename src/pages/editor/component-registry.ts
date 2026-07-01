/**
 * Component Registry - Single source of truth for all editor components
 * Used by ComponentPanel (palette) and ComponentRenderer
 */

import type { ComponentItem, ComponentCategory } from './types'

export interface RegisteredComponent extends ComponentItem {
  /** Whether this component can contain children */
  isContainer?: boolean
  /** Category this component belongs to */
  category: string
}

export const componentRegistry: Record<string, RegisteredComponent> = {
  // Basic components
  text: {
    type: 'text',
    label: '文本',
    icon: 'T',
    category: '基础组件',
    defaultProps: { content: '这是一段文本' },
  },
  button: {
    type: 'button',
    label: '按钮',
    icon: 'B',
    category: '基础组件',
    defaultProps: { text: '按钮', buttonType: 'primary' },
  },
  image: {
    type: 'image',
    label: '图片',
    icon: 'I',
    category: '基础组件',
    defaultProps: { src: '', alt: '图片' },
  },
  link: {
    type: 'link',
    label: '链接',
    icon: 'L',
    category: '基础组件',
    defaultProps: { text: '链接', url: '#' },
  },

  // Form components
  input: {
    type: 'input',
    label: '输入框',
    icon: '...',
    category: '表单组件',
    defaultProps: { placeholder: '请输入', label: '输入框' },
  },
  select: {
    type: 'select',
    label: '下拉框',
    icon: '▼',
    category: '表单组件',
    defaultProps: { placeholder: '请选择', label: '下拉框', options: ['选项1', '选项2', '选项3'] },
  },
  date: {
    type: 'date',
    label: '日期选择',
    icon: 'D',
    category: '表单组件',
    defaultProps: { placeholder: '请选择日期', label: '日期选择' },
  },
  switch: {
    type: 'switch',
    label: '开关',
    icon: 'S',
    category: '表单组件',
    defaultProps: { label: '开关', value: false },
  },
  slider: {
    type: 'slider',
    label: '滑动条',
    icon: '|',
    category: '表单组件',
    defaultProps: { label: '滑动条', min: 0, max: 100, value: 50 },
  },

  // Data components
  table: {
    type: 'table',
    label: '表格',
    icon: '#',
    category: '数据组件',
    defaultProps: { title: '数据表格', showSearch: true, pagination: true, showAdd: true, showExport: true },
  },
  lineChart: {
    type: 'lineChart',
    label: '折线图',
    icon: '↗',
    category: '数据组件',
    defaultProps: { title: '折线图' },
  },
  barChart: {
    type: 'barChart',
    label: '柱状图',
    icon: '|||',
    category: '数据组件',
    defaultProps: { title: '柱状图' },
  },
  pieChart: {
    type: 'pieChart',
    label: '饼图',
    icon: '◐',
    category: '数据组件',
    defaultProps: { title: '饼图' },
  },

  // Layout components
  card: {
    type: 'card',
    label: '卡片',
    icon: '□',
    category: '布局组件',
    isContainer: true,
    defaultProps: { title: '卡片标题' },
  },
  tabs: {
    type: 'tabs',
    label: '标签页',
    icon: '▦',
    category: '布局组件',
    isContainer: true,
    defaultProps: {
      tabs: [
        { tabId: 'tab_0', label: '标签页1', params: {}, children: [], layout: { direction: 'column', gap: 8, wrap: false } },
        { tabId: 'tab_1', label: '标签页2', params: {}, children: [], layout: { direction: 'column', gap: 8, wrap: false } },
      ],
      activeTab: 'tab_0',
    },
  },
  collapse: {
    type: 'collapse',
    label: '折叠面板',
    icon: '◢',
    category: '布局组件',
    isContainer: true,
    defaultProps: { title: '折叠面板标题' },
  },
  grid: {
    type: 'grid',
    label: '栅格',
    icon: '田',
    category: '布局组件',
    isContainer: true,
    defaultProps: { cols: 3, gap: 10 },
  },
  divider: {
    type: 'divider',
    label: '分割线',
    icon: '—',
    category: '布局组件',
    defaultProps: { direction: 'horizontal' },
  },
  blank: {
    type: 'blank',
    label: '空白',
    icon: '□',
    category: '布局组件',
    defaultProps: { height: 50 },
  },
}

/**
 * Get icon for a component type
 */
export function getComponentIcon(type: string): string {
  return componentRegistry[type]?.icon || '?'
}

/**
 * Get component definition
 */
export function getComponent(type: string): RegisteredComponent | undefined {
  return componentRegistry[type]
}

/**
 * Get all components grouped by category (for ComponentPanel)
 */
export function getComponentCategories(): ComponentCategory[] {
  const categoryMap: Record<string, ComponentItem[]> = {}

  for (const comp of Object.values(componentRegistry)) {
    if (!categoryMap[comp.category]) {
      categoryMap[comp.category] = []
    }
    categoryMap[comp.category].push({
      type: comp.type,
      label: comp.label,
      icon: comp.icon,
      defaultProps: comp.defaultProps,
    })
  }

  // Define category order
  const categoryOrder = ['基础组件', '表单组件', '数据组件', '布局组件']

  return categoryOrder
    .filter(name => categoryMap[name])
    .map(name => ({
      name,
      components: categoryMap[name],
    }))
}

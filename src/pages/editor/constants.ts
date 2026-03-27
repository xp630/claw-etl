import React from 'react';
import { 
  Type, MousePointer, Image, Link as LinkIcon,
  Box, Calendar, ToggleLeft, Sliders,
  Grid3X3, Minus, View, ChevronDown,
  BarChart3, TrendingUp, PieChart as PieChartIcon
} from 'lucide-react';
import { ComponentCategory } from './types';

// Icon mapping
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Text: Type,
  Button: MousePointer,
  Picture: Image,
  Link: LinkIcon,
  Edit: Box,
  Document: Box,
  Calendar,
  Open: ToggleLeft,
  DCaret: Sliders,
  Grid: Grid3X3,
  Minus,
  View,
  Histogram: BarChart3,
  DataLine: TrendingUp,
  PieChart: PieChartIcon,
  ChevronDown,
  Menu: Grid3X3,
  Box,
};

// Component categories
export const componentCategories: ComponentCategory[] = [
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
      { type: 'table', label: '表格', icon: 'Grid', defaultProps: { apiId: undefined, queryApiId: undefined, createApiId: undefined, updateApiId: undefined, deleteApiId: undefined, detailApiId: undefined, columns: [{ key: 'id', label: 'ID', width: 80 }, { key: 'name', label: '名称' }, { key: 'status', label: '状态' }], data: [{ id: 1, name: '示例数据', status: '启用' }, { id: 2, name: '示例数据2', status: '禁用' }], bordered: true, striped: true, pagination: true, pageSize: 10, showSearch: true, showAdd: true, showExport: true, showDetail: true, showEdit: true, showDelete: true, showPagination: true } },
      { type: 'form', label: '表单', icon: 'Edit', defaultProps: { datasourceId: undefined, tableName: undefined, featureId: undefined, columns: [], showAdd: true, showEdit: true } },
      { type: 'lineChart', label: '折线图', icon: 'DataLine', defaultProps: { title: '折线图', data: [12, 34, 56, 78, 90] } },
      { type: 'barChart', label: '柱状图', icon: 'Histogram', defaultProps: { title: '柱状图', data: [30, 50, 20, 60, 40] } },
      { type: 'pieChart', label: '饼图', icon: 'PieChart', defaultProps: { title: '饼图', data: [{ name: 'A', value: 30 }, { name: 'B', value: 70 }] } },
    ],
  },
  {
    name: '布局组件',
    components: [
      { type: 'grid', label: '栅格', icon: 'Menu', defaultProps: { cols: 3, gap: 10 } },
      { type: 'divider', label: '分割线', icon: 'Minus', defaultProps: { direction: 'horizontal' } },
      { type: 'blank', label: '空白', icon: 'View', defaultProps: { height: 50 } },
    ],
  },
  {
    name: '容器组件',
    components: [
      { type: 'card', label: '卡片', icon: 'Box', defaultProps: { title: '卡片标题', bordered: true } },
      { type: 'tabs', label: '标签页', icon: 'Grid', defaultProps: { tabs: ['标签1', '标签2'], activeTab: 0 } },
      { type: 'collapse', label: '折叠面板', icon: 'ChevronDown', defaultProps: { panels: [{ title: '面板1', content: '' }], accordion: false } },
    ],
  },
];

// Property labels
export const propLabels: Record<string, string> = {
  content: '文本内容',
  text: '按钮文字',
  placeholder: '占位文本',
  label: '标签文字',
  src: '图片地址',
  alt: '图片描述',
  url: '链接地址',
  title: '标题',
  value: '默认值',
  direction: '方向',
  height: '高度',
  buttonType: '按钮类型',
  min: '最小值',
  max: '最大值',
  cols: '列数',
  gap: '间距',
  columns: '列配置',
  data: '数据',
  options: '选项',
  showSearch: '显示搜索',
  showAdd: '显示新增',
  showEdit: '显示编辑',
  showDelete: '显示删除',
  showExport: '显示导出',
  showDetail: '显示详情',
  showPagination: '显示分页',
  bordered: '显示边框',
  striped: '斑马纹',
  pagination: '分页',
  pageSize: '每页条数',
  apiId: 'API ID',
  queryApiId: '查询API',
  createApiId: '新增API',
  updateApiId: '更新API',
  deleteApiId: '删除API',
  detailApiId: '详情API',
  tableName: '表名',
  datasourceId: '数据源ID',
  featureId: '功能ID',
  required: '必填',
  disabled: '禁用',
  readOnly: '只读',
  formType: '表单类型',
};

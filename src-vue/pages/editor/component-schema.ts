/**
 * 组件属性 Schema 定义
 * 
 * 作用: 描述每个组件类型有哪些属性,属性是什么类型,用什么控件编辑
 * 
 * 好处: JSON 新增字段 → Schema 有定义 → 属性面板自动渲染
 */

export type ControlType = 'text' | 'textarea' | 'number' | 'switch' | 'slider' | 'select' | 'color' | 'code' | 'custom'

export interface PropSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  label: string
  control: ControlType
  placeholder?: string
  options?: { label: string; value: unknown }[]  // for select
  min?: number   // for slider
  max?: number   // for slider
  step?: number  // for slider
  rows?: number  // for textarea
  custom?: string  // for custom component like 'TablePropsPanel'
}

export interface ComponentSchema {
  type: string
  label: string
  props: Record<string, PropSchema>
}

// ============================================================================
// 组件 Schema 注册表
// ============================================================================

export const componentSchemas: Record<string, ComponentSchema> = {
  
  // -------------------------------------------------------------------------
  // 基础组件
  // -------------------------------------------------------------------------
  
  input: {
    type: 'input',
    label: '输入框',
    props: {
      placeholder: { type: 'string', label: '占位文本', control: 'text', placeholder: '请输入...' },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
      readonly: { type: 'boolean', label: '只读', control: 'switch' },
      clearable: { type: 'boolean', label: '可清除', control: 'switch' },
      prefix: { type: 'string', label: '前缀', control: 'text' },
      suffix: { type: 'string', label: '后缀', control: 'text' },
    }
  },

  textarea: {
    type: 'textarea',
    label: '文本域',
    props: {
      placeholder: { type: 'string', label: '占位文本', control: 'text', placeholder: '请输入...' },
      rows: { type: 'number', label: '行数', control: 'number', min: 1, max: 20 },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
      autosize: { type: 'boolean', label: '自适应高度', control: 'switch' },
    }
  },

  select: {
    type: 'select',
    label: '下拉选择',
    props: {
      placeholder: { type: 'string', label: '占位文本', control: 'text' },
      options: { type: 'array', label: '选项', control: 'custom', custom: 'options-editor' },
      mode: { type: 'string', label: '选择模式', control: 'select', options: [
        { label: '单选', value: 'single' },
        { label: '多选', value: 'multiple' },
      ]},
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
    }
  },

  switch: {
    type: 'switch',
    label: '开关',
    props: {
      checkedChildren: { type: 'string', label: '开启文本', control: 'text' },
      unCheckedChildren: { type: 'string', label: '关闭文本', control: 'text' },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
    }
  },

  slider: {
    type: 'slider',
    label: '滑块',
    props: {
      min: { type: 'number', label: '最小值', control: 'number' },
      max: { type: 'number', label: '最大值', control: 'number' },
      step: { type: 'number', label: '步长', control: 'number', min: 0.1 },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
    }
  },

  radio: {
    type: 'radio',
    label: '单选组',
    props: {
      options: { type: 'array', label: '选项', control: 'custom', custom: 'options-editor' },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
    }
  },

  checkbox: {
    type: 'checkbox',
    label: '复选框',
    props: {
      text: { type: 'string', label: '显示文本', control: 'text' },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
    }
  },

  button: {
    type: 'button',
    label: '按钮',
    props: {
      text: { type: 'string', label: '按钮文字', control: 'text' },
      type: { type: 'string', label: '按钮类型', control: 'select', options: [
        { label: '主要', value: 'primary' },
        { label: '默认', value: 'default' },
        { label: '虚线', value: 'dashed' },
        { label: '文本', value: 'text' },
      ]},
      htmlType: { type: 'string', label: '原生类型', control: 'select', options: [
        { label: 'button', value: 'button' },
        { label: 'submit', value: 'submit' },
        { label: 'reset', value: 'reset' },
      ]},
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
      block: { type: 'boolean', label: '块级按钮', control: 'switch' },
    }
  },

  link: {
    type: 'link',
    label: '链接',
    props: {
      text: { type: 'string', label: '链接文字', control: 'text' },
      url: { type: 'string', label: '链接地址', control: 'text' },
      disabled: { type: 'boolean', label: '禁用', control: 'switch' },
    }
  },

  text: {
    type: 'text',
    label: '文本',
    props: {
      content: { type: 'string', label: '文本内容', control: 'textarea', rows: 3 },
      textAlign: { type: 'string', label: '对齐方式', control: 'select', options: [
        { label: '左对齐', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '右对齐', value: 'right' },
      ]},
      fontSize: { type: 'number', label: '字号', control: 'number', min: 12, max: 72 },
      fontWeight: { type: 'string', label: '字重', control: 'select', options: [
        { label: '正常', value: 'normal' },
        { label: '粗体', value: 'bold' },
      ]},
      color: { type: 'string', label: '颜色', control: 'color' },
    }
  },

  image: {
    type: 'image',
    label: '图片',
    props: {
      src: { type: 'string', label: '图片地址', control: 'text' },
      alt: { type: 'string', label: '图片描述', control: 'text' },
      width: { type: 'string', label: '宽度', control: 'text', placeholder: '100px 或 50%' },
      height: { type: 'string', label: '高度', control: 'text', placeholder: 'auto' },
      fit: { type: 'string', label: '填充方式', control: 'select', options: [
        { label: '覆盖', value: 'cover' },
        { label: 'contain', value: 'contain' },
        { label: 'fill', value: 'fill' },
      ]},
    }
  },

  blank: {
    type: 'blank',
    label: '空白区域',
    props: {
      width: { type: 'string', label: '宽度', control: 'text', placeholder: '100%' },
      height: { type: 'string', label: '高度', control: 'text', placeholder: '100px' },
      backgroundColor: { type: 'string', label: '背景色', control: 'color' },
    }
  },

  divider: {
    type: 'divider',
    label: '分割线',
    props: {
      orientation: { type: 'string', label: '文字位置', control: 'select', options: [
        { label: '居左', value: 'left' },
        { label: '居中', value: 'center' },
        { label: '居右', value: 'right' },
      ]},
      type: { type: 'string', label: '线条类型', control: 'select', options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
      ]},
      color: { type: 'string', label: '颜色', control: 'color' },
    }
  },

  // -------------------------------------------------------------------------
  // 容器组件
  // -------------------------------------------------------------------------

  card: {
    type: 'card',
    label: '卡片',
    props: {
      title: { type: 'string', label: '标题', control: 'text' },
      bordered: { type: 'boolean', label: '边框', control: 'switch' },
      hoverable: { type: 'boolean', label: '悬浮效果', control: 'switch' },
    }
  },

  collapse: {
    type: 'collapse',
    label: '折叠面板',
    props: {
      title: { type: 'string', label: '标题', control: 'text' },
      accordion: { type: 'boolean', label: '手风琴模式', control: 'switch' },
      bordered: { type: 'boolean', label: '边框', control: 'switch' },
    }
  },

  tabs: {
    type: 'tabs',
    label: '标签页',
    props: {
      // Tabs layout is managed via tab-specific controls
      tabPosition: { type: 'string', label: '标签位置', control: 'select', options: [
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' },
      ]},
      type: { type: 'string', label: '风格', control: 'select', options: [
        { label: '默认', value: 'line' },
        { label: '卡片', value: 'card' },
        { label: '可关闭', value: 'editable-card' },
      ]},
    }
  },

  // -------------------------------------------------------------------------
  // 业务组件
  // -------------------------------------------------------------------------

  table: {
    type: 'table',
    label: '数据表格',
    props: {
      columns: { type: 'array', label: '列配置', control: 'custom', custom: 'TablePropsPanel' },
      dataSource: { type: 'array', label: '数据源', control: 'code' },
      bordered: { type: 'boolean', label: '边框', control: 'switch' },
      striped: { type: 'boolean', label: '斑马纹', control: 'switch' },
      compact: { type: 'boolean', label: '紧凑模式', control: 'switch' },
      pagination: { type: 'boolean', label: '分页', control: 'switch' },
      pageSize: { type: 'number', label: '每页条数', control: 'number', min: 5, max: 100 },
    }
  },

  form: {
    type: 'form',
    label: '表单',
    props: {
      layout: { type: 'string', label: '布局', control: 'select', options: [
        { label: '垂直', value: 'vertical' },
        { label: '水平', value: 'horizontal' },
        { label: '行内', value: 'inline' },
      ]},
      labelAlign: { type: 'string', label: '标签对齐', control: 'select', options: [
        { label: '左对齐', value: 'left' },
        { label: '右对齐', value: 'right' },
      ]},
      requiredMark: { type: 'boolean', label: '必填标记', control: 'switch' },
    }
  },

  modal: {
    type: 'modal',
    label: '弹窗',
    props: {
      title: { type: 'string', label: '标题', control: 'text' },
      width: { type: 'string', label: '宽度', control: 'text', placeholder: '520px' },
      maskClosable: { type: 'boolean', label: '点击遮罩关闭', control: 'switch' },
      closable: { type: 'boolean', label: '显示关闭按钮', control: 'switch' },
      footer: { type: 'boolean', label: '显示底部', control: 'switch' },
    }
  },

  drawer: {
    type: 'drawer',
    label: '抽屉',
    props: {
      title: { type: 'string', label: '标题', control: 'text' },
      placement: { type: 'string', label: '位置', control: 'select', options: [
        { label: '右侧', value: 'right' },
        { label: '左侧', value: 'left' },
        { label: '顶部', value: 'top' },
        { label: '底部', value: 'bottom' },
      ]},
      width: { type: 'string', label: '宽度', control: 'text', placeholder: '378px' },
      closable: { type: 'boolean', label: '显示关闭', control: 'switch' },
    }
  },

  chart: {
    type: 'chart',
    label: '图表',
    props: {
      chartType: { type: 'string', label: '图表类型', control: 'select', options: [
        { label: '折线图', value: 'line' },
        { label: '柱状图', value: 'bar' },
        { label: '饼图', value: 'pie' },
        { label: '散点图', value: 'scatter' },
      ]},
      data: { type: 'array', label: '数据', control: 'code' },
      xField: { type: 'string', label: 'X轴字段', control: 'text' },
      yField: { type: 'string', label: 'Y轴字段', control: 'text' },
    }
  },
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 获取组件的 Schema
 */
export function getComponentSchema(type: string): ComponentSchema | null {
  return componentSchemas[type] || null
}

/**
 * 检查组件是否有某个属性
 */
export function hasProp(schema: ComponentSchema | null, propName: string): boolean {
  return schema?.props?.[propName] != null
}

/**
 * 获取属性的 Schema
 */
export function getPropSchema(type: string, propName: string): PropSchema | null {
  return componentSchemas[type]?.props?.[propName] || null
}

/**
 * 获取组件的所有属性名列表
 */
export function getPropNames(type: string): string[] {
  const schema = componentSchemas[type]
  return schema ? Object.keys(schema.props) : []
}

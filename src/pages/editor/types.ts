import React from 'react';

// Types
export interface ComponentItem {
  type: string;
  label: string;
  icon: string;
  defaultProps?: Record<string, unknown>;
}

export interface ComponentCategory {
  name: string;
  components: ComponentItem[];
}

export interface CanvasComponent {
  id: string;              // 画布中的唯一标识
  componentId?: string;    // 组件类型标识（如 table, form, input 等）
  parentId?: string;        // 父组件 ID，用于层级关系
  type: string;            // 组件类型
  label: string;           // 组件标签
  props: Record<string, unknown>;
  children?: CanvasComponent[];  // 子组件
}

export interface ColumnConfig {
  key: string;
  label: string;
  fieldType?: string;
  width?: number;
  visible?: boolean;
  sortable?: boolean;
  align?: string;
  frozen?: boolean;
  ellipsis?: boolean;
  tooltip?: boolean;
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  queryCondition?: boolean;
  dataDictionary?: string;
  dateFormat?: string;
  fixedValue?: string;
  customFunction?: string;
}

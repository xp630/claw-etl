// Editor component types - Vue version
// ============================================================================
// 数据结构说明 (Data Structure Explanation)
// ============================================================================
// 所有组件数据都是完全扁平的,通过 parentComponentId 和 tabId 建立关联
//
// 扁平结构:
//   - 每个组件是一条独立记录
//   - parentComponentId: 父容器组件的 componentId
//   - tabId: 属于哪个 tab (仅 tabs 容器内的组件有此字段)
//   - props.tabs: tabs 的配置(标签名、布局等),不含 children
//
// 格式示例:
//   [
//     { id: 212, componentId: "tabs_212", type: "tabs", parentComponentId: null, props: { tabs: [...] } },
//     { id: 213, componentId: "table_211", type: "table", parentComponentId: "tabs_212", tabId: "tab_0", props: {...} }
//   ]
//
// ============================================================================

export interface ComponentItem {
  type: string
  label: string
  icon: string
  defaultProps?: Record<string, unknown>
}

export interface ComponentCategory {
  name: string
  components: ComponentItem[]
}

export interface CanvasComponent {
  id?: string | number       // 数据库主键 (optional for new components, backend generates)
  componentId?: string       // 组件稳定 ID (table_211, tabs_212, etc.)
  parentComponentId?: string  // 父容器组件的 componentId
  tabId?: string            // 属于哪个 tab (仅在 tabs 容器内有意义)
  type: string              // 组件类型
  label: string             // 组件标签
  props: Record<string, unknown>
  children?: CanvasComponent[]  // 运行时使用,保存时忽略
}

export interface ColumnConfig {
  key: string
  label: string
  fieldType?: string
  width?: number
  visible?: boolean
  sortable?: boolean
  align?: string
  frozen?: boolean
  ellipsis?: boolean
  tooltip?: boolean
  required?: boolean
  defaultValue?: unknown
  placeholder?: string
  queryCondition?: boolean
  dataDictionary?: string
  dateFormat?: string
  fixedValue?: string
  customFunction?: string
}

/**
 * 容器组件的布局配置 (Layout Configuration for Container Components)
 */
export interface LayoutProps {
  direction?: 'row' | 'column'
  gap?: number
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  justifyContent?: 'start' | 'center' | 'end' | 'space-between'
  wrap?: boolean
}

/**
 * Tab 项定义 (Tab Item Definition)
 * 
 * 注意: TabItem 不再包含 children,子组件通过 parentComponentId + tabId 关联
 */
export interface TabItem {
  tabId: string                   // Tab unique ID
  label: string                    // Tab display label
  params?: Record<string, unknown> // Parameters passed to children
  layout?: LayoutProps             // Layout for this tab's children
}

// Editor component types - Vue version
// ============================================================================
// Tabs 格式说明 (Tabs Format Explanation)
// ============================================================================
// Tabs 组件支持两种数据格式:
//
// 【旧格式 - LegacyTabsFormat】:
//   props.tabs: string[]                    // 如 ["标签1", "标签2"]
//   props.childrenMap: { "0": [childIds], "1": [childIds] }  // 每个tab的子组件ID
//   props.activeTab: number                  // 当前激活的tab索引 (0, 1, 2...)
//
// 【新格式 - TabsFormat (TabItem[])】:
//   props.tabs: TabItem[]                   // 完整对象数组
//     - TabItem.id: string                  // tab唯一标识 (如 "tab_0")
//     - TabItem.label: string               // tab显示名称
//     - TabItem.params: Record              // 传递给子组件的参数
//     - TabItem.children: (string|number)[] // 子组件ID数组
//     - TabItem.layout: LayoutProps          // 布局配置
//   props.activeTab: string                 // 当前激活的tab ID (如 "tab_0")
//   注意: 新格式下 props.childrenMap 不再使用,子组件内联在 TabItem.children 中
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
  id?: string | number    // Canvas unique ID (optional for new components, backend will generate)
  componentId?: string     // Component type ID (table, form, input, etc.)
  parentId?: string       // Parent component ID for hierarchy
  type: string            // Component type
  label: string           // Component label
  props: Record<string, unknown>
  children?: CanvasComponent[]  // Child components
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
 * 
 * @description 用于 card、tabs、collapse 等容器组件,控制子组件的排列方式
 * 
 * @property direction - 子组件排列方向: 'row'(横向) | 'column'(纵向)
 * @property gap - 子组件之间的间距,单位为像素(px)
 * @property alignItems - 垂直方向对齐方式: 'start'(顶部对齐) | 'center'(居中) | 'end'(底部对齐) | 'stretch'(拉伸填满)
 * @property justifyContent - 水平方向对齐方式: 'start' | 'center' | 'end' | 'space-between'(两端对齐)
 * @property wrap - 是否允许子组件换行
 */
export interface LayoutProps {
  direction?: 'row' | 'column'   // 排列方向
  gap?: number                    // 子组件间距(px)
  alignItems?: 'start' | 'center' | 'end' | 'stretch'  // 垂直对齐
  justifyContent?: 'start' | 'center' | 'end' | 'space-between'  // 水平对齐
  wrap?: boolean                  // 是否换行
}

/**
 * Tab 项定义 (Tab Item Definition)
 * 
 * @description Tabs 组件中单个标签页的数据结构(新格式)
 * 
 * @property id - Tab 的唯一标识符,用于 activeTab 引用,格式通常为 "tab_0"、"tab_1" 等
 * @property label - Tab 在界面上显示的名称
 * @property params - 传递给该 Tab 下子组件的额外参数
 * @property children - 该 Tab 包含的子组件 ID 数组
 * @property layout - 该 Tab 下子组件的布局配置
 */
export interface TabItem {
  id: string                      // Tab unique ID (user customizable)
  label: string                    // Tab display label
  params?: Record<string, unknown> // Parameters passed to children
  children?: (string | number)[]  // Child component IDs
  layout?: LayoutProps             // Layout for this tab's children
}

/**
 * 旧版 Tabs 格式 (Legacy Tabs Format)
 * 
 * @description 早期的 tabs 数据结构,tabs 是字符串数组,通过 childrenMap 关联子组件
 * 
 * 格式示例:
 *   tabs: ["标签1", "标签2"]
 *   childrenMap: { "0": ["comp_1", "comp_2"], "1": ["comp_3"] }
 *   activeTab: 0  // number 类型,表示索引
 * 
 * @deprecated 请使用 TabsFormat (TabItem[])
 */
export type LegacyTabsFormat = string[]

/**
 * 新版 Tabs 格式 (New Tabs Format)
 * 
 * @description 改进后的 tabs 数据结构,每个 TabItem 包含完整信息
 * 
 * 格式示例:
 *   tabs: [
 *     { id: "tab_0", label: "标签1", params: {}, children: ["comp_1", "comp_2"], layout: { direction: "column" } },
 *     { id: "tab_1", label: "标签2", params: {}, children: ["comp_3"], layout: { direction: "column" } }
 *   ]
 *   activeTab: "tab_0"  // string 类型,表示 tab ID
 */
export type TabsFormat = TabItem[]

/**
 * 统一的 Tabs 属性类型 (Unified Tabs Prop Type)
 * 
 * @description 支持旧格式和新格式的联合类型,用于 props.tabs 字段
 * 
 * 【新格式优先】组件内部应优先使用新格式处理数据:
 *   - 使用 TabItem[].children 存储子组件 ID
 *   - 使用 TabItem.layout 控制布局
 *   - activeTab 使用字符串 ID (如 "tab_0")
 */
export type UnifiedTabs = LegacyTabsFormat | TabsFormat

/**
 * 判断 Tabs 是否为旧格式 (Check if Tabs is Legacy Format)
 * 
 * @description 通过检查 tabs 数组首元素类型来判断格式
 *   - 如果首元素是字符串(string),则为旧格式 LegacyTabsFormat
 *   - 如果首元素是对象(object),则为新格式 TabsFormat
 * 
 * @param tabs - UnifiedTabs 类型的 tabs 属性
 * @returns true 表示是旧格式,需要迁移; false 表示已是新格式
 * 
 * @example
 *   isLegacyTabs(["标签1", "标签2"])  // true
 *   isLegacyTabs([{ id: "tab_0", label: "标签1", ... }])  // false
 */
export function isLegacyTabs(tabs: UnifiedTabs): tabs is LegacyTabsFormat {
  return Array.isArray(tabs) && tabs.length > 0 && typeof tabs[0] === 'string'
}

/**
 * 迁移 Tabs 从旧格式到新格式 (Migrate Tabs from Legacy to New Format)
 * 
 * @description 将旧格式的 tabs 数据转换为新格式 TabItem[]
 * 
 * 迁移规则:
 *   1. 旧格式 string[] 的每个元素转换为 TabItem,id 格式为 "tab_{index}"
 *   2. TabItem.children 从 childrenMap 中获取对应索引的子组件 ID 数组
 *   3. TabItem.layout 使用默认布局 { direction: 'column', gap: 8, wrap: false }
 * 
 * @param tabs - UnifiedTabs 类型的 tabs 数据
 * @param childrenMap - 旧格式的 childrenMap,键为 tab 索引字符串,值为子组件 ID 数组
 * @returns 转换后的 TabsFormat (TabItem[]) 数组
 * 
 * 【注意】此函数不处理 activeTab 的类型转换,调用者需自行处理:
 *   - 旧格式: activeTab 是 number (索引)
 *   - 新格式: activeTab 是 string (tab ID, 如 "tab_0")
 */
export function migrateTabs(tabs: UnifiedTabs, childrenMap?: Record<string, (string | number)[]>): TabsFormat {
  if (isLegacyTabs(tabs)) {
    // Migrate from legacy format
    return tabs.map((label, index) => ({
      id: `tab_${index}`,
      label,
      params: {},
      children: childrenMap?.[String(index)] || []
    }))
  }
  return tabs
}

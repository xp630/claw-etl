// Editor component types - Vue version

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

// Layout configuration for container components
export interface LayoutProps {
  direction?: 'row' | 'column'   // 排列方向
  gap?: number                    // 子组件间距(px)
  alignItems?: 'start' | 'center' | 'end' | 'stretch'  // 垂直对齐
  justifyContent?: 'start' | 'center' | 'end' | 'space-between'  // 水平对齐
  wrap?: boolean                  // 是否换行
}

// Tab item for tabs component
export interface TabItem {
  id: string                      // Tab unique ID (user customizable)
  label: string                    // Tab display label
  params?: Record<string, unknown> // Parameters passed to children
  children?: (string | number)[]  // Child component IDs
  layout?: LayoutProps             // Layout for this tab's children
}

// Legacy tabs format: tabs was string[]
export type LegacyTabsFormat = string[]

// New tabs format
export type TabsFormat = TabItem[]

// Unified tabs prop (supports both old and new)
export type UnifiedTabs = LegacyTabsFormat | TabsFormat

// Helper functions
export function isLegacyTabs(tabs: UnifiedTabs): tabs is LegacyTabsFormat {
  return Array.isArray(tabs) && tabs.length > 0 && typeof tabs[0] === 'string'
}

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

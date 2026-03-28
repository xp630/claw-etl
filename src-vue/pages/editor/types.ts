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
  id: string              // Canvas unique ID
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

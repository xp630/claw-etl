export interface CanvasComponent {
  id: string
  componentId?: string
  parentId?: string
  type: string
  label: string
  props: Record<string, unknown>
  children?: CanvasComponent[]
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

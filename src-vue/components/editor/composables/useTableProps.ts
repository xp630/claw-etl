import { ref, watch } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'
import { getFeatures, getDataSources, getTableList, saveFeature } from '@/lib/api'

interface Props {
  selectedComponent: CanvasComponent | null
  updateProp: (key: string, value: any) => void
}

// 列配置编辑弹窗
const showColumnsEditorModal = ref(false)
const editingColumn = ref<any[]>([])

// 单列编辑弹窗
const showSingleColumnEditor = ref(false)
const editingColumnIndex = ref<number>(-1)
const editingSingleColumn = ref<any>({})

// 新建 Feature 弹窗
const showCreateFeatureModal = ref(false)
const creatingFeature = ref(false)
const newFeatureForm = ref({
  name: '',
  code: '',
  description: '',
})

// 数据源列表
const dataSources = ref<any[]>([])
const tables = ref<any[]>([])
const availableFeatures = ref<any[]>([])
const loadingTables = ref(false)
const loadingFeatures = ref(false)

export function useTableProps(props: Props) {
  // 加载数据源列表
  async function loadDataSources() {
    try {
      const res = await getDataSources({ page: 1, limit: 100 })
      dataSources.value = res.list || []
    } catch (error) {
      console.error('Failed to load dataSources:', error)
      dataSources.value = []
    }
  }

  // 加载表名列表
  async function loadTables() {
    const datasourceId = props.selectedComponent?.props.datasourceId
    if (!datasourceId) {
      tables.value = []
      return
    }

    let ds = dataSources.value.find(d => d.id === datasourceId)
    if (!ds) {
      await loadDataSources()
      ds = dataSources.value.find(d => d.id === datasourceId)
    }

    if (!ds) {
      tables.value = []
      return
    }

    const dbName = ds.database_name || ds.dbName || ds.databaseName
    if (!dbName) {
      tables.value = []
      return
    }

    loadingTables.value = true
    try {
      const res = await getTableList(dbName)
      tables.value = res || []
    } catch (error) {
      console.error('Failed to load tables:', error)
      tables.value = []
    } finally {
      loadingTables.value = false
    }
  }

  // 加载 Feature 列表
  async function loadFeaturesForTable() {
    const tableName = props.selectedComponent?.props.tableName
    const datasourceId = props.selectedComponent?.props.datasourceId
    if (!tableName || !datasourceId) {
      availableFeatures.value = []
      return
    }

    loadingFeatures.value = true
    try {
      const res = await getFeatures({ page: 1, limit: 100 })
      const filtered = (res.list || []).filter((f: any) =>
        f.datasourceId === datasourceId && f.tableName === tableName
      )
      availableFeatures.value = filtered
    } catch (error) {
      console.error('Failed to load features:', error)
      availableFeatures.value = []
    } finally {
      loadingFeatures.value = false
    }
  }

  // 处理数据源变化
  function handleDatasourceChange(value: string) {
    if (!value) {
      props.updateProp('datasourceId', undefined)
      props.updateProp('tableName', undefined)
      props.updateProp('featureId', undefined)
      tables.value = []
      availableFeatures.value = []
      return
    }
    props.updateProp('datasourceId', parseInt(value))
    props.updateProp('tableName', undefined)
    props.updateProp('featureId', undefined)
    tables.value = []
    availableFeatures.value = []
    loadTables()
  }

  // 处理表名变化
  function handleTableChange(value: string) {
    if (!value) {
      props.updateProp('tableName', undefined)
      props.updateProp('featureId', undefined)
      availableFeatures.value = []
      return
    }
    props.updateProp('tableName', value)
    props.updateProp('featureId', undefined)
    availableFeatures.value = []
    loadFeaturesForTable()
  }

  // 处理 Feature 变化
  async function handleFeatureChange(featureId: string) {
    if (!featureId) {
      props.updateProp('featureId', undefined)
      props.updateProp('queryApiId', undefined)
      props.updateProp('createApiId', undefined)
      props.updateProp('updateApiId', undefined)
      props.updateProp('deleteApiId', undefined)
      props.updateProp('detailApiId', undefined)
      props.updateProp('columns', [])
      return
    }

    props.updateProp('featureId', parseInt(featureId))

    try {
      const detail = await getFeatureDetail(parseInt(featureId))
      if (detail) {
        props.updateProp('queryApiId', detail.queryApiId)
        props.updateProp('createApiId', detail.createApiId)
        props.updateProp('updateApiId', detail.updateApiId)
        props.updateProp('deleteApiId', detail.deleteApiId)
        props.updateProp('detailApiId', detail.detailApiId)
        if (detail.columns) {
          props.updateProp('columns', detail.columns)
        }
      }
    } catch (error) {
      console.error('Failed to load feature detail:', error)
    }
  }

  // 新建 Feature
  async function handleCreateFeature() {
    if (!newFeatureForm.value.name || !newFeatureForm.value.code) return

    creatingFeature.value = true
    try {
      const datasourceId = props.selectedComponent?.props.datasourceId
      const tableName = props.selectedComponent?.props.tableName
      await saveFeature({
        name: newFeatureForm.value.name,
        code: newFeatureForm.value.code,
        description: newFeatureForm.value.description,
        datasourceId: datasourceId,
        tableName: tableName,
      })
      showCreateFeatureModal.value = false
      newFeatureForm.value = { name: '', code: '', description: '' }
      await loadFeaturesForTable()
    } catch (error) {
      console.error('Failed to create feature:', error)
      alert('创建失败')
    } finally {
      creatingFeature.value = false
    }
  }

  // 打开列配置编辑器
  function openColumnsEditor() {
    editingColumn.value = JSON.parse(JSON.stringify(props.selectedComponent?.props.columns || []))
    showColumnsEditorModal.value = true
  }

  // 打开单列编辑器
  function openColumnEditor(index: number) {
    editingColumnIndex.value = index
    editingSingleColumn.value = { ...props.selectedComponent?.props.columns?.[index] }
    showSingleColumnEditor.value = true
  }

  // 保存单列编辑
  function handleSaveSingleColumn() {
    const columns = [...(props.selectedComponent?.props.columns || [])]
    columns[editingColumnIndex.value] = editingSingleColumn.value
    props.updateProp('columns', columns)
    showSingleColumnEditor.value = false
  }

  // 快捷更新单列属性
  function quickUpdateColumn(index: number, field: string, value: any) {
    const columns = [...(props.selectedComponent?.props.columns || [])]
    columns[index] = { ...columns[index], [field]: value }
    props.updateProp('columns', columns)
  }

  // 更新编辑中的列
  function updateColumn(index: number, field: string, value: any) {
    editingColumn.value[index][field] = value
  }

  // 添加列
  function addColumn() {
    editingColumn.value.push({
      key: '',
      label: '',
      fieldType: 'text',
      width: 100,
      visible: true,
      sortable: false,
      align: 'left',
      frozen: false,
      ellipsis: true,
      tooltip: false,
      required: false,
      placeholder: '',
      queryCondition: false,
      dataDictionary: ''
    })
  }

  // 删除列
  function removeColumn(index: number) {
    editingColumn.value.splice(index, 1)
  }

  // 保存所有列
  function handleSaveColumns() {
    props.updateProp('columns', editingColumn.value)
    showColumnsEditorModal.value = false
  }

  // 初始化监听
  function initWatchers() {
    watch(() => props.selectedComponent?.id, () => {
      if (props.selectedComponent?.type === 'table') {
        loadDataSources()
      }
    }, { immediate: true })

    watch(() => props.selectedComponent?.props?.datasourceId, (newDsId) => {
      if (props.selectedComponent?.type === 'table' && newDsId) {
        loadTables()
      } else {
        tables.value = []
      }
    })

    watch(() => props.selectedComponent?.props?.tableName, (newTableName) => {
      if (props.selectedComponent?.type === 'table' && newTableName && props.selectedComponent?.props?.datasourceId) {
        loadFeaturesForTable()
      } else {
        availableFeatures.value = []
      }
    })
  }

  return {
    // 状态
    dataSources,
    tables,
    availableFeatures,
    loadingTables,
    loadingFeatures,
    showColumnsEditorModal,
    editingColumn,
    showSingleColumnEditor,
    editingSingleColumn,
    showCreateFeatureModal,
    creatingFeature,
    newFeatureForm,
    // 方法
    loadDataSources,
    loadTables,
    loadFeaturesForTable,
    handleDatasourceChange,
    handleTableChange,
    handleFeatureChange,
    handleCreateFeature,
    openColumnsEditor,
    openColumnEditor,
    handleSaveSingleColumn,
    quickUpdateColumn,
    updateColumn,
    addColumn,
    removeColumn,
    handleSaveColumns,
    initWatchers
  }
}

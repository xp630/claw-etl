<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑功能' : '新增功能'"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
    class="feature-form-dialog"
  >
    <!-- Loading overlay -->
    <div v-if="initialLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    </div>

    <div class="feature-form" v-else>
      <!-- 数据源配置区 -->
      <div class="form-section">
        <div class="section-header">
          <Database class="w-4 h-4" />
          <span>数据源配置</span>
        </div>
        <div class="section-content">
          <div class="form-row">
            <div class="form-item">
              <label class="form-label">数据源</label>
              <el-select
                v-model="formData.datasourceId"
                placeholder="请选择数据源"
                filterable
                clearable
                class="w-full"
                :disabled="loading"
                @change="handleDataSourceChange"
              >
                <el-option
                  v-for="ds in dataSources"
                  :key="ds.id"
                  :label="ds.name + (ds.comment ? ` (${ds.comment})` : '')"
                  :value="ds.id!"
                />
              </el-select>
            </div>
            <div class="form-item" ref="tableSearchRef">
              <label class="form-label">表名</label>
              <el-input
                v-model="tableSearchValue"
                placeholder="搜索表名..."
                clearable
                :disabled="!formData.datasourceId"
                class="w-full"
                @focus="tableSearchOpen = true"
                @input="tableSearchOpen = true"
              >
                <template #prefix>
                  <Search class="w-3 h-3" />
                </template>
                <template #suffix>
                  <X
                    v-if="formData.tableName"
                    class="w-3 h-3 cursor-pointer hover:text-[var(--accent)]"
                    @click.stop="handleTableClear"
                  />
                </template>
              </el-input>
              <!-- Table search dropdown -->
              <div v-if="tableSearchOpen && formData.datasourceId" class="table-dropdown">
                <div
                  v-for="table in filteredTables"
                  :key="table.tableName"
                  class="table-dropdown-item"
                  @click="handleTableSelect(table.tableName)"
                >
                  <span class="table-name">{{ table.tableName }}</span>
                  <span v-if="table.tableComment" class="table-comment">{{ table.tableComment }}</span>
                </div>
                <div v-if="filteredTables.length === 0" class="table-dropdown-empty">
                  无匹配结果
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 基本信息区 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">基本信息</span>
        </div>
        <div class="section-content">
          <div class="form-row-4">
            <div class="form-item">
              <label class="form-label required">功能名称</label>
              <el-input
                v-model="formData.name"
                placeholder="请输入功能名称"
                class="w-full"
              />
            </div>
            <div class="form-item">
              <label class="form-label required">功能编码</label>
              <el-input
                v-model="formData.code"
                placeholder="如: goods"
                :disabled="isEdit"
                class="w-full font-mono"
              />
            </div>
            <div class="form-item">
              <label class="form-label">功能类型</label>
              <el-select v-model="formData.type" class="w-full">
                <el-option value="list" label="列表页" />
                <el-option value="form" label="表单页" />
              </el-select>
            </div>
            <div class="form-item">
              <label class="form-label">状态</label>
              <el-select v-model="formData.status" class="w-full">
                <el-option :value="1" label="启用" />
                <el-option :value="0" label="禁用" />
              </el-select>
            </div>
          </div>
          <div class="form-item">
            <label class="form-label">描述</label>
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="2"
              placeholder="请输入功能描述"
            />
          </div>
        </div>
      </div>

      <!-- API配置区 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">API配置</span>
          <el-button
            v-if="formData.tableName && formData.code && !hasApis"
            size="small"
            type="primary"
            :loading="generating"
            @click="handleGenerateApi"
          >
            生成CRUD API
          </el-button>
        </div>
        <div class="section-content">
          <template v-if="hasApis">
            <el-table :data="apiList" border size="small" class="api-table">
              <el-table-column prop="operation" label="操作" width="80">
                <template #default="{ row }">
                  <span :class="['api-tag', `api-${row.type}`]">{{ row.label }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="API名称" min-width="150">
                <template #default="{ row }">
                  {{ row.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="path" label="路径" min-width="150">
                <template #default="{ row }">
                  <span class="font-mono text-xs">{{ row.path }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">
                  <el-button
                    v-if="row.id"
                    type="primary"
                    link
                    size="small"
                    @click="handleEditApi(row)"
                  >
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <div v-else class="api-empty">
            请在表单配置中选择数据源和表，保存时将自动创建API
          </div>
        </div>
      </div>

      <!-- 菜单配置区 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">菜单配置</span>
        </div>
        <div class="section-content">
          <div class="form-row-4">
            <div class="form-item">
              <label class="form-label">显示在菜单</label>
              <el-select v-model="formData.showInMenu" class="w-full">
                <el-option :value="0" label="不显示" />
                <el-option :value="1" label="显示" />
              </el-select>
            </div>
            <div class="form-item">
              <label class="form-label">菜单图标</label>
              <el-select v-model="formData.menuIcon" class="w-full">
                <el-option value="layout" label="布局" />
                <el-option value="database" label="数据库" />
                <el-option value="listtodo" label="任务" />
                <el-option value="globe" label="API" />
                <el-option value="key" label="应用" />
              </el-select>
            </div>
            <div class="form-item">
              <label class="form-label">菜单排序</label>
              <el-input-number
                v-model="formData.menuOrder"
                :min="0"
                :max="9999"
                class="w-full"
              />
            </div>
            <div class="form-item">
              <label class="form-label">路由路径</label>
              <el-input
                v-model="formData.routePath"
                placeholder="/dynamic/goods"
                class="w-full font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 字段配置区 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">字段配置</span>
          <el-button size="small" type="primary" @click="handleAddColumn">
            <Plus class="w-3 h-3 mr-1" />
            添加字段
          </el-button>
        </div>
        <div class="section-content">
          <template v-if="formData.columns && formData.columns.length > 0">
            <el-table :data="formData.columns" border size="small" class="column-table">
              <el-table-column prop="fieldName" label="字段名" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.fieldName" size="small" placeholder="字段名" />
                </template>
              </el-table-column>
              <el-table-column prop="fieldLabel" label="显示名称" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.fieldLabel" size="small" placeholder="显示名称" />
                </template>
              </el-table-column>
              <el-table-column prop="fieldType" label="控件类型" width="100">
                <template #default="{ row }">
                  <el-select v-model="row.fieldType" size="small" class="w-full">
                    <el-option value="text" label="文本" />
                    <el-option value="number" label="数字" />
                    <el-option value="date" label="日期" />
                    <el-option value="select" label="下拉" />
                    <el-option value="image" label="图片" />
                    <el-option value="action" label="操作" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="dataDictionary" label="数据字典" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.dataDictionary" size="small" clearable class="w-full" placeholder="请选择">
                    <el-option
                      v-for="dict in dicts"
                      :key="dict.id"
                      :label="dict.name"
                      :value="dict.code"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="span" label="长度" width="70" align="center">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.span"
                    :min="1"
                    :max="12"
                    size="small"
                    controls-position="right"
                    class="w-full"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="align" label="对齐" width="80">
                <template #default="{ row }">
                  <el-select v-model="row.align" size="small" class="w-full">
                    <el-option value="left" label="左" />
                    <el-option value="center" label="中" />
                    <el-option value="right" label="右" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="visible" label="可见" width="70" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.visible" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="queryCondition" label="查询" width="70" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.queryCondition" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ $index }">
                  <el-button
                    size="small"
                    type="danger"
                    text
                    @click="handleRemoveColumn($index)"
                  >
                    <Trash2 class="w-3 h-3" />
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <div v-else class="column-empty">
            暂无字段配置，选择表后会自动加载字段，或点击"添加字段"手动配置
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Database, Search, Plus, Trash2, X } from 'lucide-vue-next'
import {
  getDataSources,
  getTableList,
  getTableColumns,
  getFeatureDetail,
  saveFeature,
  getApiListSimple,
  generateCrudApi,
  getDictList,
  type DataSource,
  type TableInfo,
  type ColumnInfo,
  type Feature,
  type FeatureColumn,
  type ApiConfig,
  type Dict,
} from '@/lib/api'

interface Props {
  modelValue: boolean
  featureId?: number | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.featureId)
const initialLoading = ref(false)
const saving = ref(false)
const loading = ref(false)
const generating = ref(false)

// 数据源列表
const dataSources = ref<DataSource[]>([])
// 表列表
const tables = ref<TableInfo[]>([])
// 字典列表
const dicts = ref<Dict[]>([])
// API列表
const apis = ref<ApiConfig[]>([])

// 表搜索
const tableSearchValue = ref('')
const tableSearchOpen = ref(false)
const tableSearchRef = ref<HTMLElement | null>(null)

// 计算已生成的API列表
const apiList = computed(() => {
  const code = formData.code
  return [
    {
      type: 'query',
      label: '查询',
      id: formData.queryApiId,
      name: formData.queryApiName,
      path: `/api/${code}/list`
    },
    {
      type: 'create',
      label: '新增',
      id: formData.createApiId,
      name: formData.createApiName,
      path: `/api/${code}/create`
    },
    {
      type: 'update',
      label: '更新',
      id: formData.updateApiId,
      name: formData.updateApiName,
      path: `/api/${code}/update`
    },
    {
      type: 'delete',
      label: '删除',
      id: formData.deleteApiId,
      name: formData.deleteApiName,
      path: `/api/${code}/delete`
    },
    {
      type: 'detail',
      label: '详情',
      id: formData.detailApiId,
      name: formData.detailApiName,
      path: `/api/${code}/detail`
    }
  ]
})

// 是否有API
const hasApis = computed(() => {
  return apiList.value.some(api => api.id)
})

// 表搜索过滤
const filteredTables = computed(() => {
  if (!tableSearchValue.value) return tables.value
  const search = tableSearchValue.value.toLowerCase()
  return tables.value.filter(t =>
    t.tableName.toLowerCase().includes(search) ||
    (t.tableComment && t.tableComment.toLowerCase().includes(search))
  )
})

// 表单数据
const formData = reactive<{
  id?: number
  name: string
  code: string
  type: string
  description: string
  datasourceId?: number
  tableName: string
  status: number
  queryApiId?: number
  queryApiName?: string
  queryApiPath?: string
  createApiId?: number
  createApiName?: string
  updateApiId?: number
  updateApiName?: string
  deleteApiId?: number
  deleteApiName?: string
  detailApiId?: number
  detailApiName?: string
  showInMenu: number
  menuIcon: string
  menuOrder: number
  routePath: string
  columns: FeatureColumn[]
}>({
  name: '',
  code: '',
  type: 'list',
  description: '',
  datasourceId: undefined,
  tableName: '',
  status: 1,
  queryApiId: undefined,
  queryApiName: '',
  queryApiPath: '',
  createApiId: undefined,
  createApiName: '',
  updateApiId: undefined,
  updateApiName: '',
  deleteApiId: undefined,
  deleteApiName: '',
  detailApiId: undefined,
  detailApiName: '',
  showInMenu: 0,
  menuIcon: 'layout',
  menuOrder: 0,
  routePath: '',
  columns: []
})

// 加载数据源
async function loadDataSources() {
  try {
    const data = await getDataSources({ page: 1, limit: 100 })
    dataSources.value = data.list || []
  } catch (error) {
    console.error('Failed to load datasources:', error)
  }
}

// 加载字典列表
async function loadDicts() {
  try {
    const data = await getDictList({ page: 1, limit: 100 })
    dicts.value = data.list || []
  } catch (error) {
    console.error('Failed to load dicts:', error)
  }
}

// 加载API列表
async function loadApis() {
  try {
    const data = await getApiListSimple()
    apis.value = data
  } catch (error) {
    console.error('Failed to load APIs:', error)
  }
}

// 加载表列表
async function loadTables() {
  if (!formData.datasourceId) {
    tables.value = []
    return
  }

  loading.value = true
  try {
    const ds = dataSources.value.find(d => d.id === formData.datasourceId)
    const dbName = ds?.database_name || ds?.name
    if (dbName) {
      tables.value = await getTableList(dbName)
    }
  } catch (error) {
    console.error('Failed to load tables:', error)
  } finally {
    loading.value = false
  }
}

// 加载字段配置
async function loadColumns() {
  if (!formData.datasourceId || !formData.tableName) {
    return
  }

  loading.value = true
  try {
    const ds = dataSources.value.find(d => d.id === formData.datasourceId)
    const dbName = ds?.database_name || ds?.name
    if (dbName) {
      const columns: ColumnInfo[] = await getTableColumns(dbName, formData.tableName)
      formData.columns = columns.map(col => ({
        fieldName: col.columnName,
        fieldLabel: col.columnComment || col.columnName,
        fieldType: mapColumnType(col.dataType),
        span: 1,
        visible: true,
        align: 'left' as const,
        queryCondition: false
      }))
    }
  } catch (error) {
    console.error('Failed to load columns:', error)
  } finally {
    loading.value = false
  }
}

// 映射SQL类型到字段类型
function mapColumnType(dataType: string): FeatureColumn['fieldType'] {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('bigint') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'number'
  }
  if (type.includes('date') && !type.includes('time')) return 'date'
  return 'text'
}

// 加载功能详情
async function loadFeatureDetail() {
  if (!props.featureId) return

  initialLoading.value = true
  try {
    const data = await getFeatureDetail(props.featureId)
    if (data) {
      formData.id = data.id
      formData.name = data.name || ''
      formData.code = data.code || ''
      formData.type = data.type || 'list'
      formData.description = data.description || ''
      formData.datasourceId = data.datasourceId
      formData.tableName = data.tableName || ''
      formData.status = data.status ?? 1
      formData.queryApiId = data.queryApiId
      formData.queryApiName = data.queryApiName
      formData.queryApiPath = data.queryApiPath
      formData.createApiId = data.createApiId
      formData.createApiName = data.createApiName
      formData.updateApiId = data.updateApiId
      formData.updateApiName = data.updateApiName
      formData.deleteApiId = data.deleteApiId
      formData.deleteApiName = data.deleteApiName
      formData.detailApiId = data.detailApiId
      formData.detailApiName = data.detailApiName
      formData.showInMenu = data.showInMenu ?? 0
      formData.menuIcon = data.menuIcon || 'layout'
      formData.menuOrder = data.menuOrder ?? 0
      formData.routePath = data.routePath || ''
      formData.columns = data.columns || []

      // 如果有数据源，加载表列表
      if (formData.datasourceId) {
        await loadTables()
        // 如果字段配置为空且有表名，加载字段
        if ((!formData.columns || formData.columns.length === 0) && formData.tableName) {
          await loadColumns()
        }
      }
    }
  } catch (error) {
    console.error('Failed to load feature detail:', error)
  } finally {
    initialLoading.value = false
  }
}

// 数据源变化
async function handleDataSourceChange() {
  formData.tableName = ''
  formData.columns = []
  tableSearchValue.value = ''
  tableSearchOpen.value = false
  // 清空API
  formData.queryApiId = undefined
  formData.queryApiName = ''
  formData.createApiId = undefined
  formData.createApiName = ''
  formData.updateApiId = undefined
  formData.updateApiName = ''
  formData.deleteApiId = undefined
  formData.deleteApiName = ''
  formData.detailApiId = undefined
  formData.detailApiName = ''
  
  if (formData.datasourceId) {
    await loadTables()
  } else {
    tables.value = []
  }
}

// 选择表
async function handleTableSelect(tableName: string) {
  formData.tableName = tableName
  tableSearchValue.value = tableName
  tableSearchOpen.value = false

  // 自动填充名称和编码
  const table = tables.value.find(t => t.tableName === tableName)
  const tableComment = table?.tableComment || ''

  if (!formData.name) {
    formData.name = tableComment || tableName
  }
  if (!formData.code) {
    formData.code = tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/_/g, '')
  }

  // 加载字段
  await loadColumns()
}

// 清除表选择
function handleTableClear() {
  formData.tableName = ''
  tableSearchValue.value = ''
  formData.columns = []
  // 清空API
  formData.queryApiId = undefined
  formData.queryApiName = ''
  formData.createApiId = undefined
  formData.createApiName = ''
  formData.updateApiId = undefined
  formData.updateApiName = ''
  formData.deleteApiId = undefined
  formData.deleteApiName = ''
  formData.detailApiId = undefined
  formData.detailApiName = ''
}

// 生成CRUD API
async function handleGenerateApi() {
  if (!formData.datasourceId || !formData.tableName || !formData.code) {
    ElMessage.warning('请先选择数据源、表名和填写功能编码')
    return
  }

  generating.value = true
  try {
    const result = await generateCrudApi(formData.datasourceId, formData.tableName, formData.code)
    if (result) {
      formData.queryApiId = result.queryApi?.id
      formData.queryApiName = result.queryApi?.name
      formData.queryApiPath = result.queryApi?.path
      formData.createApiId = result.createApi?.id
      formData.createApiName = result.createApi?.name
      formData.updateApiId = result.updateApi?.id
      formData.updateApiName = result.updateApi?.name
      formData.deleteApiId = result.deleteApi?.id
      formData.deleteApiName = result.deleteApi?.name
      formData.detailApiId = result.detailApi?.id
      formData.detailApiName = result.detailApi?.name
      
      // 刷新API列表
      loadApis()
      ElMessage.success('API生成成功！')
    } else {
      ElMessage.error('API生成失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || 'API生成失败')
  } finally {
    generating.value = false
  }
}

// 编辑API
function handleEditApi(row: any) {
  if (row.id && (window as any).layoutOpenTab) {
    (window as any).layoutOpenTab({
      id: `api-${row.id}`,
      title: `编辑API-${row.name}`,
      path: `/apis/${row.id}`
    })
  }
}

// 添加字段
function handleAddColumn() {
  formData.columns.push({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    span: 1,
    visible: true,
    align: 'left',
    queryCondition: false
  })
}

// 删除字段
function handleRemoveColumn(index: number) {
  formData.columns.splice(index, 1)
}

// 保存
async function handleSave() {
  if (!formData.name || !formData.code) {
    ElMessage.warning('请填写必填项：功能名称、功能编码')
    return
  }

  saving.value = true
  try {
    const data: Partial<Feature> = {
      name: formData.name,
      code: formData.code,
      type: formData.type as any,
      description: formData.description,
      datasourceId: formData.datasourceId,
      tableName: formData.tableName,
      status: formData.status,
      queryApiId: formData.queryApiId,
      queryApiName: formData.queryApiName,
      queryApiPath: formData.queryApiPath,
      createApiId: formData.createApiId,
      createApiName: formData.createApiName,
      updateApiId: formData.updateApiId,
      updateApiName: formData.updateApiName,
      deleteApiId: formData.deleteApiId,
      deleteApiName: formData.deleteApiName,
      detailApiId: formData.detailApiId,
      detailApiName: formData.detailApiName,
      showInMenu: formData.showInMenu,
      menuIcon: formData.menuIcon,
      menuOrder: formData.menuOrder,
      routePath: formData.routePath,
      columns: formData.columns
    }

    if (formData.id) {
      data.id = formData.id
    }

    await saveFeature(data)
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 关闭
function handleClose() {
  visible.value = false
}

// 重置表单
function resetForm() {
  formData.id = undefined
  formData.name = ''
  formData.code = ''
  formData.type = 'list'
  formData.description = ''
  formData.datasourceId = undefined
  formData.tableName = ''
  formData.status = 1
  formData.queryApiId = undefined
  formData.queryApiName = ''
  formData.queryApiPath = ''
  formData.createApiId = undefined
  formData.createApiName = ''
  formData.updateApiId = undefined
  formData.updateApiName = ''
  formData.deleteApiId = undefined
  formData.deleteApiName = ''
  formData.detailApiId = undefined
  formData.detailApiName = ''
  formData.showInMenu = 0
  formData.menuIcon = 'layout'
  formData.menuOrder = 0
  formData.routePath = ''
  formData.columns = []
  tableSearchValue.value = ''
  tableSearchOpen.value = false
}

// 弹窗关闭时重置
function handleClosed() {
  resetForm()
}

// 点击外部关闭搜索下拉
function handleClickOutside(e: MouseEvent) {
  if (tableSearchRef.value && !tableSearchRef.value.contains(e.target as Node)) {
    tableSearchOpen.value = false
    if (formData.tableName) {
      tableSearchValue.value = formData.tableName
    }
  }
}

// 监听 visible 变化，初始化数据
watch(visible, async (val) => {
  if (val) {
    await Promise.all([
      loadDataSources(),
      loadApis(),
      loadDicts()
    ])
    if (props.featureId) {
      await loadFeatureDetail()
    } else {
      resetForm()
    }
  }
})

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.feature-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--accent);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-section {
  background: var(--bg-table-header);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  font-weight: 500;
  color: var(--text-primary);
}

.section-title {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.section-content {
  padding: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-item {
  flex: 1;
}

.form-row-4 {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-row-4 .form-item {
  flex: 1;
}

.form-item {
  margin-bottom: 12px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.form-label.required::before {
  content: '*';
  color: var(--danger);
  margin-right: 4px;
}

/* Table search dropdown */
.table-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
}

.table-dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.table-dropdown-item:hover {
  background: var(--bg-hover);
}

.table-dropdown-empty {
  padding: 12px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.table-name {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-primary);
}

.table-comment {
  color: var(--text-muted);
  font-size: 11px;
  margin-left: 8px;
}

/* API table */
.api-table {
  font-size: 13px;
}

.api-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.api-query {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.api-create,
.api-update {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.api-delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.api-detail {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.api-empty {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 13px;
}

/* Column table */
.column-table :deep(.el-table__header-wrapper th) {
  background: var(--bg-tertiary) !important;
}

.column-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.w-full {
  width: 100%;
}

.font-mono {
  font-family: monospace;
}

:deep(.feature-form-dialog .el-dialog__body) {
  padding: 16px 20px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* Override el-select in table */
.column-table :deep(.el-select) {
  width: 100%;
}

.column-table :deep(.el-input-number) {
  width: 100%;
}
</style>

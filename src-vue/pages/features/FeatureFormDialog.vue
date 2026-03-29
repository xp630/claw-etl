<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑功能' : '新增功能'"
    width="1000px"
    :close-on-click-modal="false"
    @closed="handleClosed"
    class="feature-form-dialog"
  >
    <div class="feature-form" v-loading="initialLoading">
      <!-- 左侧面板：数据源和表选择 -->
      <div class="left-panel">
        <div class="panel-header">
          <Database class="w-4 h-4" />
          <span>数据源配置</span>
        </div>
        
        <div class="panel-content">
          <!-- 数据源选择 -->
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

          <!-- 表选择 -->
          <div class="form-item">
            <label class="form-label">表名</label>
            <el-select
              v-model="formData.tableName"
              placeholder="请先选择数据源"
              filterable
              clearable
              :disabled="!formData.datasourceId || loading"
              class="w-full"
              @change="handleTableChange"
            >
              <el-option
                v-for="table in filteredTables"
                :key="table.tableName"
                :label="table.tableName"
                :value="table.tableName"
              >
                <div class="table-option">
                  <span class="table-name">{{ table.tableName }}</span>
                  <span v-if="table.tableComment" class="table-comment">{{ table.tableComment }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 表搜索过滤 -->
          <div v-if="formData.datasourceId && tables.length > 0" class="form-item">
            <el-input
              v-model="tableSearch"
              placeholder="搜索表名..."
              clearable
              size="small"
              class="w-full"
            >
              <template #prefix>
                <Search class="w-3 h-3" />
              </template>
            </el-input>
          </div>

          <!-- 已选表信息 -->
          <div v-if="formData.tableName" class="selected-table-info">
            <div class="info-item">
              <span class="info-label">已选择：</span>
              <span class="info-value">{{ formData.tableName }}</span>
            </div>
            <div class="info-item" v-if="selectedTableComment">
              <span class="info-label">表注释：</span>
              <span class="info-value">{{ selectedTableComment }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板：功能和字段配置 -->
      <div class="right-panel">
        <!-- 基本信息 -->
        <div class="config-section">
          <div class="section-header">
            <span class="section-title">基本信息</span>
          </div>
          <div class="section-content">
            <div class="form-row">
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
                  placeholder="请输入功能编码"
                  :disabled="isEdit"
                  class="w-full font-mono"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">功能类型</label>
                <el-select v-model="formData.type" class="w-full">
                  <el-option value="list" label="列表页" />
                  <el-option value="page" label="页面" />
                  <el-option value="button" label="按钮" />
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
              <label class="form-label">功能描述</label>
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="2"
                placeholder="请输入功能描述"
              />
            </div>
          </div>
        </div>

        <!-- 字段配置 -->
        <div class="config-section">
          <div class="section-header">
            <span class="section-title">字段配置</span>
            <el-button size="small" type="primary" @click="handleAddColumn">
              <Plus class="w-3 h-3 mr-1" />
              添加字段
            </el-button>
          </div>
          <div class="section-content">
            <div v-if="formData.columns && formData.columns.length > 0" class="column-table">
              <el-table :data="formData.columns" border size="small" style="width: 100%">
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
                <el-table-column prop="fieldType" label="类型" width="100">
                  <template #default="{ row }">
                    <el-select v-model="row.fieldType" size="small" class="w-full">
                      <el-option value="text" label="文本" />
                      <el-option value="number" label="数字" />
                      <el-option value="date" label="日期" />
                      <el-option value="select" label="下拉" />
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
            </div>
            <div v-else class="empty-columns">
              <span class="text-[var(--text-muted)] text-sm">暂无字段配置，选择表后会自动加载字段，或点击"添加字段"手动配置</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Database, Search, Plus, Trash2 } from 'lucide-vue-next'
import {
  getDataSources,
  getTableList,
  getTableColumns,
  getFeatureDetail,
  saveFeature,
  type DataSource,
  type TableInfo,
  type ColumnInfo,
  type Feature,
  type FeatureColumn
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

// 数据源列表
const dataSources = ref<DataSource[]>([])
// 表列表
const tables = ref<TableInfo[]>([])
// 表搜索
const tableSearch = ref('')

// 表搜索过滤
const filteredTables = computed(() => {
  if (!tableSearch.value) return tables.value
  const search = tableSearch.value.toLowerCase()
  return tables.value.filter(t =>
    t.tableName.toLowerCase().includes(search) ||
    (t.tableComment && t.tableComment.toLowerCase().includes(search))
  )
})

// 选中表的注释
const selectedTableComment = computed(() => {
  const table = tables.value.find(t => t.tableName === formData.tableName)
  return table?.tableComment || ''
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
  columns: FeatureColumn[]
}>({
  name: '',
  code: '',
  type: 'list',
  description: '',
  datasourceId: undefined,
  tableName: '',
  status: 1,
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
        visible: true,
        queryCondition: false,
        span: 1,
        align: 'left' as const
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
      formData.columns = data.columns || []

      // 如果有数据源，加载表列表
      if (formData.datasourceId) {
        await loadTables()
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
  tableSearch.value = ''
  if (formData.datasourceId) {
    await loadTables()
  } else {
    tables.value = []
  }
}

// 表变化
async function handleTableChange() {
  if (!formData.tableName) {
    return
  }

  // 自动填充名称和编码
  const table = tables.value.find(t => t.tableName === formData.tableName)
  const tableComment = table?.tableComment || ''
  
  if (!formData.name) {
    formData.name = tableComment || formData.tableName
  }
  if (!formData.code) {
    formData.code = formData.tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/_/g, '')
  }

  // 加载字段
  await loadColumns()
}

// 添加字段
function handleAddColumn() {
  formData.columns.push({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    visible: true,
    queryCondition: false,
    span: 1,
    align: 'left'
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
  formData.columns = []
  tableSearch.value = ''
}

// 弹窗关闭时重置
function handleClosed() {
  resetForm()
}

// 监听 visible 变化，初始化数据
watch(visible, (val) => {
  if (val) {
    loadDataSources()
    if (props.featureId) {
      loadFeatureDetail()
    } else {
      resetForm()
    }
  }
})
</script>

<style scoped>
.feature-form {
  display: flex;
  gap: 16px;
  min-height: 400px;
  max-height: 70vh;
  overflow: hidden;
}

.left-panel {
  width: 40%;
  min-width: 280px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  font-weight: 500;
  color: var(--text-primary);
}

.panel-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 16px;
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

.table-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.table-name {
  font-family: monospace;
  font-size: 12px;
}

.table-comment {
  color: var(--text-muted);
  font-size: 11px;
}

.selected-table-info {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 12px;
}

.info-item {
  display: flex;
  margin-bottom: 4px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-muted);
  min-width: 56px;
}

.info-value {
  color: var(--text-primary);
  word-break: break-all;
}

.config-section {
  background: var(--bg-secondary);
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

.column-table :deep(.el-table__header-wrapper th) {
  background: var(--bg-tertiary) !important;
}

.empty-columns {
  text-align: center;
  padding: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.feature-form-dialog .el-dialog__body) {
  padding: 16px 20px;
}

.w-full {
  width: 100%;
}

.font-mono {
  font-family: monospace;
}
</style>

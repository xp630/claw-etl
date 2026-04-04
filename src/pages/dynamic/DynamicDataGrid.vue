<template>
  <div class="dynamic-grid-page">
    <!-- Page Header -->
    <header class="page-header">
      <h1 class="page-title">{{ feature?.name || '加载中...' }}</h1>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Not Found -->
    <div v-else-if="!feature" class="empty-state">
      <p>功能不存在</p>
    </div>

    <!-- List Page -->
    <div v-else-if="feature.type === 'list'">
      <!-- Search Form -->
      <form v-if="queryFields.length > 0" @submit.prevent="handleSearch" class="search-form">
        <div class="search-row">
          <div class="search-fields">
            <div
              v-for="col in displayQueryFields"
              :key="col.fieldName"
              class="search-field"
            >
              <label class="field-label">{{ col.fieldLabel }}</label>
              <select
                v-if="col.fieldType === 'select'"
                v-model="searchParams[col.fieldName]"
                class="field-input"
              >
                <option value="">请选择</option>
                <option v-for="item in getDictItems(col.dataDictionary)" :key="item.itemValue" :value="item.itemValue">
                  {{ item.itemLabel }}
                </option>
              </select>
              <input
                v-else-if="col.fieldType === 'number'"
                type="number"
                v-model="searchParams[col.fieldName]"
                class="field-input"
                :placeholder="`请输入${col.fieldLabel}`"
              />
              <input
                v-else
                type="text"
                v-model="searchParams[col.fieldName]"
                class="field-input"
                :placeholder="`请输入${col.fieldLabel}`"
              />
            </div>
          </div>
          <div class="search-actions">
            <button type="submit" class="btn btn-primary">
              <Search class="btn-icon" />搜索
            </button>
            <el-dropdown v-if="feature.createApiId" trigger="click">
              <button type="button" class="btn btn-primary">
                <Plus class="btn-icon" />新增
              </button>
            </el-dropdown>
            <el-dropdown trigger="click">
              <button type="button" class="btn btn-secondary">
                <Download class="btn-icon" />导出
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openColumnSelector">
                    <Columns class="w-4 h-4 mr-2 inline" />列配置
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport('current')">
                    <Download class="w-4 h-4 mr-2 inline" />导出当前页
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport('all')">
                    <Download class="w-4 h-4 mr-2 inline" />导出全部 ({{ total }} 条)
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button
              v-if="queryFields.length > 4"
              type="button"
              @click="showAdvanced = !showAdvanced"
              class="btn btn-ghost"
              :title="showAdvanced ? '收起' : '展开'"
            >
              <ChevronUp v-if="showAdvanced" class="btn-icon" />
              <ChevronDown v-else class="btn-icon" />
            </button>
          </div>
        </div>
      </form>

      <!-- Data Table -->
      <div class="table-container">
        <div v-if="dataLoading" class="table-loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <el-table
          :data="data"
          v-loading="dataLoading"
          row-key="id"
          :header-cell-style="{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }"
        >
          <el-table-column
            v-for="col in displayColumns"
            :key="col.fieldName"
            :prop="col.fieldName"
            :label="col.fieldLabel"
            :width="150"
            :align="col.align || 'left'"
            :show-overflow-tooltip="true"
          >
            <template #default="{ row }">
              {{ renderCellValue(row[col.fieldName], col) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button v-if="feature.detailApiId" link size="small" type="primary" @click="handleView(row)">
                  <Eye class="w-4 h-4" />
                </el-button>
                <el-button v-if="feature.updateApiId" link size="small" type="primary" @click="handleEdit(row)">
                  <Edit2 class="w-4 h-4" />
                </el-button>
                <el-button v-if="feature.deleteApiId" link size="small" type="danger" @click="handleDelete(row)">
                  <Trash2 class="w-4 h-4" />
                </el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div class="table-empty">暂无数据</div>
          </template>
        </el-table>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="pagination-bar">
        <div class="pagination-info">
          <span>每页</span>
          <el-select v-model="pageSize" @change="handlePageSizeChange" size="small" style="width: 80px">
            <el-option :value="5" label="5" />
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
          </el-select>
          <span>条，共 {{ total }} 条</span>
        </div>
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Column Selector Dialog -->
    <el-dialog v-model="showColumnSelector" title="选择显示列" width="400px">
      <div class="column-list">
        <div v-for="col in visibleColumns" :key="col.fieldName" class="column-item">
          <el-checkbox v-model="selectedColumns" :label="col.fieldName" @change="saveColumnConfig">
            {{ col.fieldLabel }}
          </el-checkbox>
        </div>
      </div>
      <template #footer>
        <el-button @click="showColumnSelector = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Form Dialog -->
    <el-dialog
      v-model="showFormModal"
      :title="isEditMode ? '编辑' : '新增'"
      width="600px"
      @closed="resetFormData"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item
          v-for="col in formColumns"
          :key="col.fieldName"
          :label="col.fieldLabel"
        >
          <select v-if="col.fieldType === 'select'" v-model="formData[col.fieldName]" class="w-full">
            <option value="">请选择</option>
            <option v-for="item in getDictItems(col.dataDictionary)" :key="item.itemValue" :value="item.itemValue">
              {{ item.itemLabel }}
            </option>
          </select>
          <el-date-picker
            v-else-if="col.fieldType === 'date'"
            v-model="formData[col.fieldName]"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
          <el-input v-else-if="col.fieldType === 'number'" v-model.number="formData[col.fieldName]" type="number" />
          <el-input v-else v-model="formData[col.fieldName]" :placeholder="`请输入${col.fieldLabel}`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormModal = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailModal" title="详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item
          v-for="col in displayColumns"
          :key="col.fieldName"
          :label="col.fieldLabel"
        >
          {{ renderCellValue(detailData[col.fieldName], col) }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Delete Confirm -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400px">
      <p>确定要删除该数据吗？此操作不可撤销。</p>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Plus, Download, Columns, Eye, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import { api, getFeatureByCode, getApiDetail, getAllDictItems, type Feature, type FeatureColumn, type DictItem } from '@/lib/api'

const route = useRoute()

// State
const loading = ref(true)
const dataLoading = ref(false)
const feature = ref<Feature | null>(null)
const data = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchParams = ref<Record<string, string>>({})
const dictItems = ref<Record<string, DictItem[]>>({})
const showColumnSelector = ref(false)
const showFormModal = ref(false)
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)
const showAdvanced = ref(false)
const isEditMode = ref(false)
const formLoading = ref(false)
const deleteLoading = ref(false)
const detailData = ref<any>({})
const currentDeleteId = ref<any>(null)
const formData = ref<Record<string, any>>({})

// Computed
const visibleColumns = computed(() => {
  return feature.value?.columns?.filter(col => col.visible !== false && col.fieldType !== 'action') || []
})

const queryFields = computed(() => {
  return visibleColumns.value.filter(col => col.queryCondition)
})

const displayQueryFields = computed(() => {
  if (queryFields.value.length <= 4 || showAdvanced.value) {
    return queryFields.value
  }
  return queryFields.value.slice(0, 4)
})

const displayColumns = computed(() => {
  if (!feature.value?.columns) return []
  return feature.value.columns.filter(col =>
    selectedColumns.value.includes(col.fieldName) && col.visible !== false
  )
})

const formColumns = computed(() => {
  return visibleColumns.value
})

const selectedColumns = ref<string[]>([])

function initSelectedColumns() {
  if (!feature.value?.columns) return
  const defaultCols = visibleColumns.value.map(col => col.fieldName)
  const storageKey = `columns_${route.params.code}`
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    try {
      const savedColumns = JSON.parse(saved)
      const merged = defaultCols.filter(fieldName =>
        savedColumns.includes(fieldName) || defaultCols.includes(fieldName)
      )
      selectedColumns.value = merged.length > 0 ? merged : defaultCols
    } catch {
      selectedColumns.value = defaultCols
    }
  } else {
    selectedColumns.value = defaultCols
  }
}

function saveColumnConfig() {
  const storageKey = `columns_${route.params.code}`
  localStorage.setItem(storageKey, JSON.stringify(selectedColumns.value))
}

function getDictItems(dictCode?: string): DictItem[] {
  if (!dictCode) return []
  return dictItems.value[dictCode] || []
}

function renderCellValue(value: any, col: FeatureColumn): string {
  if (value === null || value === undefined) return '-'
  if (col.dataDictionary && dictItems.value[col.dataDictionary]) {
    const dictItem = dictItems.value[col.dataDictionary].find(
      item => String(item.itemValue) === String(value)
    )
    if (dictItem) return dictItem.itemLabel
  }
  if (col.fieldType === 'date' && value) {
    return String(value).substring(0, 10)
  }
  if (col.fieldType === 'number') {
    return Number(value).toLocaleString()
  }
  return String(value)
}

async function loadFeature(featureCode: string) {
  loading.value = true
  try {
    const featureData = await getFeatureByCode(featureCode)
    if (featureData) {
      feature.value = featureData
      const allDictItems = await getAllDictItems()
      dictItems.value = allDictItems
      initSelectedColumns()
      if (featureData.queryApiId) loadData()
    }
  } catch (error) {
    console.error('Failed to load feature:', error)
  } finally {
    loading.value = false
  }
}

async function loadData(params?: Record<string, any>) {
  if (!feature.value?.queryApiId) return
  dataLoading.value = true
  try {
    const apiDetail = await getApiDetail(feature.value.queryApiId)
    if (!apiDetail) return

    const queryFieldsList = feature.value.columns?.filter(col => col.queryCondition) || []
    const requestParams: Record<string, any> = {}
    queryFieldsList.forEach(field => {
      const value = params?.[field.fieldName] || searchParams.value[field.fieldName]
      if (value !== undefined && value !== '') {
        requestParams[field.fieldName] = value
      }
    })
    requestParams.page = params?.page ? parseInt(params.page as string) : page.value
    requestParams.pageSize = params?.pageSize ? parseInt(params.pageSize as string) : pageSize.value

    let apiPath = apiDetail.path || ''
    if (apiPath.startsWith('/api/')) apiPath = apiPath.substring(4)
    apiPath = `/api${apiPath}`

    let response: any
    if (apiDetail.method === 'GET') {
      response = (await api.get(apiPath, { params: requestParams })).data
    } else {
      response = (await api.post(apiPath, requestParams)).data
    }

    let dataList: any[] = []
    let totalCount = 0
    if (response) {
      if (Array.isArray(response)) dataList = response
      else if (response.list) {
        dataList = response.list
        totalCount = response.total || response.count || dataList.length
      } else if (response.data && Array.isArray(response.data)) {
        dataList = response.data
        totalCount = response.total || response.count || dataList.length
      }
    }
    data.value = dataList
    total.value = totalCount
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    dataLoading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData({ ...searchParams.value, page: '1' })
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadData({ ...searchParams.value, page: newPage.toString() })
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize
  page.value = 1
  loadData({ ...searchParams.value, pageSize: newSize.toString(), page: '1' })
}

function openCreateModal() {
  isEditMode.value = false
  resetFormData()
  showFormModal.value = true
}

function openColumnSelector() {
  showColumnSelector.value = true
}

async function handleView(row: any) {
  detailData.value = row
  showDetailModal.value = true
}

function handleEdit(row: any) {
  isEditMode.value = true
  formData.value = { ...row }
  showFormModal.value = true
}

function handleDelete(row: any) {
  currentDeleteId.value = row.id || row
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!feature.value?.deleteApiId) {
    ElMessage.error('该功能不支持删除')
    return
  }
  deleteLoading.value = true
  try {
    const apiDetail = await getApiDetail(feature.value.deleteApiId)
    if (!apiDetail) { ElMessage.error('获取接口信息失败'); return }
    let apiPath = apiDetail.path || ''
    if (apiPath.startsWith('/api/')) apiPath = apiPath.substring(4)
    apiPath = `/api${apiPath}`
    const response = await api.post(apiPath, { id: currentDeleteId.value })
    const result = response.data
    if (result.code === 0 || result.code === 1 || result.success) {
      ElMessage.success('删除成功')
      showDeleteConfirm.value = false
      loadData()
    } else {
      ElMessage.error('删除失败: ' + (result.message || '未知错误'))
    }
  } catch (error: any) {
    ElMessage.error('删除失败: ' + (error?.response?.data?.message || '请重试'))
  } finally {
    deleteLoading.value = false
  }
}

async function handleSubmit() {
  if (!feature.value) return
  const apiId = isEditMode.value ? feature.value.updateApiId : feature.value.createApiId
  if (!apiId) {
    ElMessage.error(isEditMode.value ? '该功能不支持编辑' : '该功能不支持新增')
    return
  }
  formLoading.value = true
  try {
    const apiDetail = await getApiDetail(apiId)
    if (!apiDetail) { ElMessage.error('获取接口信息失败'); return }
    let apiPath = apiDetail.path || ''
    if (apiPath.startsWith('/api/')) apiPath = apiPath.substring(4)
    apiPath = `/api${apiPath}`
    const response = await api.post(apiPath, formData.value)
    const result = response.data
    if (result.code === 0 || result.code === 1 || result.success) {
      ElMessage.success(isEditMode.value ? '更新成功' : '新增成功')
      showFormModal.value = false
      loadData()
    } else {
      ElMessage.error((isEditMode.value ? '更新' : '新增') + '失败: ' + (result.message || '未知错误'))
    }
  } catch (error: any) {
    ElMessage.error((isEditMode.value ? '更新' : '新增') + '失败: ' + (error?.response?.data?.message || '请重试'))
  } finally {
    formLoading.value = false
  }
}

function resetFormData() {
  formData.value = {}
}

async function handleExport(type: 'current' | 'all') {
  let exportDataList: any[] = []
  if (type === 'current') {
    if (data.value.length === 0) { ElMessage.warning('暂无数据可导出'); return }
    exportDataList = data.value
  } else {
    if (!feature.value?.queryApiId) { ElMessage.warning('该功能不支持导出全部'); return }
    try {
      const apiDetail = await getApiDetail(feature.value.queryApiId)
      if (!apiDetail) { ElMessage.error('获取接口信息失败'); return }
      const queryFieldsList = feature.value.columns?.filter(col => col.queryCondition) || []
      const requestParams: Record<string, any> = {}
      queryFieldsList.forEach(field => {
        const value = searchParams.value[field.fieldName]
        if (value !== undefined && value !== '') requestParams[field.fieldName] = value
      })
      let apiPath = apiDetail.path || ''
      if (apiPath.startsWith('/api/')) apiPath = apiPath.substring(4)
      apiPath = `/api${apiPath}`
      let response: any
      if (apiDetail.method === 'GET') {
        response = (await api.get(apiPath, { params: { ...requestParams, page: 1, pageSize: total.value } })).data
      } else {
        response = (await api.post(apiPath, { ...requestParams, page: 1, pageSize: total.value })).data
      }
      if (response) {
        if (Array.isArray(response)) exportDataList = response
        else if (response.list) exportDataList = response.list
        else if (response.data && Array.isArray(response.data)) exportDataList = response.data
      }
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请重试')
      return
    }
  }
  if (exportDataList.length === 0) { ElMessage.warning('暂无数据可导出'); return }

  const exportData = exportDataList.map(row => {
    const obj: Record<string, any> = {}
    displayColumns.value.forEach(col => {
      let value = row[col.fieldName]
      if (col.dataDictionary && dictItems.value[col.dataDictionary]) {
        const dictItem = dictItems.value[col.dataDictionary].find(
          item => String(item.itemValue) === String(value)
        )
        if (dictItem) value = dictItem.itemLabel
      }
      if (col.fieldType === 'date' && value) value = String(value).substring(0, 10)
      obj[col.fieldLabel] = value ?? '-'
    })
    return obj
  })

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, feature.value?.name || 'Sheet1')
  const colWidths = displayColumns.value.map(col => ({ wch: Math.max(col.fieldLabel.length * 2, 15) }))
  ws['!cols'] = colWidths
  const suffix = type === 'current' ? '当前页' : '全部'
  XLSX.writeFile(wb, `${feature.value?.name}_${suffix}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
  ElMessage.success('导出成功')
}

watch(() => route.params.code, (newCode) => {
  if (newCode) loadFeature(newCode as string)
})

onMounted(() => {
  const code = route.params.code as string
  if (code) loadFeature(code)
})
</script>

<style scoped>
.dynamic-grid-page {
  padding: 24px;
  background: var(--bg-primary);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Loading & Empty */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Search Form */
.search-form {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.field-input {
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
}

.search-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  padding: 8px;
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* Table */
.table-container {
  background: var(--bg-secondary);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.table-loading {
  position: absolute;
  inset: 0;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0.9;
}

.table-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
}

:deep(.el-table) {
  --el-table-border-color: var(--border-light);
  --el-table-header-bg-color: var(--bg-tertiary);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-bg-color: var(--bg-secondary);
  --el-table-tr-bg-color: var(--bg-secondary);
  --el-table-text-color: var(--text-primary);
}

:deep(.el-table th.el-table__cell) {
  padding: 12px 16px;
}

:deep(.el-table td.el-table__cell) {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
}

:deep(.el-table__row:last-child td.el-table__cell) {
  border-bottom: none;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

/* Column List */
.column-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.column-item {
  padding: 4px 0;
}
</style>

<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">{{ feature?.name || '加载中...' }}</h1>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-64">
      <div class="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div class="text-gray-500 dark:text-gray-400">加载中...</div>
    </div>

    <!-- 功能不存在 -->
    <div v-else-if="!feature" class="flex items-center justify-center h-64">
      <div class="text-gray-500 dark:text-gray-400">功能不存在</div>
    </div>

    <!-- 列表页面 -->
    <div v-else-if="feature.type === 'list'">
      <!-- 搜索条件 -->
      <form v-if="queryFields.length > 0" @submit.prevent="handleSearch" class="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex gap-4 flex-wrap items-end">
          <div class="flex gap-4 flex-wrap flex-1">
            <div
              v-for="col in displayQueryFields"
              :key="col.fieldName"
              class="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between"
            >
              <label class="block text-sm text-gray-500 dark:text-gray-400 truncate">{{ col.fieldLabel }}</label>
              <select
                v-if="col.fieldType === 'select'"
                v-model="searchParams[col.fieldName]"
                class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 text-sm w-full"
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
                class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 text-sm w-full"
                :placeholder="`请输入${col.fieldLabel}`"
              />
              <input
                v-else
                type="text"
                v-model="searchParams[col.fieldName]"
                class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 text-sm w-full"
                :placeholder="`请输入${col.fieldLabel}`"
              />
            </div>
          </div>
          <div class="flex gap-2 items-center shrink-0">
            <button
              type="submit"
              class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Search class="w-4 h-4" />
              搜索
            </button>
            <el-dropdown v-if="feature.createApiId" trigger="click">
              <button
                type="button"
                @click="openCreateModal"
                class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus class="w-4 h-4" />
                新增
              </button>
            </el-dropdown>
            <el-dropdown trigger="click">
              <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center gap-2">
                <Download class="w-4 h-4" />
                导出
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openColumnSelector">
                    <Columns class="w-4 h-4 mr-2 inline" />
                    列配置
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport('current')">
                    <Download class="w-4 h-4 mr-2 inline" />
                    导出当前页
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport('all')">
                    <Download class="w-4 h-4 mr-2 inline" />
                    导出全部 ({{ total }} 条)
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button
              v-if="queryFields.length > 4"
              type="button"
              @click="showAdvanced = !showAdvanced"
              class="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center"
              :title="showAdvanced ? '收起' : '展开'"
            >
              <ChevronUp v-if="showAdvanced" class="w-4 h-4" />
              <ChevronDown v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <!-- 数据表格 -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <div v-if="dataLoading" class="absolute inset-0 bg-white dark:bg-gray-800/80 flex items-center justify-center z-10">
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div class="text-gray-500 dark:text-gray-400 text-sm">加载中...</div>
          </div>
        </div>
        <el-table :data="data" v-loading="dataLoading" stripe style="width: 100%">
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
              <div class="flex items-center justify-center gap-1">
                <el-button
                  v-if="feature.detailApiId"
                  link
                  type="primary"
                  size="small"
                  @click="handleView(row)"
                >
                  <Eye class="w-4 h-4" />
                </el-button>
                <el-button
                  v-if="feature.updateApiId"
                  link
                  type="primary"
                  size="small"
                  @click="handleEdit(row)"
                >
                  <Edit2 class="w-4 h-4" />
                </el-button>
                <el-button
                  v-if="feature.deleteApiId"
                  link
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
                >
                  <Trash2 class="w-4 h-4" />
                </el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <div class="py-12 text-center text-gray-500 dark:text-gray-400">暂无数据</div>
          </template>
        </el-table>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="mt-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">每页</span>
          <el-select v-model="pageSize" @change="handlePageSizeChange" size="small" style="width: 80px">
            <el-option :value="5" label="5" />
            <el-option :value="10" label="10" />
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
          </el-select>
          <span class="text-sm text-gray-500 dark:text-gray-400">条，共 {{ total }} 条记录</span>
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

    <!-- 列选择弹窗 -->
    <el-dialog v-model="showColumnSelector" title="选择显示列" width="400px">
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div v-for="col in visibleColumns" :key="col.fieldName" class="flex items-center gap-2">
          <el-checkbox
            v-model="selectedColumns"
            :label="col.fieldName"
            @change="saveColumnConfig"
          >
            {{ col.fieldLabel }}
          </el-checkbox>
        </div>
      </div>
      <template #footer>
        <el-button @click="showColumnSelector = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
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
          :class="col.span && col.span > 1 ? 'col-span-2' : ''"
        >
          <select
            v-if="col.fieldType === 'select'"
            v-model="formData[col.fieldName]"
            class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 text-sm"
          >
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
          <el-input
            v-else-if="col.fieldType === 'number'"
            v-model.number="formData[col.fieldName]"
            type="number"
          />
          <el-input
            v-else
            v-model="formData[col.fieldName]"
            :placeholder="`请输入${col.fieldLabel}`"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormModal = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
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

    <!-- 删除确认 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400px">
      <p class="text-gray-600 dark:text-gray-400">确定要删除该数据吗？此操作不可撤销。</p>
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

// 状态
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

// 计算属性
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

// 获取选中的列（从 localStorage 恢复或使用默认值）
const selectedColumns = ref<string[]>([])

// 初始化选中的列
function initSelectedColumns() {
  if (!feature.value?.columns) return
  
  const defaultCols = visibleColumns.value.map(col => col.fieldName)
  const storageKey = `columns_${route.params.code}`
  const saved = localStorage.getItem(storageKey)
  
  if (saved) {
    try {
      const savedColumns = JSON.parse(saved)
      // 合并：保存的列中存在的才保留，同时保留所有默认列
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

// 保存列配置到 localStorage
function saveColumnConfig() {
  const storageKey = `columns_${route.params.code}`
  localStorage.setItem(storageKey, JSON.stringify(selectedColumns.value))
}

// 获取数据字典项
function getDictItems(dictCode?: string): DictItem[] {
  if (!dictCode) return []
  return dictItems.value[dictCode] || []
}

// 渲染单元格值
function renderCellValue(value: any, col: FeatureColumn): string {
  if (value === null || value === undefined) {
    return '-'
  }

  // 数据字典翻译
  if (col.dataDictionary && dictItems.value[col.dataDictionary]) {
    const dictItem = dictItems.value[col.dataDictionary].find(
      item => String(item.itemValue) === String(value)
    )
    if (dictItem) {
      return dictItem.itemLabel
    }
  }

  // 日期格式化
  if (col.fieldType === 'date' && value) {
    return String(value).substring(0, 10)
  }

  // 数字格式化
  if (col.fieldType === 'number') {
    return Number(value).toLocaleString()
  }

  return String(value)
}

// 加载功能配置
async function loadFeature(featureCode: string) {
  loading.value = true
  try {
    const featureData = await getFeatureByCode(featureCode)
    if (featureData) {
      feature.value = featureData
      const allDictItems = await getAllDictItems()
      dictItems.value = allDictItems
      initSelectedColumns()
      if (featureData.queryApiId) {
        loadData()
      }
    }
  } catch (error) {
    console.error('Failed to load feature:', error)
  } finally {
    loading.value = false
  }
}

// 加载数据
async function loadData(params?: Record<string, any>) {
  if (!feature.value?.queryApiId) return

  dataLoading.value = true
  try {
    const apiDetail = await getApiDetail(feature.value.queryApiId)
    if (!apiDetail) {
      console.error('Failed to load API detail')
      return
    }

    const queryFields = feature.value.columns?.filter(col => col.queryCondition) || []

    const requestParams: Record<string, any> = {}
    queryFields.forEach(field => {
      const value = params?.[field.fieldName] || searchParams.value[field.fieldName]
      if (value !== undefined && value !== '') {
        requestParams[field.fieldName] = value
      }
    })

    requestParams.page = params?.page ? parseInt(params.page as string) : page.value
    requestParams.pageSize = params?.pageSize ? parseInt(params.pageSize as string) : pageSize.value

    let apiPath = apiDetail.path || ''
    if (apiPath.startsWith('/api/')) {
      apiPath = apiPath.substring(4)
    }
    apiPath = `/api${apiPath}`

    let response: any
    if (apiDetail.method === 'GET') {
      response = await api.get(apiPath, { params: requestParams })
      response = response.data
    } else {
      response = await api.post(apiPath, requestParams)
      response = response.data
    }

    let dataList: any[] = []
    let totalCount = 0

    if (response) {
      if (Array.isArray(response)) {
        dataList = response
      } else if (response.list) {
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

// 搜索
function handleSearch() {
  page.value = 1
  loadData({ ...searchParams.value, page: '1' })
}

// 分页
function handlePageChange(newPage: number) {
  page.value = newPage
  loadData({ ...searchParams.value, page: newPage.toString() })
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize
  page.value = 1
  loadData({ ...searchParams.value, pageSize: newSize.toString(), page: '1' })
}

// 打开新增弹窗
function openCreateModal() {
  isEditMode.value = false
  resetFormData()
  showFormModal.value = true
}

// 打开列配置弹窗
function openColumnSelector() {
  showColumnSelector.value = true
}

// 查看详情
async function handleView(row: any) {
  detailData.value = row
  showDetailModal.value = true
}

// 编辑
function handleEdit(row: any) {
  isEditMode.value = true
  formData.value = { ...row }
  showFormModal.value = true
}

// 删除
function handleDelete(row: any) {
  currentDeleteId.value = row.id || row
  showDeleteConfirm.value = true
}

// 确认删除
async function confirmDelete() {
  if (!feature.value?.deleteApiId) {
    ElMessage.error('该功能不支持删除')
    return
  }

  deleteLoading.value = true
  try {
    const apiDetail = await getApiDetail(feature.value.deleteApiId)
    if (!apiDetail) {
      ElMessage.error('获取接口信息失败')
      return
    }

    let apiPath = apiDetail.path || ''
    if (apiPath.startsWith('/api/')) {
      apiPath = apiPath.substring(4)
    }
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

// 提交表单（新增/编辑）
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
    if (!apiDetail) {
      ElMessage.error('获取接口信息失败')
      return
    }

    let apiPath = apiDetail.path || ''
    if (apiPath.startsWith('/api/')) {
      apiPath = apiPath.substring(4)
    }
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

// 重置表单数据
function resetFormData() {
  formData.value = {}
}

// 导出 Excel
async function handleExport(type: 'current' | 'all') {
  let exportDataList: any[] = []

  if (type === 'current') {
    if (data.value.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    exportDataList = data.value
  } else {
    if (!feature.value?.queryApiId) {
      ElMessage.warning('该功能不支持导出全部')
      return
    }
    
    try {
      const apiDetail = await getApiDetail(feature.value.queryApiId)
      if (!apiDetail) {
        ElMessage.error('获取接口信息失败')
        return
      }

      const queryFields = feature.value.columns?.filter(col => col.queryCondition) || []
      const requestParams: Record<string, any> = {}
      queryFields.forEach(field => {
        const value = searchParams.value[field.fieldName]
        if (value !== undefined && value !== '') {
          requestParams[field.fieldName] = value
        }
      })

      let apiPath = apiDetail.path || ''
      if (apiPath.startsWith('/api/')) {
        apiPath = apiPath.substring(4)
      }
      apiPath = `/api${apiPath}`

      let response: any
      if (apiDetail.method === 'GET') {
        response = await api.get(apiPath, { params: { ...requestParams, page: 1, pageSize: total.value } })
      } else {
        response = await api.post(apiPath, { ...requestParams, page: 1, pageSize: total.value })
      }
      response = response.data

      if (response) {
        if (Array.isArray(response)) {
          exportDataList = response
        } else if (response.list) {
          exportDataList = response.list
        } else if (response.data && Array.isArray(response.data)) {
          exportDataList = response.data
        }
      }
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请重试')
      return
    }
  }

  if (exportDataList.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  const exportData = exportDataList.map(row => {
    const obj: Record<string, any> = {}
    displayColumns.value.forEach(col => {
      let value = row[col.fieldName]
      // 数据字典翻译
      if (col.dataDictionary && dictItems.value[col.dataDictionary]) {
        const dictItem = dictItems.value[col.dataDictionary].find(
          item => String(item.itemValue) === String(value)
        )
        if (dictItem) value = dictItem.itemLabel
      }
      // 日期格式化
      if (col.fieldType === 'date' && value) {
        value = String(value).substring(0, 10)
      }
      obj[col.fieldLabel] = value ?? '-'
    })
    return obj
  })

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, feature.value?.name || 'Sheet1')

  // 设置列宽
  const colWidths = displayColumns.value.map(col => ({
    wch: Math.max(col.fieldLabel.length * 2, 15)
  }))
  ws['!cols'] = colWidths

  const suffix = type === 'current' ? '当前页' : '全部'
  XLSX.writeFile(wb, `${feature.value?.name}_${suffix}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
  ElMessage.success('导出成功')
}

// 监听路由参数变化
watch(
  () => route.params.code,
  (newCode) => {
    if (newCode) {
      loadFeature(newCode as string)
    }
  }
)

// 组件挂载时加载数据
onMounted(() => {
  const code = route.params.code as string
  if (code) {
    loadFeature(code)
  }
})
</script>

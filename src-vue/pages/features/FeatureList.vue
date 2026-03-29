<template>
  <div class="p-6 h-full flex flex-col">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <Layout class="w-6 h-6 text-blue-500" />
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">功能管理</h1>
      </div>
      <el-button type="primary" @click="handleAdd">
        <Plus class="w-4 h-4 mr-1" /> 新增
      </el-button>
    </div>

    <!-- 左右布局主体 -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- 左侧：新增/编辑表单 -->
      <div class="w-[420px] flex-shrink-0 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] flex flex-col overflow-hidden">
        <div class="p-4 border-b border-[var(--border-light)]">
          <h2 class="text-lg font-medium text-[var(--text-primary)]">{{ isEdit ? '编辑功能' : '新增功能' }}</h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- 数据源选择 -->
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1.5">数据源</label>
            <el-select
              v-model="formData.datasourceId"
              placeholder="请选择数据源"
              class="w-full"
              @change="handleDataSourceChange"
            >
              <el-option
                v-for="ds in dataSources"
                :key="ds.id"
                :label="ds.name + (ds.comment ? ' (' + ds.comment + ')' : '')"
                :value="ds.id"
              />
            </el-select>
          </div>

          <!-- 表选择 -->
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1.5">表名</label>
            <el-select
              v-model="formData.tableName"
              placeholder="请先选择数据源"
              class="w-full"
              filterable
              :disabled="!formData.datasourceId"
              @change="handleTableChange"
            >
              <el-option
                v-for="table in tables"
                :key="table.tableName"
                :label="table.tableName + (table.tableComment ? ' - ' + table.tableComment : '')"
                :value="table.tableName"
              />
            </el-select>
          </div>

          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-1.5">功能名称 <span class="text-red-500">*</span></label>
              <el-input v-model="formData.name" placeholder="请输入功能名称" />
            </div>
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-1.5">功能编码 <span class="text-red-500">*</span></label>
              <el-input v-model="formData.code" placeholder="请输入功能编码" :disabled="isEdit" />
            </div>
          </div>

          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1.5">类型</label>
            <el-select v-model="formData.type" class="w-full">
              <el-option value="list" label="列表" />
              <el-option value="page" label="页面" />
              <el-option value="button" label="按钮" />
            </el-select>
          </div>

          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1.5">描述</label>
            <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
          </div>

          <!-- 字段配置 -->
          <div v-if="formData.tableName && columns.length > 0">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm text-[var(--text-muted)]">字段配置</label>
              <el-button size="small" text type="primary" @click="addColumn">添加字段</el-button>
            </div>
            <div class="border border-[var(--border-light)] rounded-lg overflow-hidden">
              <el-table :data="columns" size="small" border>
                <el-table-column prop="fieldName" label="字段名" width="100" />
                <el-table-column prop="fieldLabel" label="标签" width="100">
                  <template #default="{ row }">
                    <el-input v-model="row.fieldLabel" size="small" />
                  </template>
                </el-table-column>
                <el-table-column prop="fieldType" label="类型" width="80">
                  <template #default="{ row }">
                    <el-select v-model="row.fieldType" size="small" class="w-full">
                      <el-option value="text" label="文本" />
                      <el-option value="number" label="数字" />
                      <el-option value="date" label="日期" />
                      <el-option value="select" label="下拉" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="visible" label="显示" width="60">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.visible" :true-value="1" :false-value="0" />
                  </template>
                </el-table-column>
                <el-table-column prop="queryCondition" label="查询" width="60">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.queryCondition" :true-value="1" :false-value="0" />
                  </template>
                </el-table-column>
                <el-table-column label="" width="50">
                  <template #default="{ row, $index }">
                    <el-button size="small" text type="danger" @click="removeColumn($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="p-4 border-t border-[var(--border-light)] flex gap-2">
          <el-button class="flex-1" @click="resetForm">重置</el-button>
          <el-button type="primary" class="flex-1" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </div>

      <!-- 右侧：功能列表 -->
      <div class="flex-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] flex flex-col overflow-hidden">
        <!-- 搜索栏 -->
        <div class="p-4 border-b border-[var(--border-light)]">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索功能名称或编码..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <Search class="w-4 h-4 text-[var(--text-muted)]" />
            </template>
          </el-input>
        </div>

        <!-- 列表 -->
        <div class="flex-1 overflow-y-auto">
          <el-table :data="features" v-loading="loading" stripe style="width: 100%">
            <el-table-column prop="name" label="功能名称" min-width="150" />
            <el-table-column prop="code" label="功能编码" min-width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type === 'page' ? '页面' : row.type === 'list' ? '列表' : row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="p-4 border-t border-[var(--border-light)] flex justify-end">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="limit"
            :page-sizes="[5, 10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            @size-change="loadFeatures"
            @current-change="loadFeatures"
          />
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400px">
      <p>确定要删除该功能吗？此操作不可撤销。</p>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Layout } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { getFeatures, getFeatureDetail, saveFeature, deleteFeature, getDataSources, getTableList, getTableColumns } from '@/lib/api'
import type { Feature, FeatureColumn } from '@/lib/api'

const features = ref<Feature[]>([])
const loading = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)

const dataSources = ref<any[]>([])
const tables = ref<any[]>([])
const columns = ref<FeatureColumn[]>([])
const isEdit = ref(false)

const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  type: 'list',
  description: '',
  datasourceId: undefined as number | undefined,
  tableName: '',
})

onMounted(() => {
  loadFeatures()
  loadDataSources()
})

async function loadFeatures() {
  loading.value = true
  try {
    const data = await getFeatures({ page: page.value, limit: limit.value, keyword: searchKeyword.value })
    features.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('Failed to load features:', error)
  } finally {
    loading.value = false
  }
}

async function loadDataSources() {
  try {
    const data = await getDataSources({})
    dataSources.value = data.list || []
  } catch (error) {
    console.error('Failed to load data sources:', error)
  }
}

async function handleDataSourceChange(dsId: number) {
  formData.tableName = ''
  columns.value = []
  if (!dsId) return

  // 找到数据源获取库名
  const ds = dataSources.value.find(d => d.id === dsId)
  if (!ds) return

  const dbName = ds.database_name || ds.dbName || ds.databaseName
  if (!dbName) return

  try {
    const tableList = await getTableList(dbName)
    tables.value = tableList || []
  } catch (error) {
    console.error('Failed to load tables:', error)
  }
}

async function handleTableChange(tableName: string) {
  if (!tableName || !formData.datasourceId) {
    columns.value = []
    return
  }

  const ds = dataSources.value.find(d => d.id === formData.datasourceId)
  if (!ds) return

  const dbName = ds.database_name || ds.dbName || ds.databaseName
  if (!dbName) return

  try {
    const cols = await getTableColumns(dbName, tableName)
    columns.value = (cols || []).map((col: any) => ({
      fieldName: col.columnName,
      fieldLabel: col.columnComment || col.columnName,
      fieldType: col.dataType?.includes('int') || col.dataType?.includes('decimal') ? 'number' : 'text',
      span: 1,
      visible: 1,
      align: 'left' as const,
      queryCondition: 0,
    }))
  } catch (error) {
    console.error('Failed to load columns:', error)
  }
}

function handleSearch() {
  page.value = 1
  loadFeatures()
}

function handleAdd() {
  isEdit.value = false
  resetForm()
}

async function handleEdit(row: Feature) {
  isEdit.value = true
  formData.id = row.id
  formData.name = row.name
  formData.code = row.code
  formData.type = row.type || 'list'
  formData.description = row.description || ''
  formData.datasourceId = row.datasourceId
  formData.tableName = row.tableName || ''

  if (row.datasourceId && row.tableName) {
    handleDataSourceChange(row.datasourceId).then(() => {
      handleTableChange(row.tableName || '')
    })
  }

  if (row.id) {
    try {
      const detail = await getFeatureDetail(row.id)
      if (detail && detail.columns) {
        columns.value = detail.columns
      }
    } catch (error) {
      console.error('Failed to load feature detail:', error)
    }
  }
}

function confirmDelete(row: Feature) {
  deleteId.value = row.id!
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (deleteId.value) {
    try {
      await deleteFeature(deleteId.value)
      ElMessage.success('删除成功')
      showDeleteConfirm.value = false
      loadFeatures()
    } catch (error) {
      console.error('Failed to delete feature:', error)
    }
  }
}

async function handleSave() {
  if (!formData.name || !formData.code) {
    ElMessage.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    const data = {
      ...formData,
      columns: columns.value,
    }
    await saveFeature(data)
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    resetForm()
    loadFeatures()
  } catch (error) {
    console.error('Failed to save feature:', error)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  formData.id = undefined
  formData.name = ''
  formData.code = ''
  formData.type = 'list'
  formData.description = ''
  formData.datasourceId = undefined
  formData.tableName = ''
  columns.value = []
  isEdit.value = false
}

function addColumn() {
  columns.value.push({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    span: 1,
    visible: 1,
    align: 'left',
    queryCondition: 0,
  })
}

function removeColumn(index: number) {
  columns.value.splice(index, 1)
}
</script>

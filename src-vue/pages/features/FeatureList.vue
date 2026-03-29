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
      <!-- 左侧：数据源-表树形结构 -->
      <div class="w-72 flex-shrink-0 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] flex flex-col overflow-hidden">
        <div class="p-3 border-b border-[var(--border-light)]">
          <h2 class="text-sm font-medium text-[var(--text-primary)]">数据源 / 表</h2>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <el-tree
            :data="treeData"
            :props="{ label: 'label', children: 'children' }"
            node-key="id"
            :default-expand-all="true"
            :highlight-current="true"
            @node-click="handleNodeClick"
            class="feature-tree"
          >
            <template #default="{ node, data }">
              <div class="flex items-center gap-2 py-0.5">
                <el-icon v-if="data.type === 'datasource'" class="text-blue-500"><Connection /></el-icon>
                <el-icon v-else-if="data.type === 'table'" class="text-green-500"><Grid /></el-icon>
                <span class="text-sm">{{ node.label }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧：功能列表 -->
      <div class="flex-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] flex flex-col overflow-hidden">
        <!-- 搜索栏 -->
        <div class="p-4 border-b border-[var(--border-light)] flex items-center gap-3">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索功能名称或编码..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            class="flex-1"
          >
            <template #prefix>
              <Search class="w-4 h-4 text-[var(--text-muted)]" />
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEdit ? '编辑功能' : '新增功能'"
      width="600px"
      @closed="resetForm"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="数据源" required>
          <el-select v-model="formData.datasourceId" placeholder="请选择数据源" class="w-full" @change="handleDsChange">
            <el-option
              v-for="ds in dataSources"
              :key="ds.id"
              :label="ds.name + (ds.comment ? ' (' + ds.comment + ')' : '')"
              :value="ds.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="表名">
          <el-select v-model="formData.tableName" placeholder="请先选择数据源" class="w-full" filterable :disabled="!formData.datasourceId" @change="handleTableChange">
            <el-option v-for="t in tables" :key="t.tableName" :label="t.tableName + (t.tableComment ? ' - ' + t.tableComment : '')" :value="t.tableName" />
          </el-select>
        </el-form-item>
        <el-form-item label="功能名称" required>
          <el-input v-model="formData.name" placeholder="请输入功能名称" />
        </el-form-item>
        <el-form-item label="功能编码" required>
          <el-input v-model="formData.code" placeholder="请输入功能编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.type" class="w-full">
            <el-option value="list" label="列表" />
            <el-option value="page" label="页面" />
            <el-option value="button" label="按钮" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>

        <!-- 字段配置 -->
        <el-form-item v-if="formData.tableName && columns.length > 0" label="字段配置">
          <el-table :data="columns" size="small" border class="w-full">
            <el-table-column prop="fieldName" label="字段名" width="100" />
            <el-table-column prop="fieldLabel" label="标签" width="120">
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
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

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
import { Plus, Search, Layout, Connection, Grid } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { getFeatures, getFeatureDetail, saveFeature, deleteFeature, getDataSources, getTableList, getTableColumns, type Feature, type FeatureColumn } from '@/lib/api'

interface TreeNode {
  id: string
  label: string
  type: 'datasource' | 'table'
  datasourceId?: number
  tableName?: string
  children?: TreeNode[]
}

const features = ref<Feature[]>([])
const loading = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataSources = ref<any[]>([])
const tables = ref<any[]>([])
const columns = ref<FeatureColumn[]>([])
const treeData = ref<TreeNode[]>([])

const showFormDialog = ref(false)
const showDeleteConfirm = ref(false)
const isEdit = ref(false)
const deleteId = ref<number | null>(null)
const selectedDsId = ref<number | null>(null)

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
  loadTree()
  loadFeatures()
})

async function loadTree() {
  try {
    const dsData = await getDataSources({})
    dataSources.value = dsData.list || []
    treeData.value = dataSources.value.map((ds: any) => ({
      id: `ds_${ds.id}`,
      label: ds.name + (ds.comment ? ` (${ds.comment})` : ''),
      type: 'datasource' as const,
      datasourceId: ds.id,
      children: [],
    }))
    // 加载每个数据源的表
    for (const node of treeData.value) {
      if (node.datasourceId) {
        const dbName = dataSources.value.find((d: any) => d.id === node.datasourceId)?.database_name
          || dataSources.value.find((d: any) => d.id === node.datasourceId)?.dbName
          || dataSources.value.find((d: any) => d.id === node.datasourceId)?.databaseName
        if (dbName) {
          try {
            const tableList = await getTableList(dbName)
            node.children = (tableList || []).map((t: any) => ({
              id: `table_${node.datasourceId}_${t.tableName}`,
              label: t.tableName + (t.tableComment ? ` (${t.tableComment})` : ''),
              type: 'table' as const,
              datasourceId: node.datasourceId,
              tableName: t.tableName,
            }))
          } catch (e) {
            console.error('Failed to load tables for', dbName, e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to load tree:', error)
  }
}

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

function handleNodeClick(data: TreeNode) {
  if (data.type === 'datasource') {
    selectedDsId.value = data.datasourceId || null
  } else {
    selectedDsId.value = data.datasourceId || null
    formData.tableName = data.tableName || ''
  }
  // 点击后刷新列表（带筛选）
  searchKeyword.value = ''
  page.value = 1
  loadFeatures()
}

async function handleDsChange(dsId: number) {
  formData.tableName = ''
  columns.value = []
  const ds = dataSources.value.find((d: any) => d.id === dsId)
  if (!ds) return
  const dbName = ds.database_name || ds.dbName || ds.databaseName
  if (dbName) {
    const list = await getTableList(dbName)
    tables.value = list || []
  }
}

async function handleTableChange(tableName: string) {
  if (!tableName || !formData.datasourceId) {
    columns.value = []
    return
  }
  const ds = dataSources.value.find((d: any) => d.id === formData.datasourceId)
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
  showFormDialog.value = true
}

async function handleEdit(row: Feature) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type || 'list',
    description: row.description || '',
    datasourceId: row.datasourceId,
    tableName: row.tableName || '',
  })
  if (row.datasourceId) {
    await handleDsChange(row.datasourceId)
  }
  if (row.id) {
    try {
      const detail = await getFeatureDetail(row.id)
      if (detail && detail.columns) {
        columns.value = detail.columns
      }
    } catch (error) {
      console.error('Failed to load detail:', error)
    }
  }
  showFormDialog.value = true
}

function confirmDelete(row: Feature) {
  deleteId.value = row.id!
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (deleteId.value) {
    await deleteFeature(deleteId.value)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    loadFeatures()
  }
}

async function handleSave() {
  if (!formData.name || !formData.code) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    await saveFeature({ ...formData, columns: columns.value })
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    showFormDialog.value = false
    loadFeatures()
  } catch (error) {
    console.error('Failed to save:', error)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    id: undefined,
    name: '',
    code: '',
    type: 'list',
    description: '',
    datasourceId: undefined,
    tableName: '',
  })
  columns.value = []
}
</script>

<style scoped>
.feature-tree {
  background: transparent;
}
:deep(.el-tree-node__content) {
  height: 32px;
}
</style>

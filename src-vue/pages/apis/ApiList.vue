<template>
  <div class="api-list-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <Globe class="header-icon" />
        <div class="header-text">
          <h1>API 管理</h1>
          <p>管理系统 API 接口</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="router.push('/apis/log')">
          <FileText class="btn-icon" />访问日志
        </el-button>
        <el-button type="primary" @click="router.push('/apis/new')">
          <Plus class="btn-icon" />新增 API
        </el-button>
      </div>
    </header>

    <!-- Search -->
    <div class="search-bar">
      <div class="search-fields">
        <el-input
          v-model="searchForm.name"
          placeholder="API 名称"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.path"
          placeholder="请求路径"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="search-actions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table
        :data="filteredApis"
        v-loading="loading"
        row-key="id"
        :header-cell-style="{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }"
      >
        <el-table-column prop="id" label="ID" width="80" align="right" />
        <el-table-column prop="name" label="API 名称" min-width="160">
          <template #default="{ row }">
            <span class="api-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="180">
          <template #default="{ row }">
            <code class="api-path">{{ row.path }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="90" align="center">
          <template #default="{ row }">
            <span class="method-badge" :class="`method-${(row.method || 'POST').toLowerCase()}`">
              {{ row.method || 'POST' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="datasourceName" label="数据源" width="120" />
        <el-table-column prop="tableName" label="表名" width="120" />
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="desc-text">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status === 1 ? 'status-active' : 'status-disabled'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="right" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link size="small" type="primary" @click="handleTest(row)">测试</el-button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button link size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="table-empty">
            <Globe class="empty-icon" />
            <p>暂无 API 数据</p>
          </div>
        </template>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增 API' : '编辑 API'" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="API 名称" required>
          <el-input v-model="formData.name" placeholder="请输入 API 名称" />
        </el-form-item>
        <el-form-item label="路径" required>
          <el-input v-model="formData.path" placeholder="/api/xxx" />
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="formData.method" class="w-full">
            <el-option label="POST" value="POST" />
            <el-option label="GET" value="GET" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- Test Dialog -->
    <el-dialog v-model="testDialogVisible" title="测试 API" width="700px">
      <div v-if="testApiRow" class="test-header">
        <strong>{{ testApiRow.name }}</strong>
        <span class="method-badge" :class="`method-${(testApiRow.method || 'POST').toLowerCase()}`">{{ testApiRow.method }}</span>
        <code class="api-path">{{ testApiRow.path }}</code>
      </div>
      <div class="test-grid">
        <div class="test-panel">
          <h4 class="panel-title">请求参数 (JSON)</h4>
          <el-input v-model="testParams" type="textarea" :rows="8" placeholder='{"key": "value"}' />
        </div>
        <div class="test-panel">
          <h4 class="panel-title">响应结果</h4>
          <div v-if="testLoading" class="panel-loading">
            <div class="loading-spinner"></div>
          </div>
          <pre v-else-if="testResult" class="panel-result">{{ testResult }}</pre>
          <div v-else class="panel-empty">暂无结果</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testLoading" @click="executeTest">执行测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Globe, Plus, FileText } from 'lucide-vue-next'
import { getApiList, saveApi, deleteApi, testApi } from '@/lib/api'

const router = useRouter()

interface ApiItem {
  id?: number
  name: string
  path: string
  method?: string
  datasourceId?: number
  datasourceName?: string
  tableName?: string
  description?: string
  status: number
}

const loading = ref(false)
const apis = ref<ApiItem[]>([])
const searchForm = reactive({ name: '', path: '' })
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const formData = reactive<ApiItem>({ name: '', path: '', method: 'POST', description: '', status: 1 })

const testDialogVisible = ref(false)
const testApiRow = ref<ApiItem | null>(null)
const testParams = ref('{}')
const testResult = ref('')
const testLoading = ref(false)

const filteredApis = computed(() => {
  return apis.value.filter(api => {
    const matchName = !searchForm.name || api.name?.toLowerCase().includes(searchForm.name.toLowerCase())
    const matchPath = !searchForm.path || api.path?.toLowerCase().includes(searchForm.path.toLowerCase())
    return matchName && matchPath
  })
})

function handleSizeChange() {
  page.value = 1
  loadData()
}

function handlePageChange() {
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const data = await getApiList({ page: page.value, limit: limit.value, ...searchForm })
    apis.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('Failed to load APIs:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

function handleReset() {
  searchForm.name = ''
  searchForm.path = ''
  page.value = 1
  loadData()
}

function handleEdit(row: ApiItem) {
  if (row.id) router.push(`/apis/${row.id}`)
}

async function handleSave() {
  if (!formData.name || !formData.path) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    await saveApi(formData)
    ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await deleteApi(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    ElMessage.error('删除失败')
  }
}

function handleTest(row: ApiItem) {
  testApiRow.value = row
  testParams.value = '{}'
  testResult.value = ''
  testDialogVisible.value = true
}

async function executeTest() {
  if (!testApiRow.value?.id) return
  testLoading.value = true
  testResult.value = ''
  try {
    let params = {}
    try { params = JSON.parse(testParams.value) } catch {}
    const res = await testApi(testApiRow.value.id, params)
    testResult.value = JSON.stringify(res, null, 2)
  } catch (error: any) {
    testResult.value = `Error: ${error.message}`
  } finally {
    testLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.api-list-page {
  padding: 24px;
  background: var(--bg-primary);
  min-height: 100vh;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
}

.header-text h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.header-text p {
  font-size: 12px;
  color: var(--text-muted);
  margin: 2px 0 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

/* Search */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-radius: 10px;
  margin-bottom: 16px;
}

.search-fields {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 200px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

/* Table */
.table-container {
  background: var(--bg-secondary);
  border-radius: 10px;
  overflow: hidden;
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

.api-name {
  font-weight: 500;
  color: var(--text-primary);
}

.api-path {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  color: var(--text-secondary);
}

.desc-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Method Badge */
.method-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'SF Mono', Monaco, monospace;
}

.method-get {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.method-post {
  background: color-mix(in srgb, var(--info) 15%, transparent);
  color: var(--info);
}

.method-put {
  background: color-mix(in srgb, var(--warning) 15%, transparent);
  color: var(--warning);
}

.method-delete {
  background: color-mix(in srgb, var(--danger) 15%, transparent);
  color: var(--danger);
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.status-disabled {
  background: color-mix(in srgb, var(--text-muted) 15%, transparent);
  color: var(--text-muted);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

/* Pagination */
.pagination-bar {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-light);
}

/* Empty State */
.table-empty {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
  opacity: 0.4;
}

.table-empty p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* Test Dialog */
.test-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.test-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.test-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.panel-loading,
.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 6px;
  min-height: 160px;
}

.panel-empty {
  color: var(--text-muted);
  font-size: 13px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.panel-result {
  flex: 1;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 12px;
  overflow: auto;
  min-height: 160px;
  color: var(--text-primary);
}
</style>

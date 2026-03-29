<template>
  <div class="api-page p-6 h-full flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">API 管理</h1>
      <div class="flex gap-2">
        <el-button type="info" @click="router.push('/apis/log')">访问日志</el-button>
        <el-button type="primary" @click="router.push('/apis/new')">新增 API</el-button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <el-form :inline="true" :model="searchForm" class="flex flex-wrap gap-4 items-end">
        <el-form-item label="API名称" class="flex-1 min-w-[200px]">
          <el-input v-model="searchForm.name" placeholder="搜索API名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="searchForm.path" placeholder="搜索路径" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Table -->
    <div class="flex-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4 overflow-auto">
      <el-table v-loading="loading" :data="filteredApis" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="API名称" min-width="150" />
        <el-table-column prop="path" label="路径" min-width="180" />
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag :type="getMethodType(row.method)" size="small">{{ row.method || 'POST' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="datasourceName" label="数据源" width="120" />
        <el-table-column prop="tableName" label="表名" width="120" />
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" text type="primary" @click="handleTest(row)">测试</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增API' : '编辑API'" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="API名称" required>
          <el-input v-model="formData.name" placeholder="请输入API名称" />
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
    <el-dialog v-model="testDialogVisible" title="测试API" width="700px">
      <div v-if="testApi" class="mb-4">
        <p class="text-sm text-[var(--text-secondary)] mb-2">
          <strong>{{ testApi.name }}</strong> - {{ testApi.method }} {{ testApi.path }}
        </p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium mb-2">请求参数 (JSON)</h4>
          <el-input v-model="testParams" type="textarea" :rows="8" placeholder='{"key": "value"}' />
        </div>
        <div>
          <h4 class="text-sm font-medium mb-2">响应结果</h4>
          <div v-if="testLoading" class="flex items-center justify-center h-32">
            <el-icon class="is-loading text-xl"><Loading /></el-icon>
          </div>
          <pre v-else-if="testResult" class="bg-[var(--bg-tertiary)] p-3 rounded text-xs overflow-auto h-32">{{ testResult }}</pre>
          <div v-else class="text-[var(--text-muted)] text-sm h-32 flex items-center justify-center">暂无结果</div>
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

import { Loading } from '@element-plus/icons-vue'
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

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const formData = reactive<ApiItem>({ name: '', path: '', method: 'POST', description: '', status: 1 })

const testDialogVisible = ref(false)
const testApi = ref<ApiItem | null>(null)
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

function getMethodType(method: string) {
  switch (method) {
    case 'GET': return 'success'
    case 'POST': return 'primary'
    case 'PUT': return 'warning'
    case 'DELETE': return 'danger'
    default: return 'info'
  }
}

async function loadData() {
  loading.value = true
  try {
    const data = await getApiList()
    apis.value = data.list || []
  } catch (error) {
    console.error('Failed to load APIs:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // filteredApis is computed, no need to reload
}

function handleReset() {
  searchForm.name = ''
  searchForm.path = ''
}

function handleEdit(row: ApiItem) {
  if (row.id) {
    router.push(`/apis/${row.id}`)
  }
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
    await ElMessageBox.confirm('确定要删除该API吗？', '提示', { type: 'warning' })
    await deleteApi(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function handleTest(row: ApiItem) {
  testApi.value = row
  testParams.value = '{}'
  testResult.value = ''
  testDialogVisible.value = true
}

async function executeTest() {
  if (!testApi.value?.id) return
  testLoading.value = true
  testResult.value = ''
  try {
    let params = {}
    try { params = JSON.parse(testParams.value) } catch {}
    const res = await testApi(testApi.value.id, params)
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
.api-page {
  background: var(--bg-primary);
  min-height: 100%;
}
</style>

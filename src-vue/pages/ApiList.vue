<template>
  <div class="api-list p-4 h-full flex gap-4">
    <!-- 左侧数据源树 -->
    <div class="w-64 flex-shrink-0 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] flex flex-col">
      <div class="p-3 border-b border-[var(--border-light)]">
        <h3 class="text-sm font-medium text-[var(--text-primary)]">数据源</h3>
      </div>
      <div class="flex-1 overflow-auto p-2">
        <el-tree
          :data="datasourceTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :default-expand-all="true"
          @node-click="handleNodeClick"
          class="datasource-tree"
        />
      </div>
    </div>

    <!-- 右侧 API 列表 -->
    <div class="flex-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] flex flex-col">
      <div class="p-4 border-b border-[var(--border-light)]">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-[var(--text-primary)]">API 管理</h2>
          <el-button type="primary" @click="handleCreate">新增 API</el-button>
        </div>
        <div class="flex gap-4">
          <el-input v-model="searchName" placeholder="API 名称" clearable @keyup.enter="handleSearch" class="w-48" />
          <el-input v-model="searchPath" placeholder="API 路径" clearable @keyup.enter="handleSearch" class="w-48" />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <el-table v-loading="loading" :data="apiList" stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="API 名称" min-width="150" />
          <el-table-column prop="path" label="路径" width="180" />
          <el-table-column prop="method" label="方法" width="80">
            <template #default="{ row }">
              <el-tag :type="row.method === 'GET' ? 'success' : row.method === 'POST' ? 'primary' : 'warning'" size="small">
                {{ row.method || 'POST' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="datasourceName" label="数据源" width="120" />
          <el-table-column prop="tableName" label="表名" width="120" />
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
    </div>

    <!-- 测试弹窗 -->
    <el-dialog v-model="testDialogVisible" title="测试 API" width="800px">
      <div v-if="testingApi" class="space-y-4">
        <div class="text-sm text-[var(--text-secondary)]">
          <span class="font-medium">{{ testingApi.name }}</span>
          <span class="ml-2 text-[var(--text-muted)]">{{ testingApi.method }} {{ testingApi.path }}</span>
        </div>
        
        <div>
          <h4 class="text-sm font-medium mb-2">输入参数</h4>
          <el-input v-model="testParams" type="textarea" :rows="4" placeholder="JSON 格式，如: {&quot;id&quot;: 1}" />
        </div>

        <div>
          <h4 class="text-sm font-medium mb-2">返回结果</h4>
          <div v-if="testLoading" class="text-center py-8 text-[var(--text-muted)]">加载中...</div>
          <pre v-else-if="testResult" class="bg-[var(--bg-tertiary)] p-4 rounded text-xs overflow-auto max-h-64">{{ testResult }}</pre>
          <div v-else class="text-center py-8 text-[var(--text-muted)]">点击执行查看结果</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testLoading" @click="executeTest">执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApiList, getApiDetail, deleteApi, testApi, getDataSources, getTableList } from '@/lib/api'

interface ApiItem {
  id: number
  name: string
  path: string
  method: string
  datasourceId?: number
  datasourceName?: string
  databaseName?: string
  tableName?: string
  description?: string
  status: number
}

interface TreeNode {
  id: string | number
  name: string
  type: 'datasource' | 'table'
  children?: TreeNode[]
}

const apiList = ref<ApiItem[]>([])
const datasourceTree = ref<TreeNode[]>([])
const loading = ref(false)
const searchName = ref('')
const searchPath = ref('')
const selectedDatasourceId = ref<number>()

// 测试相关
const testDialogVisible = ref(false)
const testingApi = ref<ApiItem | null>(null)
const testParams = ref('')
const testResult = ref('')
const testLoading = ref(false)

async function loadDatasources() {
  try {
    const res = await getDataSources({ page: 1, limit: 100 })
    const tree: TreeNode[] = []
    if (res.list) {
      for (const ds of res.list) {
        tree.push({
          id: `ds_${ds.id}`,
          name: ds.name || ds.dbName || `数据源${ds.id}`,
          type: 'datasource',
          children: []
        })
      }
    }
    datasourceTree.value = tree
  } catch (error) {
    console.error('Failed to load datasources:', error)
  }
}

async function loadApis() {
  loading.value = true
  try {
    const res = await getApiList({
      page: 1,
      limit: 100,
      datasourceId: selectedDatasourceId.value,
      name: searchName.value || undefined,
      path: searchPath.value || undefined
    })
    apiList.value = res.list || []
  } catch (error) {
    console.error('Failed to load API list:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadApis()
}

function handleNodeClick(data: TreeNode) {
  if (data.type === 'datasource') {
    selectedDatasourceId.value = Number(data.id.toString().replace('ds_', ''))
    loadApis()
  }
}

function handleCreate() {
  ElMessage.info('请使用 React 版本创建 API')
}

function handleEdit(row: ApiItem) {
  ElMessage.info('请使用 React 版本编辑 API')
}

async function handleTest(row: ApiItem) {
  testingApi.value = row
  testParams.value = ''
  testResult.value = ''
  testDialogVisible.value = true
}

async function executeTest() {
  if (!testingApi.value) return
  testLoading.value = true
  testResult.value = ''
  try {
    let params = {}
    if (testParams.value) {
      try {
        params = JSON.parse(testParams.value)
      } catch {
        ElMessage.error('参数 JSON 格式错误')
        testLoading.value = false
        return
      }
    }
    const res = await testApi(testingApi.value.id, params)
    testResult.value = JSON.stringify(res, null, 2)
  } catch (error: any) {
    testResult.value = `Error: ${error.message || '测试失败'}`
  } finally {
    testLoading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该 API 吗？', '提示', { type: 'warning' })
    await deleteApi(id)
    ElMessage.success('删除成功')
    loadApis()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadDatasources()
  loadApis()
})
</script>

<style scoped>
.api-list {
  background: var(--bg-primary);
  min-height: calc(100vh - 60px);
}
:deep(.datasource-tree) {
  background: transparent;
}
:deep(.el-tree-node__content) {
  height: 32px;
}
</style>

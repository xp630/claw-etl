<template>
  <div class="datasource-page p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center ">
          <Box class="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">数据源管理</h1>
          <p class="text-xs text-[var(--text-muted)]">管理系统数据源</p>
        </div>
      </div>
      <el-button type="primary" @click="handleCreate">
        <Plus class="w-4 h-4 mr-1" /> 新增
      </el-button>
    </div>

    <!-- 搜索条件 -->
    <div class="mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <el-form :inline="true" :model="searchForm" class="flex flex-wrap gap-4 items-end">
        <el-form-item label="数据源名称" class="flex-1 min-w-[200px]">
          <el-input v-model="searchForm.name" placeholder="搜索名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="数据库类型">
          <el-select v-model="searchForm.dataType" placeholder="全部" clearable class="w-32">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="SQL Server" value="sqlserver" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.dbState" placeholder="全部" clearable class="w-24">
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] overflow-hidden">
      <el-table v-loading="loading" :data="datasources" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="数据源名称" min-width="150" />
        <el-table-column prop="comment" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="dataType" label="数据库类型" width="120">
          <template #default="{ row }">
            {{ getTypeLabel(row.type || row.dataType) }}
          </template>
        </el-table-column>
        <el-table-column prop="jdbcUrl" label="连接地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="dbState" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-if="switchMounted"
              :model-value="row.dbState"
              active-value="启用"
              inactive-value="停用"
              @change="handleStatusChange(row, $event)"
            />
            <span v-else>{{ row.dbState === '启用' ? '启用' : '停用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleTest(row.id)">测试</el-button>
            <el-button size="small" text type="primary" @click="handleEdit(row.id)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const mounted = ref(false)
const switchMounted = ref(false)
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Box } from '@element-plus/icons-vue'
import { getDataSources, deleteDataSource, testDataSource, toggleDataSourceStatus } from '@/lib/api'

const router = useRouter()

interface DataSource {
  id?: number
  name?: string
  comment?: string
  type?: string
  dataType?: string
  jdbcUrl?: string
  dbName?: string
  dbState?: string
}

const datasources = ref<DataSource[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const switching = ref(false)

const searchForm = reactive({
  name: '',
  dataType: '',
  dbState: '',
})

function getTypeLabel(type?: string) {
  if (!type) return '-'
  const map: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
  }
  return map[type.toLowerCase()] || type
}

async function loadData() {
  loading.value = true
  try {
    const data = await getDataSources({
      page: page.value,
      limit: limit.value,
      name: searchForm.name || undefined,
      dataType: searchForm.dataType || undefined,
      dbState: searchForm.dbState || undefined,
    })
    datasources.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('Failed to load datasources:', error)
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
  searchForm.dataType = ''
  searchForm.dbState = ''
  page.value = 1
  loadData()
}

function handleSizeChange() {
  page.value = 1
  loadData()
}

function handlePageChange() {
  loadData()
}

function handleCreate() {
  router.push('/datasources/new')
}

function handleEdit(id: number) {
  router.push(`/datasources/${id}`)
}

async function handleStatusChange(row: DataSource, newValue: string) {
  if (switching.value) return
  switching.value = true
  try {
    await toggleDataSourceStatus(row.id!, newValue)
    ElMessage.success('状态更新成功')
    loadData()
  } catch (error) {
    ElMessage.error('状态更新失败')
    loadData()
  } finally {
    switching.value = false
  }
}

async function handleTest(id: number) {
  try {
    const result = await testDataSource(id)
    ElMessage.success(result.message || '连接成功')
  } catch (error: any) {
    ElMessage.error(error.message || '连接失败')
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该数据源吗？', '提示', { type: 'warning' })
    await deleteDataSource(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  mounted.value = true
  loadData()
  setTimeout(() => { switchMounted.value = true }, 0)
})
</script>

<style scoped>
.datasource-page {
  background: var(--bg-primary);
  min-height: 100%;
}
</style>

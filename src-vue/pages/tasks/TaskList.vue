<template>
  <div class="task-list-page">
    <!-- Page Header -->
    <header class="page-header">
      <div class="header-left">
        <RefreshCw class="header-icon" />
        <div class="header-text">
          <h1>任务管理</h1>
          <p>配置 ETL 同步任务</p>
        </div>
      </div>
      <el-button type="primary" @click="handleCreate">
        <Plus class="btn-icon" />新建任务
      </el-button>
    </header>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-fields">
        <el-input
          v-model="searchTable"
          placeholder="目标表名称"
          clearable
          class="search-input"
        />
        <el-input
          v-model="searchName"
          placeholder="任务名称"
          clearable
          class="search-input"
        />
      </div>
      <div class="search-actions">
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <el-table
        :data="filteredTasks"
        v-loading="loading"
        row-key="id"
        :header-cell-style="{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }"
        :row-style="{ cursor: 'pointer' }"
        @row-click="(row) => handleEdit(row)"
      >
        <el-table-column prop="taskName" label="任务名称" min-width="180">
          <template #default="{ row }">
            <span class="task-name">{{ row.taskName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="targetTable" label="目标表" min-width="140" />
        <el-table-column label="同步频率" width="140">
          <template #default="{ row }">
            <span class="cron-text">
              {{ row.taskCronTime }} {{ row.taskCronType === 'MINUTES' ? '分钟' : row.taskCronType === 'HOURS' ? '小时' : '天' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status === 1 ? 'status-active' : 'status-disabled'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="right" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons" @click.stop>
              <el-button link size="small" type="primary" @click="handleToggle(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button link size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            </div>
          </template>
        </el-table-column>

        <!-- Empty slot -->
        <template #empty>
          <div class="table-empty">
            <RefreshCw class="empty-icon" />
            <p>暂无任务数据</p>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, RefreshCw } from 'lucide-vue-next'
import axios from 'axios'

interface Task {
  id?: number
  taskName: string
  targetTable: string
  taskCronTime?: number
  taskCronType?: string
  status?: number
}

const API_BASE = '/etl-admin'
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

async function getTasks(): Promise<Task[]> {
  const res = await api.post('/simple/queryTaskListPage', { page: 1, limit: 20 })
  if (res.data?.code === 0 || res.data?.code === '0' || res.data?.code === 1 || res.data?.success) {
    return res.data?.list || []
  }
  return []
}

async function toggleTask(id: number): Promise<void> {
  await api.post('/simple/updateStatus', { id })
}

const router = useRouter()
const tasks = ref<Task[]>([])
const loading = ref(false)
const searchTable = ref('')
const searchName = ref('')

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchTable = !searchTable.value || (task.targetTable && task.targetTable.toLowerCase().includes(searchTable.value.toLowerCase()))
    const matchName = !searchName.value || (task.taskName && task.taskName.toLowerCase().includes(searchName.value.toLowerCase()))
    return matchTable && matchName
  })
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const data = await getTasks()
    tasks.value = data
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    loading.value = false
  }
}

async function handleToggle(row: Task) {
  if (!row.id) return
  try {
    await toggleTask(row.id)
    ElMessage.success('操作成功')
    loadData()
  } catch (error) {
    console.error('Failed to toggle task:', error)
  }
}

function handleCreate() {
  router.push('/tasks/new')
}

function handleEdit(row: Task) {
  router.push(`/tasks/${row.id}`)
}

function resetSearch() {
  searchTable.value = ''
  searchName.value = ''
  loadData()
}
</script>

<style scoped>
.task-list-page {
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

.btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

/* Search Bar */
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

.task-name {
  font-weight: 500;
  color: var(--text-primary);
}

.cron-text {
  font-size: 13px;
  color: var(--text-secondary);
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
</style>

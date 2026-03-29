<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
          <RefreshCw class="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">任务管理</h1>
          <p class="text-xs text-[var(--text-muted)]">配置ETL同步任务</p>
        </div>
      </div>
      <el-button type="primary" @click="handleCreate">
        <Plus class="w-4 h-4 mr-1" /> 新增
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <div class="mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <div class="flex gap-4 flex-wrap">
        <el-input
          v-model="searchTable"
          placeholder="支持表名称查询"
          clearable
          class="w-64"
        />
        <el-input
          v-model="searchName"
          placeholder="支持任务名称模糊查询"
          clearable
          class="w-64"
        />
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] overflow-hidden">
      <el-table :data="filteredTasks" v-loading="loading" style="width: 100%">
        <el-table-column prop="taskName" label="任务名称" min-width="150" />
        <el-table-column prop="targetTable" label="目标表" min-width="120" />
        <el-table-column label="同步频率" width="150">
          <template #default="{ row }">
            {{ row.taskCronTime }} {{ row.taskCronType === 'MINUTES' ? '分钟' : row.taskCronType === 'HOURS' ? '小时' : '天' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleToggle(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
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

<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="flex items-center gap-3 mb-6">
      <el-button text @click="goBack">
        <ArrowLeft class="w-5 h-5" />
      </el-button>
      <div>
        <h1 class="text-xl font-bold text-[var(--text-primary)] dark:text-white">{{ isEdit ? '编辑任务' : '新增任务' }}</h1>
        <p class="text-xs text-[var(--text-muted)] dark:text-gray-400">配置数据同步任务</p>
      </div>
    </div>

    <!-- 表单 -->
    <el-form :model="formData" label-width="120px" class="space-y-6">
      <!-- 源数据 -->
      <div class="bg-[var(--bg-secondary)] dark:bg-gray-800 rounded-xl border border-[var(--border-light)] dark:border-gray-700 p-6">
        <div class="flex items-center gap-2 mb-4">
          <Database class="w-5 h-5 text-blue-500" />
          <h2 class="text-lg font-medium text-[var(--text-primary)] dark:text-white">源数据</h2>
        </div>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="源数据库" required>
              <el-select v-model="formData.source_id" placeholder="请选择" class="w-full">
                <el-option v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务名称" required>
              <el-input v-model="formData.name" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="查询语句" required>
              <el-input v-model="formData.query_sql" type="textarea" :rows="4" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 目标数据 -->
      <div class="bg-[var(--bg-secondary)] dark:bg-gray-800 rounded-xl border border-[var(--border-light)] dark:border-gray-700 p-6">
        <div class="flex items-center gap-2 mb-4">
          <Table class="w-5 h-5 text-green-500" />
          <h2 class="text-lg font-medium text-[var(--text-primary)] dark:text-white">目标数据</h2>
        </div>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标数据库" required>
              <el-select v-model="formData.target_id" placeholder="请选择" class="w-full">
                <el-option v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标表名" required>
              <el-input v-model="formData.target_table" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="列名" required>
              <template #label>
                <span>列名</span>
                <span class="text-[var(--text-muted)] font-normal ml-2">用英文逗号隔开</span>
              </template>
              <div class="flex gap-2">
                <el-input v-model="formData.columns" placeholder="id,name,price,create_time" />
                <el-button @click="handleAutoGetColumns" :loading="autoLoading" :disabled="!formData.query_sql || !formData.source_id">
                  <Download class="w-4 h-4 mr-1" />自动获取
                </el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="动态参数SQL">
              <template #label>
                <span>动态参数SQL</span>
              </template>
              <el-input v-model="formData.dynamic_sql" placeholder="请参考: select ifnull({timeColumn},'default') as dynamicParam from {table}" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 执行周期 -->
      <div class="bg-[var(--bg-secondary)] dark:bg-gray-800 rounded-xl border border-[var(--border-light)] dark:border-gray-700 p-6">
        <div class="flex items-center gap-2 mb-4">
          <Zap class="w-5 h-5 text-purple-500" />
          <h2 class="text-lg font-medium text-[var(--text-primary)] dark:text-white">执行周期</h2>
        </div>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="执行窗口时长" required>
              <div class="flex items-center gap-2">
                <el-input-number v-model="formData.window_value" :min="1" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行窗口单位" required>
              <el-select v-model="formData.window_unit" class="w-full">
                <el-option value="minutes" label="分钟" />
                <el-option value="hours" label="小时" />
                <el-option value="days" label="天" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-end gap-3">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          <Save class="w-4 h-4 mr-1" />保存
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Save, Zap, Database, Download, Table } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface Task {
  id?: number
  name: string
  source_id?: number
  source_name?: string
  target_id?: number
  target_name?: string
  query_sql?: string
  target_table?: string
  columns?: string
  dynamic_sql?: string
  window_value?: number
  window_unit?: string
  status?: number
}

interface DataSource {
  id: number
  name: string
  dataType?: string
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

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)

const loading = ref(false)
const saving = ref(false)
const autoLoading = ref(false)
const datasources = ref<DataSource[]>([])

const formData = reactive<Partial<Task>>({
  name: '',
  source_id: undefined,
  query_sql: '',
  target_id: undefined,
  target_table: '',
  columns: '',
  dynamic_sql: '',
  window_value: 1,
  window_unit: 'hours',
})

async function getDataSourcesList(): Promise<DataSource[]> {
  const res = await api.post('/dataSourceManager/dataSourceList', { page: 1, limit: 100 })
  if (res.data?.list) {
    return res.data.list.map((item: any) => ({
      id: item.id,
      name: item.dbName,
      dataType: item.dataType,
    }))
  }
  return []
}

async function getTask(id: number): Promise<Task | null> {
  const res = await api.post('/simple/getTask', { id })
  if (res.data?.code === 0 || res.data?.code === 1) {
    return res.data.data
  }
  return null
}

async function createTask(data: Partial<Task>): Promise<number> {
  const res = await api.post('/simple/saveTask', data)
  return res.data?.code === 0 || res.data?.code === 1 ? 1 : 0
}

async function updateTask(id: number, data: Partial<Task>): Promise<number> {
  const res = await api.post('/simple/saveTask', { ...data, id })
  return res.data?.code === 0 || res.data?.code === 1 ? 1 : 0
}

async function generateTargetColumns(sql: string, dbName: string): Promise<string[]> {
  const res = await api.post('/simple/generateColumns', { sql, dbName })
  if (res.data?.code === 0 || res.data?.code === 1) {
    return res.data.data || []
  }
  return []
}

function goBack() {
  router.push('/tasks')
}

async function loadDatasources() {
  try {
    datasources.value = await getDataSourcesList()
  } catch (error) {
    console.error('Failed to load datasources:', error)
  }
}

async function loadTask(taskId: number) {
  loading.value = true
  try {
    const data = await getTask(taskId)
    if (data) {
      Object.assign(formData, data)
    }
  } catch (error) {
    console.error('Failed to load task:', error)
  } finally {
    loading.value = false
  }
}

async function handleAutoGetColumns() {
  if (!formData.query_sql) {
    ElMessage.warning('请先填写查询语句')
    return
  }
  if (!formData.source_id) {
    ElMessage.warning('请先选择源数据库')
    return
  }

  const sourceDs = datasources.value.find(ds => ds.id === formData.source_id)
  if (!sourceDs) {
    ElMessage.error('源数据库不存在')
    return
  }

  autoLoading.value = true
  try {
    const columns = await generateTargetColumns(formData.query_sql, sourceDs.name)
    if (columns.length > 0) {
      formData.columns = columns.join(',')
      ElMessage.success('自动获取列名成功')
    } else {
      ElMessage.warning('未能获取到列信息')
    }
  } catch (error) {
    console.error('Auto get columns error:', error)
    ElMessage.error('获取列信息失败')
  } finally {
    autoLoading.value = false
  }
}

async function handleSubmit() {
  if (!formData.name || !formData.source_id || !formData.query_sql || 
      !formData.target_id || !formData.target_table || !formData.columns) {
    ElMessage.warning('请填写必填项')
    return
  }

  // 根据 ID 查找数据库名称
  const sourceDs = datasources.value.find(ds => ds.id === formData.source_id)
  const targetDs = datasources.value.find(ds => ds.id === formData.target_id)

  const submitData = {
    ...formData,
    source_name: sourceDs?.name,
    target_name: targetDs?.name,
  }

  saving.value = true
  try {
    let result
    if (isEdit.value && route.params.id) {
      result = await updateTask(Number(route.params.id), submitData)
    } else {
      result = await createTask(submitData)
    }
    
    if (result === 1) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/tasks')
    }
  } catch (error) {
    console.error('Failed to save task:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadDatasources()
  if (isEdit.value && route.params.id) {
    await loadTask(Number(route.params.id))
  }
})
</script>

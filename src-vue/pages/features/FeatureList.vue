<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Layout class="w-6 h-6 text-blue-500" />
        <h1 class="text-2xl font-bold text-[var(--text-primary)] dark:text-white">功能管理</h1>
      </div>
      <el-button type="primary" @click="showNewModal = true">
        <Plus class="w-4 h-4 mr-1" /> 新增
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-6">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索功能名称或编码..."
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
        class="w-80"
      >
        <template #prefix>
          <Search class="w-4 h-4 text-[var(--text-muted)]" />
        </template>
      </el-input>
    </div>

    <!-- 列表 -->
    <div class="bg-[var(--bg-secondary)] dark:bg-gray-800 rounded-xl border border-[var(--border-light)] dark:border-gray-700 overflow-hidden">
      <el-table :data="features" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="功能名称" min-width="150" />
        <el-table-column prop="code" label="功能编码" min-width="120" />
        <el-table-column prop="path" label="访问路径" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type === 'page' ? '页面' : row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end p-4 border-t border-[var(--border-light)] dark:border-gray-700">
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="showNewModal"
      :title="isEdit ? '编辑功能' : '新增功能'"
      width="600px"
      @closed="resetForm"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="功能名称" required>
          <el-input v-model="formData.name" placeholder="请输入功能名称" />
        </el-form-item>
        <el-form-item label="功能编码" required>
          <el-input v-model="formData.code" placeholder="请输入功能编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="访问路径">
          <el-input v-model="formData.path" placeholder="请输入访问路径" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.type" class="w-full">
            <el-option value="page" label="页面" />
            <el-option value="button" label="按钮" />
            <el-option value="menu" label="菜单" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewModal = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400px">
      <p class="text-gray-600">确定要删除该功能吗？此操作不可撤销。</p>
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
import axios from 'axios'

interface Feature {
  id?: number
  name: string
  code: string
  path?: string
  type?: string
  description?: string
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

async function getFeatures(params: { page: number; limit: number; keyword?: string }): Promise<{ list: Feature[]; total: number }> {
  const res = await api.post('/feature/list', {
    page: params.page,
    limit: params.limit,
    keyword: params.keyword || '',
  })
  if (res.data?.code === 0 || res.data?.code === 1) {
    return {
      list: res.data?.data?.list || [],
      total: res.data?.data?.total || 0,
    }
  }
  return { list: [], total: 0 }
}

async function getFeature(id: number): Promise<Feature | null> {
  const res = await api.post('/feature/detail', { id })
  if (res.data?.code === 0 || res.data?.code === 1) {
    return res.data?.data
  }
  return null
}

async function saveFeature(data: Partial<Feature>): Promise<boolean> {
  const res = await api.post('/feature/save', data)
  return res.data?.code === 0 || res.data?.code === 1
}

async function deleteFeature(id: number): Promise<void> {
  await api.post('/feature/delete', { id })
}

const features = ref<Feature[]>([])
const loading = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const showNewModal = ref(false)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)
const isEdit = ref(false)

const formData = reactive<Partial<Feature>>({
  name: '',
  code: '',
  path: '',
  type: 'page',
  description: '',
})

onMounted(() => {
  loadFeatures()
})

async function loadFeatures() {
  loading.value = true
  try {
    const data = await getFeatures({ page: page.value, limit: limit.value, keyword: searchKeyword.value })
    features.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('Failed to load features:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadFeatures()
}

function handleEdit(row: Feature) {
  isEdit.value = true
  Object.assign(formData, row)
  showNewModal.value = true
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
    await saveFeature(formData)
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    showNewModal.value = false
    loadFeatures()
  } catch (error) {
    console.error('Failed to save feature:', error)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    name: '',
    code: '',
    path: '',
    type: 'page',
    description: '',
  })
  isEdit.value = false
}
</script>

<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Layout class="w-6 h-6 text-blue-500" />
        <h1 class="text-2xl font-bold text-[var(--text-primary)] dark:text-white">功能管理</h1>
      </div>
      <el-button type="primary" @click="handleAdd">
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
    <FeatureFormDialog
      v-model="showFormDialog"
      :feature-id="editingId"
      @success="loadFeatures"
    />

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
import { ref, onMounted } from 'vue'
import { Plus, Search, Layout } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import FeatureFormDialog from './FeatureFormDialog.vue'
import { getFeatures, deleteFeature, type Feature } from '@/lib/api'

const features = ref<Feature[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)

// 弹窗状态
const showFormDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingId = ref<number | null>(null)
const deleteId = ref<number | null>(null)

onMounted(() => {
  loadFeatures()
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

function handleSearch() {
  page.value = 1
  loadFeatures()
}

function handleAdd() {
  editingId.value = null
  showFormDialog.value = true
}

function handleEdit(row: Feature) {
  editingId.value = row.id || null
  showFormDialog.value = true
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
</script>

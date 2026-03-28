<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">页面配置</h1>
      <el-button type="primary" @click="handleCreate">新增页面</el-button>
    </div>

    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <el-table v-loading="loading" :data="pages" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="页面名称" min-width="150" />
        <el-table-column prop="code" label="页面编码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" text type="primary" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPageConfigList } from '@/lib/api'

interface PageItem {
  id: number
  name: string
  code: string
  description?: string
  status: number
  createdAt?: string
  updatedAt?: string
}

const router = useRouter()
const pages = ref<PageItem[]>([])
const loading = ref(false)

async function loadPages() {
  loading.value = true
  try {
    const data = await getPageConfigList({ page: 1, limit: 100 })
    pages.value = data.list || []
  } catch (error) {
    console.error('Failed to load pages:', error)
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  router.push('/editor')
}

function handleEdit(row: PageItem) {
  router.push(`/editor?id=${row.id}`)
}

function handlePreview(row: PageItem) {
  window.open(`#/render/${row.code}`, '_blank')
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该页面吗？', '提示', { type: 'warning' })
    // await deletePageConfig(id)
    ElMessage.success('删除成功')
    loadPages()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadPages()
})
</script>

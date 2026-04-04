<template>
  <div class="page-list-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <FileText class="header-icon" />
        <div class="header-text">
          <h1>页面配置</h1>
          <p>管理所有页面</p>
        </div>
      </div>
      <el-button type="primary" @click="handleCreate">
        <Plus class="btn-icon" />新建页面
      </el-button>
    </header>

    <!-- Table -->
    <div class="table-container">
      <el-table
        :data="pages"
        v-loading="loading"
        row-key="id"
        :header-cell-style="{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }"
      >
        <el-table-column prop="id" label="ID" width="80" align="right" />
        <el-table-column prop="name" label="页面名称" min-width="180">
          <template #default="{ row }">
            <span class="page-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="页面编码" min-width="150">
          <template #default="{ row }">
            <code class="page-code">{{ row.code }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status === 1 ? 'status-active' : 'status-disabled'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ row.updatedAt || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="right" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link size="small" type="primary" @click="handlePreview(row)">预览</el-button>
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
            <FileText class="empty-icon" />
            <p>暂无页面数据</p>
            <el-button type="primary" size="small" @click="handleCreate">创建第一个页面</el-button>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, FileText } from 'lucide-vue-next'
import { getPageConfigList, deletePageConfig } from '@/lib/api'

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
    await deletePageConfig(id)
    ElMessage.success('删除成功')
    loadPages()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadPages()
})
</script>

<style scoped>
.page-list-page {
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

.page-name {
  font-weight: 500;
  color: var(--text-primary);
}

.page-code {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  color: var(--text-secondary);
}

.description-text {
  color: var(--text-secondary);
  font-size: 13px;
}

.time-text {
  font-size: 13px;
  color: var(--text-muted);
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

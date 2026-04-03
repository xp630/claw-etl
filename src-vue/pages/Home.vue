<template>
  <div class="home-page">
    <!-- Header -->
    <header class="home-header">
      <div class="header-content">
        <div class="header-brand">
          <svg class="brand-icon" width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="currentColor"/>
            <path d="M14 34V14l10 10 10-10v20" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="brand-name">claw-etl</span>
        </div>
        <div class="header-time">{{ currentTime }}</div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="home-main">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <h1 class="welcome-title">控制台</h1>
        <p class="welcome-subtitle">低代码数据编排平台</p>
      </section>

      <!-- Quick Access -->
      <section class="quick-section">
        <h2 class="section-title">快捷操作</h2>
        <div class="quick-grid">
          <div class="quick-item" @click="$router.push('/editor')">
            <div class="quick-icon" style="--icon-color: var(--accent)">
              <Layout />
            </div>
            <div class="quick-info">
              <span class="quick-name">页面编辑器</span>
              <span class="quick-desc">可视化构建页面</span>
            </div>
            <ChevronRight class="quick-arrow" />
          </div>

          <div class="quick-item" @click="$router.push('/menus')">
            <div class="quick-icon" style="--icon-color: var(--success)">
              <MenuIcon />
            </div>
            <div class="quick-info">
              <span class="quick-name">菜单管理</span>
              <span class="quick-desc">配置系统菜单</span>
            </div>
            <ChevronRight class="quick-arrow" />
          </div>

          <div class="quick-item" @click="$router.push('/datasource')">
            <div class="quick-icon" style="--icon-color: var(--warning)">
              <Database />
            </div>
            <div class="quick-info">
              <span class="quick-name">数据源</span>
              <span class="quick-desc">管理数据连接</span>
            </div>
            <ChevronRight class="quick-arrow" />
          </div>

          <div class="quick-item" @click="$router.push('/users')">
            <div class="quick-icon" style="--icon-color: var(--info)">
              <UserIcon />
            </div>
            <div class="quick-info">
              <span class="quick-name">用户管理</span>
              <span class="quick-desc">管理系统用户</span>
            </div>
            <ChevronRight class="quick-arrow" />
          </div>
        </div>
      </section>

      <!-- Dashboard Section -->
      <section class="dashboard-section">
        <div class="section-header">
          <h2 class="section-title">我的仪表盘</h2>
          <el-button type="primary" plain size="small" @click="handleCreate">
            <Plus class="btn-icon" />新建
          </el-button>
        </div>

        <div v-if="dashboards.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">
            <LayoutDashboard />
          </div>
          <p class="empty-text">暂无仪表盘</p>
          <el-button type="primary" @click="handleCreate">创建第一个仪表盘</el-button>
        </div>

        <div v-else class="dashboard-grid">
          <div v-for="db in dashboards" :key="db.id" class="dashboard-card" @click="handleView(db.id)">
            <div class="card-preview">
              <LayoutDashboard class="preview-icon" />
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ db.name }}</h3>
              <span class="card-date">{{ formatDate(db.createdAt) }}</span>
            </div>
            <div class="card-actions">
              <el-button size="small" text @click.stop="handleEdit(db.id)">
                <Pencil />
              </el-button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(db.id)">
                <template #reference>
                  <el-button size="small" text type="danger" @click.stop>
                    <Trash2 />
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Layout, Menu as MenuIcon, Database, User as UserIcon, ChevronRight, Plus, LayoutDashboard, Pencil, Trash2 } from 'lucide-vue-next'

interface Dashboard {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

const dashboards = ref<Dashboard[]>([
  { id: '1', name: '销售数据概览', createdAt: '2026-03-28' },
  { id: '2', name: '用户行为分析', createdAt: '2026-03-27' },
])
const loading = ref(false)
const router = useRouter()
const currentTime = ref('')

let timeInterval: number

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

function formatDate(date?: string) {
  if (!date) return ''
  return date
}

function handleCreate() {
  ElMessage.info('新建仪表盘功能开发中...')
}

function handleView(id: string) {
  router.push(`/report/dashboards/${id}`)
}

function handleEdit(id: string) {
  router.push(`/report/dashboards/${id}`)
}

function handleDelete(id: string) {
  ElMessage.success('删除功能开发中...')
}

onMounted(() => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000)
})

onUnmounted(() => {
  clearInterval(timeInterval)
})
</script>

<style scoped>
.home-page {
  background: var(--bg-primary);
  min-height: 100vh;
}

/* Header */
.home-header {
  border-bottom: 1px solid var(--border-light);
  padding: 16px 24px;
  background: var(--bg-secondary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  color: var(--accent);
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.header-time {
  font-size: 13px;
  color: var(--text-muted);
}

/* Main */
.home-main {
  padding: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Welcome */
.welcome-section {
  margin-bottom: 40px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* Section */
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 16px;
}

/* Quick Access */
.quick-section {
  margin-bottom: 40px;
}

.quick-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--border-light);
  border-radius: 12px;
  overflow: hidden;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
}

.quick-item:hover {
  background: var(--bg-hover);
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--icon-color) 15%, transparent);
  color: var(--icon-color);
}

.quick-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.quick-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.quick-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.quick-item:hover .quick-arrow {
  opacity: 1;
}

/* Dashboard */
.dashboard-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.btn-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px dashed var(--border);
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 16px;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.dashboard-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-preview {
  height: 120px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-light);
}

.preview-icon {
  width: 32px;
  height: 32px;
  color: var(--text-muted);
  opacity: 0.5;
}

.card-body {
  padding: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.card-date {
  font-size: 12px;
  color: var(--text-muted);
}

.card-actions {
  padding: 0 12px 12px;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>

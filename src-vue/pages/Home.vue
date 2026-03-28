<template>
  <div class="home-page p-6">
    <el-row :gutter="20" class="mb-6">
      <el-col :span="24">
        <div class="welcome-card">
          <h1>欢迎使用 Claw ETL</h1>
          <p>低代码数据 ETL 平台</p>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="24">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">快捷入口</h2>
      </el-col>
      <el-col :span="6">
        <div class="quick-link-card" @click="$router.push('/editor')">
          <el-icon class="text-3xl text-blue-500 mb-2"><Edit /></el-icon>
          <div class="text-base font-medium">页面编辑器</div>
          <div class="text-sm text-gray-500">可视化编辑页面</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-link-card" @click="$router.push('/menus')">
          <el-icon class="text-3xl text-green-500 mb-2"><Menu /></el-icon>
          <div class="text-base font-medium">菜单管理</div>
          <div class="text-sm text-gray-500">配置系统菜单</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-link-card" @click="$router.push('/datasource')">
          <el-icon class="text-3xl text-orange-500 mb-2"><Connection /></el-icon>
          <div class="text-base font-medium">数据源管理</div>
          <div class="text-sm text-gray-500">管理数据连接</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="quick-link-card" @click="$router.push('/users')">
          <el-icon class="text-3xl text-purple-500 mb-2"><User /></el-icon>
          <div class="text-base font-medium">用户管理</div>
          <div class="text-sm text-gray-500">管理系统用户</div>
        </div>
      </el-col>
    </el-row>

    <!-- 仪表盘列表 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-700">我的仪表盘</h2>
          <el-button type="primary" @click="handleCreate">
            <el-icon class="mr-1"><Plus /></el-icon>
            新建仪表盘
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-loading="loading">
      <el-col v-if="dashboards.length === 0 && !loading" :span="24">
        <el-empty description="暂无仪表盘，点击新建开始创建" />
      </el-col>
      <el-col v-for="db in dashboards" :key="db.id" :span="6">
        <el-card class="dashboard-card" shadow="hover" @click="handleView(db.id)">
          <div class="dashboard-preview">
            <el-icon class="text-4xl text-gray-300"><DataLine /></el-icon>
          </div>
          <div class="dashboard-info">
            <div class="dashboard-name">{{ db.name }}</div>
            <div class="dashboard-meta">
              <span class="text-xs text-gray-400">{{ formatDate(db.createdAt) }}</span>
            </div>
          </div>
          <div class="dashboard-actions">
            <el-button size="small" text type="primary" @click.stop="handleEdit(db.id)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(db.id)">
              <template #reference>
                <el-button size="small" text type="danger" @click.stop>
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit, Menu, Connection, User, Plus, Delete, DataLine } from '@element-plus/icons-vue'

interface Dashboard {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

// 模拟数据（等后端接口）
const dashboards = ref<Dashboard[]>([
  { id: '1', name: '销售数据概览', createdAt: '2026-03-28' },
  { id: '2', name: '用户行为分析', createdAt: '2026-03-27' },
])
const loading = ref(false)
const router = useRouter()

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
  // TODO: 调用后端接口获取仪表盘列表
})
</script>

<style scoped>
.home-page {
  background: #f5f7fa;
  min-height: 100%;
}

.welcome-card {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border-radius: 12px;
  padding: 32px;
  color: white;
  text-align: center;
}

.welcome-card h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-card p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.quick-link-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.quick-link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dashboard-card {
  margin-bottom: 16px;
  cursor: pointer;
}

.dashboard-preview {
  height: 120px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.dashboard-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.dashboard-meta {
  font-size: 12px;
  color: #909399;
}

.dashboard-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

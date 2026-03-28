<template>
  <div class="layout-container">
    <!-- Top Navigation -->
    <nav class="top-nav">
      <div class="nav-left">
        <div class="logo">
          <div class="logo-icon">
            <el-icon><Edit /></el-icon>
          </div>
          <span class="logo-text">Claw ETL</span>
        </div>
      </div>
      <div class="nav-right">
        <el-button circle text>
          <el-icon><Bell /></el-icon>
        </el-button>
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ userInfo.name?.charAt(0) || 'U' }}</span>
          </div>
          <span class="user-name">{{ userInfo.name || '用户' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <el-button type="danger" size="small" @click="handleLogout">退出</el-button>
      </div>
    </nav>

    <div class="layout-body">
      <!-- Sidebar -->
      <aside class="sidebar">
        <el-menu :default-active="activeMenu" router class="sidebar-menu">
          <el-menu-item index="/home">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/editor">
            <el-icon><Edit /></el-icon>
            <span>页面编辑器</span>
          </el-menu-item>
          <el-menu-item index="/datasource">
            <el-icon><Connection /></el-icon>
            <span>数据源管理</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>

        <div class="env-info">
          <p class="env-label">当前环境</p>
          <div class="env-status">
            <span class="env-dot"></span>
            <span class="env-name">开发环境</span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const userInfo = computed(() => authStore.userInfo)

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* Top Navigation */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #e6f0ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar span {
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

/* Layout Body */
.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
}

.env-info {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
}

.env-label {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px 0;
}

.env-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.env-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
}

.env-name {
  font-size: 13px;
  color: #303133;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>

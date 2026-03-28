<template>
  <div class="header">
    <div class="header-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
      <!-- 主题切换 -->
      <el-button text @click="toggleTheme" class="theme-toggle" :title="theme === 'dark' ? '切换亮色主题' : '切换暗色主题'">
        {{ theme === 'dark' ? '🌙' : '☀️' }}
      </el-button>

      <el-dropdown @command="handleCommand">
        <span class="user-dropdown">
          <el-avatar :size="32" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          <span class="username">{{ username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="settings">设置</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { theme, toggleTheme } = useThemeStore()

const currentRoute = computed(() => {
  const name = route.name?.toString() || ''
  const routeMap: Record<string, string> = {
    Editor: '页面编辑器',
    PageViewer: '页面预览',
    Dashboard: '仪表盘',
    DataSource: '数据源',
    Task: '任务管理',
    Api: 'API管理',
  }
  return routeMap[name] || name
})

const username = computed(() => authStore.userInfo?.username || authStore.userInfo?.name || '用户')

function handleCommand(command: string) {
  switch (command) {
    case 'logout':
      authStore.logout()
      router.push('/login')
      break
    case 'profile':
      // TODO: 个人中心
      break
    case 'settings':
      // TODO: 设置
      break
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  font-size: 18px;
  padding: 4px 8px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: var(--bg-hover);
}

.username {
  font-size: 14px;
  color: var(--text-primary);
}
</style>

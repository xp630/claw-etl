<template>
  <div class="header">
    <div class="header-left">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item v-for="tab in tabs" :key="tab.path" 
          :class="{ 'is-active': activeTabPath === tab.path }"
          @click="handleTabClick(tab)"
        >
          <span class="tab-content">
            <span class="tab-title">{{ tab.title }}</span>
            <span v-if="tab.closable" class="tab-close" @click.stop="handleClose(tab)">×</span>
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header-right">
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
            <el-dropdown-item command="theme">🎨 主题</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 主题选择弹窗 -->
      <el-dialog v-model="themeDialogVisible" title="选择主题" width="400px" append-to-body>
        <div class="theme-grid grid grid-cols-2 gap-4">
          <div
            v-for="t in themes"
            :key="t.key"
            class="theme-card cursor-pointer rounded-xl border-2 p-4 transition-all"
            :class="theme === t.key ? 'border-[var(--accent)]' : 'border-[var(--border-light)] hover:border-[var(--accent)]'"
            @click="setTheme(t.key as Theme); themeDialogVisible = false"
          >
            <div class="w-full h-16 rounded-lg mb-3" :style="{ background: t.color }"></div>
            <div class="text-center text-sm text-[var(--text-primary)]">{{ t.label }}</div>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore, type Theme } from '@/stores/theme'
import { tabStore, type TabItem } from '@/stores/tabStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { theme, setTheme } = useThemeStore()

const themeLabel = computed(() => {
  const map: Record<string, string> = {
    dark: '🌙', light: '☀️', red: '❤️', fresh: '🌿'
  }
  return map[theme.value] || theme.value
})

const tabs = computed(() => tabStore.tabs)
const activeTabPath = computed(() => tabStore.activePath)

function handleTabClick(tab: TabItem) {
  tabStore.switchTab(tab.path)
  router.push(tab.path)
}

function handleClose(tab: TabItem) {
  tabStore.removeTab(tab.path)
  if (tabStore.activePath && tabStore.activePath !== tab.path) {
    router.push(tabStore.activePath)
  } else if (tabStore.tabs.length > 0) {
    router.push(tabStore.tabs[tabStore.tabs.length - 1].path)
  }
}

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
    case 'theme':
      themeDialogVisible.value = true
      break
  }
}

const themeDialogVisible = ref(false)
const themes = [
  { key: 'dark', label: '🌙 暗色', color: '#1f2937' },
  { key: 'light', label: '☀️ 亮色', color: '#f9fafb' },
  { key: 'red', label: '❤️ 中国红', color: '#7f1d1d' },
  { key: 'fresh', label: '🌿 小清新', color: '#dcfce7' },
]
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
  flex: 1;
  overflow: hidden;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  padding: 4px 0;
}

.breadcrumb::-webkit-scrollbar {
  display: none;
}

.breadcrumb :deep(.el-breadcrumb__item) {
  padding: 6px 8px 6px 12px;
  background: var(--bg-tab-item);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
  border: 1px solid transparent;
  max-width: 140px;
}

.breadcrumb :deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.breadcrumb :deep(.el-breadcrumb__item .el-breadcrumb__inner.is-clickable) {
  max-width: 140px;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

.breadcrumb :deep(.el-breadcrumb__item:hover) {
  background: var(--bg-tab-item-hover);
  color: var(--text-primary);
}

.breadcrumb :deep(.el-breadcrumb__item.is-active) {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.breadcrumb :deep(.el-breadcrumb__item.is-active:hover) {
  background: var(--accent-hover);
  color: white;
  opacity: 1;
}

.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 12px;
  flex-shrink: 0;
  margin-left: 4px;
  transition: all 0.2s;
}

.tab-close:hover {
  background: rgba(0, 0, 0, 0.15);
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

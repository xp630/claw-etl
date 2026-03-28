<template>
  <div class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-header">
      <div class="logo">
        <el-icon class="logo-icon"><Edit /></el-icon>
        <span v-if="!collapsed" class="logo-text">claw-etl</span>
      </div>
      <button class="collapse-btn" @click="$emit('toggle')">
        <el-icon>
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </button>
    </div>

    <!-- Menu -->
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      class="sidebar-menu"
      @select="handleSelect"
    >
      <template v-if="loading">
        <el-menu-item disabled>
          <el-icon><Loading /></el-icon>
          <template #title>加载中...</template>
        </el-menu-item>
      </template>
      <template v-else>
        <template v-for="menu in menuTree" :key="menu.id">
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="getMenuPath(menu)">
            <template #title>
              <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
              <span>{{ menu.name }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.id"
              :index="getMenuPath(child)"
            >
              <el-icon><component :is="getIconComponent(child.icon)" /></el-icon>
              <span>{{ child.name }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="getMenuPath(menu)">
            <el-icon><component :is="getIconComponent(menu.icon)" /></el-icon>
            <template #title>{{ menu.name }}</template>
          </el-menu-item>
        </template>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Edit, DataLine, Connection, List, Fold, Expand, SetUp, Menu, Loading } from '@element-plus/icons-vue'
import { getMenuTree } from '@/lib/api'

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()

const menuTree = ref<any[]>([])
const loading = ref(true)
const activeMenu = computed(() => route.path)

// 图标映射
const iconMap: Record<string, any> = {
  'edit': Edit,
  'dataline': DataLine,
  'connection': Connection,
  'list': List,
  'setup': SetUp,
  'menu': Menu,
  'home': Edit,
  'users': Edit,
  'database': Connection,
}

function getIconComponent(iconName?: string) {
  if (!iconName) return Menu
  return iconMap[iconName.toLowerCase()] || Menu
}

function getMenuPath(menu: any): string {
  if (!menu.path) return '/home'
  // 动态菜单需要拼接 /render/ 前缀
  if (menu.menuFrom === 'dynamic' && !menu.path.startsWith('/render/')) {
    return `/render/${menu.path}`
  }
  return menu.path
}

function handleSelect(index: string) {
  router.push(index)
}

async function loadMenus() {
  loading.value = true
  try {
    const tree = await getMenuTree()
    // 过滤出顶级菜单（parentId 为 0 或 null）
    menuTree.value = tree.filter(m => !m.parentId || m.parentId === 0)
  } catch (error) {
    console.error('加载菜单失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMenus()
})
</script>

<style scoped>
.sidebar {
  height: 100vh;
  width: 220px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
  color: var(--accent);
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-muted);
}

.collapse-btn:hover {
  color: var(--accent);
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: var(--bg-secondary);
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: var(--text-primary);
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: var(--bg-hover);
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 52px !important;
}

:deep(.el-menu-item.is-active) {
  color: var(--accent);
  background: var(--accent-light);
}
</style>

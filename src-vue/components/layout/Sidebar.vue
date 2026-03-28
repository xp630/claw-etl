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
      <el-menu-item index="/editor">
        <el-icon><Edit /></el-icon>
        <template #title>页面编辑器</template>
      </el-menu-item>

      <el-menu-item index="/dashboard">
        <el-icon><DataLine /></el-icon>
        <template #title>仪表盘</template>
      </el-menu-item>

      <el-menu-item index="/datasource">
        <el-icon><Connection /></el-icon>
        <template #title>数据源</template>
      </el-menu-item>

      <el-menu-item index="/task">
        <el-icon><List /></el-icon>
        <template #title>任务管理</template>
      </el-menu-item>

      <el-menu-item index="/api">
        <el-icon><SetUp /></el-icon>
        <template #title>API 管理</template>
      </el-menu-item>

      <el-menu-item index="/menus">
        <el-icon><Menu /></el-icon>
        <template #title>菜单管理</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Edit, DataLine, Connection, List, Fold, Expand, SetUp, Menu } from '@element-plus/icons-vue'

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

function handleSelect(index: string) {
  router.push(index)
}
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

:deep(.el-menu-item) {
  color: var(--text-primary);
}

:deep(.el-menu-item:hover) {
  background: var(--bg-hover);
}

:deep(.el-menu-item.is-active) {
  color: var(--accent);
  background: var(--accent-light);
}
</style>

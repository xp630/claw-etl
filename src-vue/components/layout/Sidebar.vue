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
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Edit, DataLine, Connection, List, Fold, Expand, SetUp } from '@element-plus/icons-vue'

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
  background: #fff;
  border-right: 1px solid #e4e7ed;
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
  border-bottom: 1px solid #e4e7ed;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
  color: #409eff;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #909399;
}

.collapse-btn:hover {
  color: #409eff;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}
</style>

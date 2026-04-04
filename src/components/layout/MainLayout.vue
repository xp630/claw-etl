<template>
  <div class="main-layout">
    <!-- Sidebar -->
    <Sidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <Header />

      <!-- Page Content -->
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import { tabStore } from '@/stores/tabStore'

const route = useRoute()
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
watch(sidebarCollapsed, (val) => {
  localStorage.setItem('sidebarCollapsed', String(val))
})

onMounted(() => {
  // Initialize default tab with current route
  if (route.path && route.path !== '/') {
    tabStore.initDefaultTab(route.path, (route.meta?.title as string) || '首页')
  }
})
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
  padding: 0;
}
</style>

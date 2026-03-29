<template>
  <div id="app">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

// 初始化主题
const themeStore = useThemeStore()
onMounted(() => {
  themeStore.initTheme()
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}
</style>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

// 初始化主题
const { theme } = useTheme()
onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}
</style>

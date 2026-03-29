/**
 * Pinia Theme Store - 主题切换管理
 * 支持 dark/light/red/fresh 主题，通过 data-theme 属性控制
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'dark' | 'light' | 'red' | 'fresh'

const themes: Theme[] = ['dark', 'light', 'red', 'fresh']

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'dark')

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  function toggleTheme() {
    const idx = themes.indexOf(theme.value)
    setTheme(themes[(idx + 1) % themes.length])
  }

  // 初始化时应用主题
  function initTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    initTheme,
    themes,
  }
})

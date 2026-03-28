import { ref, watch } from 'vue'

type Theme = 'dark' | 'light'

const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'dark')

export function useTheme() {
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  // 初始化时同步 DOM
  watch(
    theme,
    (val) => {
      document.documentElement.setAttribute('data-theme', val)
    },
    { immediate: true }
  )

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}

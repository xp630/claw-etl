import { ref, computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  title: string
  meta?: Record<string, any>
  closable?: boolean
  lastActive?: number
}

const tabs = ref<TabItem[]>([])
const activeTabPath = ref('')

// Initialize with a default tab
function initDefaultTab(path: string, title: string) {
  if (tabs.value.length === 0) {
    tabs.value.push({ path, title, closable: false })
    activeTabPath.value = path
  }
}

function addTab(route: RouteLocationNormalized) {
  const path = route.path
  const title = (route.meta?.title as string) || '未命名'

  // Check if tab already exists
  const existing = tabs.value.find(t => t.path === path)
  if (existing) {
    activeTabPath.value = path
    existing.lastActive = Date.now()
    return
  }

  tabs.value.push({
    path,
    title,
    closable: true,
    lastActive: Date.now()
  })
  activeTabPath.value = path
}

function removeTab(path: string) {
  const index = tabs.value.findIndex(t => t.path === path)
  if (index === -1) return

  const tab = tabs.value[index]
  if (!tab.closable) return // Can't close non-closable tabs

  tabs.value.splice(index, 1)

  // If removing active tab, switch to another
  if (activeTabPath.value === path) {
    const newIndex = Math.min(index, tabs.value.length - 1)
    if (tabs.value[newIndex]) {
      activeTabPath.value = tabs.value[newIndex].path
    }
  }
}

function switchTab(path: string) {
  const tab = tabs.value.find(t => t.path === path)
  if (tab) {
    activeTabPath.value = path
    tab.lastActive = Date.now()
  }
}

function updateTabTitle(path: string, title: string) {
  const tab = tabs.value.find(t => t.path === path)
  if (tab) {
    tab.title = title
  }
}

export function useTabManager() {
  return {
    tabs,
    activeTabPath,
    initDefaultTab,
    addTab,
    removeTab,
    switchTab,
    updateTabTitle
  }
}

// Simple global tab store (singleton)
import { reactive, readonly } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  title: string
  meta?: Record<string, any>
  closable?: boolean
  lastActive?: number
}

class TabStore {
  private _state = reactive<{
    tabs: TabItem[]
    activePath: string
  }>({
    tabs: [],
    activePath: ''
  })

  get tabs() {
    return this._state.tabs
  }

  get activePath() {
    return this._state.activePath
  }

  set activePath(path: string) {
    this._state.activePath = path
    const tab = this._state.tabs.find(t => t.path === path)
    if (tab) {
      tab.lastActive = Date.now()
    }
  }

  initDefaultTab(path: string, title: string) {
    if (this._state.tabs.length === 0) {
      this._state.tabs.push({ path, title, closable: false })
      this._state.activePath = path
    }
  }

  addTab(route: RouteLocationNormalized) {
    const path = route.path
    const title = (route.meta?.title as string) || '未命名'

    // Skip if already exists
    const existing = this._state.tabs.find(t => t.path === path)
    if (existing) {
      this.activePath = path
      return
    }

    // Add new tab
    this._state.tabs.push({
      path,
      title,
      closable: true,
      lastActive: Date.now()
    })
    this.activePath = path
  }

  removeTab(path: string) {
    const index = this._state.tabs.findIndex(t => t.path === path)
    if (index === -1) return

    const tab = this._state.tabs[index]
    if (!tab.closable) return

    this._state.tabs.splice(index, 1)

    // If removing active, switch to another
    if (this._state.activePath === path) {
      const newIndex = Math.min(index, this._state.tabs.length - 1)
      if (this._state.tabs[newIndex]) {
        this._state.activePath = this._state.tabs[newIndex].path
      }
    }
  }

  switchTab(path: string) {
    const tab = this._state.tabs.find(t => t.path === path)
    if (tab) {
      this.activePath = path
    }
  }

  updateTabTitle(path: string, title: string) {
    const tab = this._state.tabs.find(t => t.path === path)
    if (tab) {
      tab.title = title
    }
  }
}

export const tabStore = new TabStore()

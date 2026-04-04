import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CanvasComponent } from '../pages/editor/types'

/**
 * Editor Pinia Store - Phase 1 实现
 * 参照 architect 方案文档设计
 */

// Helper: Find component by ID in tree
function findComponent(components: CanvasComponent[], id: string | null): CanvasComponent | null {
  if (!id) return null
  for (const comp of components) {
    if (comp.id === id) return comp
    if (comp.children && comp.children.length > 0) {
      const found = findComponent(comp.children, id)
      if (found) return found
    }
  }
  return null
}

// Helper: Update component in tree
function updateComponentInTree(
  components: CanvasComponent[],
  id: string,
  updates: Partial<CanvasComponent>
): boolean {
  for (let i = 0; i < components.length; i++) {
    if (components[i].id === id) {
      components[i] = { ...components[i], ...updates }
      return true
    }
    if (components[i].children && components[i].children.length > 0) {
      if (updateComponentInTree(components[i].children!, id, updates)) {
        return true
      }
    }
  }
  return false
}

// Helper: Remove component from tree
function removeComponentFromTree(components: CanvasComponent[], id: string): boolean {
  for (let i = 0; i < components.length; i++) {
    if (components[i].id === id) {
      components.splice(i, 1)
      return true
    }
    if (components[i].children && components[i].children.length > 0) {
      if (removeComponentFromTree(components[i].children!, id)) {
        return true
      }
    }
  }
  return false
}

export const useEditorStore = defineStore('editor', () => {
  // ============ State ============
  const pageTitle = ref('未命名页面')
  const pageId = ref<number | null>(null)
  const pageCode = ref('')
  const selectedId = ref<string | null>(null)
  const components = ref<CanvasComponent[]>([])
  const isDirty = ref(false)

  // ============ Getters ============
  const selectedComponent = computed(() =>
    findComponent(components.value, selectedId.value)
  )

  const rootComponents = computed(() =>
    components.value.filter(c => !c.parentId)
  )

  // ============ Actions ============

  // Generate unique ID
  function generateId(): number {
    return Date.now()
  }

  // Select component
  function selectComponent(id: string | null): void {
    selectedId.value = id
  }

  // Add component
  function addComponent(comp: Omit<CanvasComponent, 'id'>): CanvasComponent {
    const newComp: CanvasComponent = {
      ...comp,
      id: generateId(),
    }
    components.value.push(newComp)
    selectedId.value = newComp.id
    isDirty.value = true
    return newComp
  }

  // Add component to canvas (simple version - no parentId)
  function addComponentToCanvas(
    type: string,
    label: string,
    defaultProps: Record<string, unknown> = {}
  ): CanvasComponent {
    return addComponent({
      componentId: `${type}_${Date.now()}`, 
      type,
      label,
      props: defaultProps,
      children: [],
    })
  }

  // Update component
  function updateComponent(id: string, updates: Partial<CanvasComponent>): void {
    updateComponentInTree(components.value, id, updates)
    isDirty.value = true
  }

  // Update component props only
  function updateComponentProps(id: string, props: Record<string, unknown>): void {
    updateComponentInTree(components.value, id, { props })
    isDirty.value = true
  }

  // Remove component
  function removeComponent(id: string): void {
    removeComponentFromTree(components.value, id)
    if (selectedId.value === id) {
      selectedId.value = null
    }
    isDirty.value = true
  }

  // Move component (reorder)
  function moveComponent(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= components.value.length) return
    if (toIndex < 0 || toIndex >= components.value.length) return
    const [removed] = components.value.splice(fromIndex, 1)
    components.value.splice(toIndex, 0, removed)
    isDirty.value = true
  }

  // Add child to container (tabs/card/collapse)
  function addChildToContainer(
    containerId: string,
    child: CanvasComponent,
    tabIndex?: number
  ): void {
    const container = findComponent(components.value, containerId)
    if (!container) return

    if (!container.children) {
      container.children = []
    }
    container.children.push(child)

    // Update childrenMap for tabs
    if (container.type === 'tabs' && tabIndex !== undefined) {
      const childrenMap = (container.props.childrenMap as Record<string, string[]>) || {}
      const tabKey = String(tabIndex)
      if (!childrenMap[tabKey]) {
        childrenMap[tabKey] = []
      }
      childrenMap[tabKey].push(child.id)
      container.props.childrenMap = childrenMap
    }
    isDirty.value = true
  }

  // Remove child from container
  function removeChildFromContainer(containerId: string, childId: string): void {
    const container = findComponent(components.value, containerId)
    if (!container || !container.children) return

    container.children = container.children.filter(c => c.id !== childId)

    // Update childrenMap for tabs
    if (container.type === 'tabs') {
      const childrenMap = container.props.childrenMap as Record<string, string[]>
      if (childrenMap) {
        for (const key of Object.keys(childrenMap)) {
          childrenMap[key] = childrenMap[key].filter(id => id !== childId)
        }
      }
    }
    isDirty.value = true
  }

  // Set page config
  function setPageConfig(config: {
    id?: number
    name?: string
    code?: string
  }): void {
    if (config.id) pageId.value = config.id
    if (config.name) pageTitle.value = config.name
    if (config.code) pageCode.value = config.code
  }

  // Load components
  function loadComponents(comps: CanvasComponent[]): void {
    components.value = comps
    isDirty.value = false
  }

  // Reset store
  function $reset(): void {
    pageTitle.value = '未命名页面'
    pageId.value = null
    pageCode.value = ''
    selectedId.value = null
    components.value = []
    isDirty.value = false
  }

  // Mark as saved
  function markAsSaved(): void {
    isDirty.value = false
  }

  // ============ Return ============
  return {
    // State
    pageTitle,
    pageId,
    pageCode,
    selectedId,
    components,
    isDirty,
    // Getters
    selectedComponent,
    rootComponents,
    // Actions
    generateId,
    selectComponent,
    addComponent,
    addComponentToCanvas,
    updateComponent,
    updateComponentProps,
    removeComponent,
    moveComponent,
    addChildToContainer,
    removeChildFromContainer,
    setPageConfig,
    loadComponents,
    $reset,
    markAsSaved,
    // Helpers (for internal use)
    findComponent,
  }
})

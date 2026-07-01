/**
 * Editor State Composable
 * Contains all reactive state for the page editor
 */

import { ref, computed, watch } from 'vue'
import type { CanvasComponent } from '../types'
import { buildComponentTree, findComponent } from '../utils/component-utils'

// ============ State ============
export const components = ref<CanvasComponent[]>([])
export const selectedId = ref<string | null>(null)
export const showPropsPanel = ref(false) // 双击组件时显示属性面板
export const isDraggingCanvas = ref(false) // 画布拖拽中时屏蔽属性弹窗
export const pageName = ref('未命名页面')
export const pageCode = ref('')
export const previewMode = ref(false)
export const pageId = ref<number | null>(null)
export const saving = ref(false)
export const isNewPage = ref(false)
export const activeLeftTab = ref<'layer' | 'components' | ''>('')
export const showDataPanel = ref(false)

// Force refresh selectedComponent by using a refresh trigger
const refreshTrigger = ref(0)

// ============ Computed ============
// 根据当前 components.value 实时构建树，再从中查找
export const selectedComponent = computed(() => {
  refreshTrigger.value // dependency
  const tree = buildComponentTree(components.value)
  return findComponent(tree, selectedId.value)
})

// Also track components.value to ensure selectedComponent updates when components change
watch(components, () => {
  refreshTrigger.value++
})

export function refreshSelectedComponent() {
  if (selectedId.value) {
    refreshTrigger.value++
  }
}

// Get container children for a component
export function getContainerChildrenForComponent(comp: CanvasComponent): CanvasComponent[] {
  if (comp.type === 'tabs') {
    const activeTabId = comp.props?.activeTab as string || 'tab_0'
    return (comp.children || []).filter(c =>
      (c as any).tabId === activeTabId
    )
  }
  return comp.children || []
}

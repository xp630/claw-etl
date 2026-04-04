<template>
  <div class="h-screen flex flex-col bg-[var(--bg-tertiary)]">
    <!-- Header -->
    <div class="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-light)] flex items-center px-4 gap-4">
      <h1 class="text-lg font-medium text-[var(--text-primary)]">
        {{ isNewPage ? '新建页面' : '页面编辑器' }}
      </h1>
      <input
        type="text"
        v-model="pageName"
        placeholder="输入页面名称"
        class="px-3 py-1.5 border border-[var(--border)] rounded text-sm w-48 bg-[var(--input-bg)] text-[var(--text-primary)]"
      />
      
      <!-- 工具栏 -->
      <div class="flex items-center gap-1">
        <el-button
          :type="activeLeftTab === 'components' ? 'primary' : 'default'"
          size="small"
          @click="toggleLeftTab('components')"
        >
          <LayoutGrid class="w-4 h-4 mr-1" />组件库
        </el-button>
        <el-button
          v-if="selectedId"
          size="small"
          @click="openPropsPanel"
        >
          属性
        </el-button>
      </div>
      
      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-[var(--text-muted)]">{{ components.length }} 个组件</span>
        <el-button v-if="previewMode" type="default" size="small" @click="previewMode = false">
          退出预览
        </el-button>
        <template v-else>
          <el-button type="primary" size="small" :loading="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
          <el-button type="success" size="small" @click="handlePreview" :disabled="!pageCode && !isNewPage">
            预览
          </el-button>
          <el-button size="small" @click="handleClear">
            清空
          </el-button>
          <el-button type="warning" size="small" @click="handleFlattenComponents">
            拆散
          </el-button>
          <el-button type="info" size="small" @click="showDataPanel = !showDataPanel">
            数据
          </el-button>
        </template>
        <el-button size="small" @click="goToList">
          返回列表
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 浮动面板 -->
      <div 
        v-if="activeLeftTab"
        class="absolute left-4 top-4 z-40 w-72 h-[calc(100vh-140px)] bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-xl flex flex-col"
      >
        <ComponentPanel 
          v-if="activeLeftTab === 'components'"
          @quick-add="handleQuickAdd"
        />
        <ComponentTree
          v-if="activeLeftTab === 'layer'"
          :components="components"
          :selected-id="selectedId"
          @select="handleSelectComponent"
          @delete="handleDelete"
        />
      </div>

      <!-- 属性配置弹窗 (双击组件时显示) -->
      <div 
        v-if="showPropsPanel && selectedComponent"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        :class="{ 'pointer-events-none': isDraggingCanvas }"
        @click.self="closePropsPanel"
      >
        <div class="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
            <h3 class="font-medium text-[var(--text-primary)]">
              属性配置 - {{ selectedComponent.label }}
            </h3>
            <el-button text @click="closePropsPanel">
              ✕
            </el-button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <PropertyPanel
              :selected-component="selectedComponent"
              :components="components"
              @update-props="handleUpdateProps"
              @update-component="handleUpdateComponent"
              @move-to-container="handleMoveToContainer"
              @move-out-of-container="handleMoveOutOfContainer"
              @delete-component="handleDelete"
              @select-component="handleSelectComponent"
              @remove-tab="handleRemoveTab"
            />
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <!-- Preview Mode -->
      <div
        v-if="previewMode"
        class="flex-1 overflow-auto p-6 bg-[var(--bg-secondary)]"
      >
        <div class="min-w-[1280px] space-y-4">
          <template
            v-for="comp in components"
            :key="comp.id"
          >
            <ComponentRenderer :component="comp" :editable="false" :show-children="getContainerChildren(comp)" :selected-id="selectedId" :canvas-mode="true" @select="handleSelectComponent" />
          </template>
          <div v-if="components.length === 0" class="text-center text-[var(--text-muted)] py-12">
            暂无组件
          </div>
        </div>
      </div>

      <!-- Editor Mode -->
      <DropCanvas
        v-else
        class="flex-1"
        :components="components"
        :selected-id="selectedId"
        @select="handleSelectComponent"
        @reorder="handleReorder"
        @delete="handleDelete"
        @drop="handleDrop"
        @add-child="handleAddChildToContainer"
        @remove-child="handleRemoveChildFromContainer"
        @move-child-to-root="handleMoveChildToRoot"
        @resize="handleResize"
        @update-props="handleUpdatePropsDirect"
        @update-component="handleUpdateComponent"
        @drag-start="isDraggingCanvas = true"
        @drag-end="isDraggingCanvas = false"
        @open-props="openPropsPanel"
      />

      <!-- Data Panel (数据预览) -->
      <DataPanel
        v-model:visible="showDataPanel"
        :components="components"
        @update:components="handleDataPanelUpdate"
        @select="handleSelectComponent"
        @close="showDataPanel = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutGrid, Layers, Settings2, X } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import ComponentPanel from '@/components/editor/ComponentPanel.vue'
import ComponentTree from './ComponentTree.vue'
import DropCanvas from './DropCanvas.vue'
import PropertyPanel from '@/components/editor/PropertyPanel.vue'
import ComponentRenderer from './ComponentRenderer.vue'
import DataPanel from '@/components/editor/DataPanel.vue'
import type { CanvasComponent, TabItem } from './types'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// ============ State ============
const components = ref<CanvasComponent[]>([])
const selectedId = ref<string | null>(null)
const showPropsPanel = ref(false) // 双击组件时显示属性面板
const isDraggingCanvas = ref(false) // 画布拖拽中时屏蔽属性弹窗
const pageName = ref('未命名页面')
const pageCode = ref('')
const previewMode = ref(false)
const pageId = ref<number | null>(null)
const saving = ref(false)
const isNewPage = ref(false)
const activeLeftTab = ref<'layer' | 'components' | ''>('')
const showDataPanel = ref(false)

// ============ API ============
const API_BASE = '/etl-admin'
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

async function getPageConfig(id: number) {
  const res = await api.post('/pageConfig/detail', { id })
  return res.data
}

async function savePageConfig(data: any) {
  const res = await api.post('/pageConfig/save', data)
  return res.data
}


// ============ Helpers ============
function isContainerType(type: string): boolean {
  return ['card', 'tabs', 'collapse'].includes(type)
}

function getContainerChildren(comp: CanvasComponent): CanvasComponent[] {
  // In new flat design, comp.children is pre-populated by buildComponentTree
  // based on parentComponentId + tabId matching
  if (comp.type === 'tabs') {
    const activeTabId = comp.props?.activeTab as string || 'tab_0'
    // Return children that belong to the active tab
    return (comp.children || []).filter(c => 
      (c as any).tabId === activeTabId
    )
  }
  return comp.children || []
}

function generateId(): number {
  return Date.now()
}

function findComponent(comps: CanvasComponent[], id: string | null): CanvasComponent | null {
  if (!id) return null
  const idStr = String(id)
  for (const c of comps) {
    // Match by id or componentId (parentId points to componentId)
    if (String(c.id) === idStr || c.componentId === idStr) return c
    if (c.children && c.children.length > 0) {
      const found = findComponent(c.children, id)
      if (found) return found
    }
  }
  return null
}

function findParentContainerId(comps: CanvasComponent[], childId: string, parentId: string | null = null): string | null {
  for (const c of comps) {
    // Match child by id or componentId
    if (c.id === childId || c.componentId === childId) {
      return parentId
    }
    if (c.children && c.children.length > 0) {
      const found = findParentContainerId(c.children, childId, c.componentId || c.id)
      if (found !== null) return found
    }
  }
  return null
}

// Load component from flat data
function loadComponent(c: any): CanvasComponent {
  let props: Record<string, any> = {}
  try {
    // 如果 c.props 已经是对象（不是字符串），直接使用；否则尝试 JSON 解析
    if (typeof c.props === 'object' && c.props !== null) {
      props = c.props
    } else {
      props = JSON.parse(c.props || '{}')
    }
  } catch {
    // 如果解析失败，尝试直接赋值
    if (typeof c.props === 'object' && c.props !== null) {
      props = c.props
    }
  }
  // 调试日志
  if (c.type === 'tabs') {
    console.log('[EditorPage] loadComponent tabs:', {
      id: c.id,
      rawProps: c.props,
      parsedProps: props,
      hasTabs: 'tabs' in props,
      tabsValue: props.tabs
    })
  }
  return {
    id: String(c.id) || `comp_${Date.now()}`,
    // 优先使用保存时的 componentId
    componentId: c.componentId 
      ? String(c.componentId)
      : `${c.type}_${c.id || Date.now()}`,
    parentComponentId: c.parentComponentId || undefined,
    tabId: c.tabId || undefined,
    type: c.type,
    label: c.label || '',
    props,
    children: []
  }
}

// Build tree structure from flat list using parentComponentId + tabId
function buildComponentTree(flatComponents: any[]): CanvasComponent[] {
  const componentMap = new Map<string, CanvasComponent>()
  const rootComponents: CanvasComponent[] = []

  // First create all components and store by componentId
  flatComponents.forEach(c => {
    const comp = loadComponent(c)
    if (comp.componentId) {
      componentMap.set(comp.componentId, comp)
    }
    if (comp.id) {
      componentMap.set(String(comp.id), comp)
    }
  })

  // Group children by parentComponentId (for regular containers)
  const childrenByParent = new Map<string, CanvasComponent[]>()
  // Group children by parentComponentId + tabId (for tabs)
  const childrenByTab = new Map<string, CanvasComponent[]>()

  flatComponents.forEach(c => {
    const comp = componentMap.get(c.componentId || String(c.id))
    if (!comp) return

    if (c.parentComponentId) {
      const key = c.tabId 
        ? `${c.parentComponentId}:${c.tabId}` 
        : c.parentComponentId
      
      if (c.tabId) {
        const tabKey = `${c.parentComponentId}:${c.tabId}`
        if (!childrenByTab.has(tabKey)) {
          childrenByTab.set(tabKey, [])
        }
        childrenByTab.get(tabKey)!.push(comp)
      } else {
        if (!childrenByParent.has(c.parentComponentId)) {
          childrenByParent.set(c.parentComponentId, [])
        }
        childrenByParent.get(c.parentComponentId)!.push(comp)
      }
    } else {
      rootComponents.push(comp)
    }
  })

  // Assign children to components
  // For tabs: store all children (they'll be filtered by tabId in getContainerChildren)
  // For other containers: direct assignment
  componentMap.forEach((comp, key) => {
    if (comp.type === 'tabs') {
      // Tabs: store all children, filtered by tabId at runtime
      const allTabChildren: CanvasComponent[] = []
      childrenByTab.forEach((children) => {
        allTabChildren.push(...children)
      })
      comp.children = allTabChildren
    } else {
      const parentKey = comp.componentId || String(comp.id)
      comp.children = childrenByParent.get(parentKey) || []
    }
  })

  return rootComponents
}

/**
 * 扁平化组件树用于保存
 * 
 * 完全扁平：每个组件一条记录，通过 parentComponentId + tabId 关联
 * - parentComponentId: 父容器组件的 componentId
 * - tabId: 属于哪个 tab（仅 tabs 容器内的组件）
 * - tabs 的 props.tabs 不再包含 children
 */
function flattenComponentsWithParentId(comps: CanvasComponent[], parentComponentId: string | null = null, tabId: string | null = null): any[] {
  const result: any[] = []
  for (const c of comps) {
    const { children, props, ...rest } = c
    
    // Clean props: remove childrenMap
    const cleanProps = { ...props }
    delete cleanProps.childrenMap
    delete cleanProps.children
    
    // For tabs, remove children from tab items (children now via parentComponentId + tabId)
    if (cleanProps.tabs) {
      cleanProps.tabs = (cleanProps.tabs as TabItem[]).map(({ children, ...tabRest }) => tabRest)
    }

    const item: any = {
      ...rest,
      componentId: c.componentId,
      parentComponentId: parentComponentId || undefined,
      tabId: tabId || undefined,
      props: cleanProps
    }

    // Ensure tabs have activeTab as string
    if (item.type === 'tabs' && item.props?.tabs) {
      const rawActiveTab = item.props.activeTab
      if (typeof rawActiveTab === 'number') {
        item.props.activeTab = `tab_${rawActiveTab}`
      } else if (!rawActiveTab) {
        item.props.activeTab = 'tab_0'
      }
    }

    result.push(item)
    
    // Recursively flatten children
    if (children && children.length > 0) {
      children.forEach((child: CanvasComponent) => {
        // For tabs: child's tabId comes from the child's own property
        // For regular containers: tabId is null
        const childTabId = c.type === 'tabs' ? (child.tabId || null) : null
        result.push(...flattenComponentsWithParentId(
          [child], 
          c.componentId || String(c.id), 
          childTabId
        ))
      })
    }
  }
  return result
}

// Legacy function - kept for compatibility but not used in new flow
function flattenComponents(comps: CanvasComponent[]): CanvasComponent[] {
  return flattenComponentsWithParentId(comps)
}

// ============ Computed ============
// Force refresh selectedComponent by using a refresh trigger
const refreshTrigger = ref(0)
// 根据当前 components.value 实时构建树，再从中查找
const selectedComponent = computed(() => {
  refreshTrigger.value // dependency
  const tree = buildComponentTree(components.value)
  const comp = findComponent(tree, selectedId.value)
  console.log('[EditorPage] selectedComponent computed:', {
    selectedId: selectedId.value,
    selectedIdType: typeof selectedId.value,
    compFound: !!comp,
    compType: comp?.type,
    compProps: comp?.props ? Object.keys(comp.props) : 'NO PROPS'
  })
  return comp
})
// Also track components.value to ensure selectedComponent updates when components change
watch(components, () => {
  refreshTrigger.value++
})

function refreshSelectedComponent() {
  if (selectedId.value) {
    refreshTrigger.value++
  }
}

// ============ Actions ============
function toggleLeftTab() {
  activeLeftTab.value = activeLeftTab.value === 'components' ? '' : 'components'
}

function handleSelectComponent(id: string) {
  // 防御：如果收到了非字符串（比如 MouseEvent），忽略
  if (typeof id !== 'string') {
    console.warn('[EditorPage] handleSelectComponent received non-string id:', id)
    return
  }
  selectedId.value = id
}

// 双击打开属性面板
function openPropsPanel(id?: string) {
  if (id) {
    selectedId.value = id
  }
  if (selectedId.value) {
    showPropsPanel.value = true
  }
}

// 关闭属性面板
function closePropsPanel() {
  showPropsPanel.value = false
}

function handleReorder(fromIndex: number, toIndex: number) {
  const newComponents = [...components.value]
  const [removed] = newComponents.splice(fromIndex, 1)
  newComponents.splice(toIndex, 0, removed)
  components.value = newComponents
}

function handleDelete(id: string) {
  components.value = removeComponentFromTree(components.value, id)
  if (selectedId.value === id) {
    selectedId.value = null
  }
}

// 处理 PropertyPanel 发起的 tab 删除（包含嵌套组件删除）
function handleRemoveTab(tabIndex: number, tabChildren: (string | number)[]) {
  if (!selectedId.value) return
  const tabs = selectedComponent.value?.props?.tabs
  if (!tabs || !Array.isArray(tabs)) return
  
  // 从 tabs 数组中移除该 tab
  const newTabs = tabs.filter((_: any, i: number) => i !== tabIndex)
  components.value = updateComponentProps(components.value, selectedId.value, { tabs: newTabs })
  
  // 删除该 tab 中的嵌套组件
  tabChildren.forEach((childId: string | number) => {
    components.value = removeComponentFromTree(components.value, String(childId))
  })
  
  // 如果删除的是当前激活的 tab，调整 activeTab
  const activeTab = selectedComponent.value?.props?.activeTab
  if (activeTab !== undefined && typeof activeTab === 'string') {
    const newActiveTab = newTabs[Math.min(Number(activeTab.replace('tab_', '')), newTabs.length - 1)]
    if (newActiveTab) {
      components.value = updateComponentProps(components.value, selectedId.value, { activeTab: newActiveTab.tabId })
    }
  }
}

function handleDrop(data: { fromPalette: boolean, type?: string, label?: string, defaultProps?: Record<string, unknown> } | null) {
  console.log('[EditorPage] handleDrop called with:', data)
  if (data && data.fromPalette) {
    const timestamp = Date.now()
    const newComponent: CanvasComponent = {
      type: data.type || 'text',
      label: data.label || '新组件',
      id: String(timestamp),
      componentId: `${data.type}_${timestamp}`,
      props: data.defaultProps || {},
    }
    components.value = [...components.value, newComponent]
    selectedId.value = String(timestamp)
    refreshSelectedComponent()
  }
}

function handleQuickAdd(comp: { type: string; label: string; defaultProps?: Record<string, any> }) {
  const timestamp = Date.now()
  const id = String(timestamp)
  const newComponent: CanvasComponent = {
    type: comp.type,
    label: comp.label,
    id: id,
    componentId: `${comp.type}_${timestamp}`,
    props: comp.defaultProps || {},
  }
  components.value = [...components.value, newComponent]
  activeLeftTab.value = ''
  selectedId.value = id
}

// Recursively update parentId for all nested components (deep copy)
// parentId 统一指向 componentId（稳定 ID）
function updateParentIdDeep(comp: CanvasComponent, newParentId: string): CanvasComponent {
  return {
    ...comp,
    parentId: newParentId,
    children: comp.children?.map(child => updateParentIdDeep(child, comp.componentId))
  }
}

/**
 * 添加子组件到容器
 * 
 * 【函数作用】将组件拖拽添加到 card、tabs、collapse 等容器中,建立父子关系
 * 
 * 【参数】
 *   - containerId: string - 目标容器的 ID
 *   - childComponent: CanvasComponent - 要添加的子组件(完整对象)
 *   - tabIndex?: number - 可选,目标 tab 索引(仅对 tabs 组件有效,如果不传则添加到当前激活的 tab)
 * 
 * 【返回值】无(直接修改 components.value)
 * 
 * 【核心逻辑】
 *   1. 递归更新子组件及其所有嵌套后代的 parentId
 *   2. 在容器组件的 children 数组中添加子组件
 *   3. 对于 tabs 容器,还需更新对应 TabItem.children 或 childrenMap
 * 
 * 【Tabs 格式处理】
 *   - 新格式(TabItem[]):
 *     * 将子组件的 ID 添加到目标 TabItem.children 数组
 *     * 如果未指定 tabIndex,则添加到当前激活的 tab
 *   - 旧格式(childrenMap):
 *     * 将子组件的 ID 添加到 childrenMap[tabIndex] 数组
 *     * tabIndex 未指定时使用当前激活的 tab
 * 
 * 【新旧格式区别】
 *   新格式: tabs[i].children.push(childId)
 *   旧格式: childrenMap[i].push(childId)
 */
// Add child to container - new flat design
function handleAddChildToContainer(containerId: string, childComponent: CanvasComponent, tabIndex?: number) {
  // Find the container component
  const container = findComponent(components.value, containerId)
  const containerComponentId = container?.componentId || containerId
  
  // Determine which tab the child belongs to (for tabs)
  let tabId: string | null = null
  if (container?.type === 'tabs') {
    const tabs = container.props?.tabs as TabItem[] || []
    if (tabIndex !== undefined && tabIndex >= 0 && tabs[tabIndex]) {
      tabId = tabs[tabIndex].tabId
    } else {
      // Use active tab
      const activeTabId = container.props?.activeTab as string || 'tab_0'
      tabId = activeTabId
    }
  }
  
  // Create child with parent reference
  const childKey = String(childComponent.componentId || childComponent.id)
  const childWithParent: CanvasComponent = {
    ...childComponent,
    parentComponentId: containerComponentId,
    tabId: tabId || undefined
  }

  // In flat design: remove from root (if present), add to container's children
  components.value = components.value
    .filter(c => String(c.id) !== String(childComponent.id) && c.componentId !== childKey)
    .map(c => {
      if (c.id === containerId || c.componentId === containerId) {
        return { ...c, children: [...(c.children || []), childWithParent] }
      }
      return c
    })

  selectedId.value = childKey
  refreshSelectedComponent()
}

/**
 * 从容器中移除子组件
 * 
 * 【函数作用】将子组件从容器中移除,但不删除组件本身,只是解除父子关系
 * 
 * 【参数】
 *   - containerId: string - 容器组件的 ID
 *   - childId: string - 要移除的子组件的 ID
 * 
 * 【返回值】无(直接修改 components.value)
/**
 * 从容器中移除子组件（解除父子关系，但不删除组件本身）
 */
// Remove child from container - new flat design
function handleRemoveChildFromContainer(containerId: string, childId: string) {
  if (!confirm('确定要移除这个组件吗？')) return

  // Simply remove from container's children array
  // In new design, child's tabId indicates which tab it belongs to
  components.value = updateComponentInTree(components.value, containerId, (comp: CanvasComponent) => {
    return {
      ...comp,
      children: (comp.children || []).filter(c => 
        String(c.id) !== String(childId) && c.componentId !== childId
      ),
    }
  })
  
  if (String(selectedId.value) === String(childId)) {
    selectedId.value = null
  } else {
    refreshSelectedComponent()
  }
}

function handleMoveChildToRoot(fromContainerId: string, childId: string, insertIndex: number, tabIndex?: number) {
  // Prevent dropping a container into itself or its descendant
  const isDescendant = (targetId: string, ancestorId: string): boolean => {
    if (targetId === ancestorId) return true
    const findComp = (comps: CanvasComponent[], id: string): CanvasComponent | null => {
      for (const c of comps) {
        // Match by id or componentId (stable ID)
        if (c.id === id || c.componentId === id) return c
        if (c.children?.length) {
          const found = findComp(c.children, id)
          if (found) return found
        }
      }
      return null
    }
    const ancestor = findComp(components.value, ancestorId)
    if (!ancestor) return false
    const checkDescendants = (comp: CanvasComponent): boolean => {
      // Match by id or componentId
      if (comp.id === targetId || comp.componentId === targetId) return true
      return comp.children?.some(checkDescendants) || false
    }
    return checkDescendants(ancestor)
  }

  // Find and extract child
  let childToMove: CanvasComponent | null = null

  // 先找到要移动的组件（用于获取 componentId）
  const findChildComp = (comps: CanvasComponent[]): CanvasComponent | null => {
    for (const c of comps) {
      // Match by id OR componentId (stable ID)
      if (String(c.id) === String(childId) || c.componentId === String(childId)) return c
      if (c.children) {
        const found = findChildComp(c.children)
        if (found) return found
      }
    }
    return null
  }
  const childComp = findChildComp(components.value)
  const childCompId = childComp?.componentId ? String(childComp.componentId) : String(childId)
  
  const extractFromContainer = (comp: CanvasComponent): CanvasComponent | null => {
    if (comp.id === fromContainerId || comp.componentId === fromContainerId) {
      if (comp.type === 'tabs') {
        const tabs = comp.props.tabs as TabItem[]
        if (tabs && Array.isArray(tabs)) {
          let found = false
          const newTabs = tabs.map(tab => {
            if (found) return tab
            const childIds = (tab.children || []) as (string | number)[]
            const idx = childIds.findIndex(id => String(id) === childCompId)
            if (idx !== -1) {
              found = true
              return { ...tab, children: childIds.filter((_, i) => i !== idx) }
            }
            return tab
          })
          if (found) {
            const filteredChildren = (comp.children || []).filter(c => String(c.id) !== String(childId) && c.componentId !== childCompId)
            return { ...comp, children: filteredChildren, props: { ...comp.props, tabs: newTabs } }
          }
          return null
        }
      }
      const children = comp.children || []
      // Move child to root (remove from container)
function handleMoveChildToRoot(fromContainerId: string, childId: string, insertIndex: number, tabIndex?: number) {
  let childToMove: CanvasComponent | null = null

  // Extract child from container
  const extractFromContainer = (comp: CanvasComponent): CanvasComponent | null => {
    if (comp.id === fromContainerId || comp.componentId === fromContainerId) {
      const children = comp.children || []
      const idx = children.findIndex(c => String(c.id) === String(childId) || c.componentId === childId)
      if (idx !== -1) {
        childToMove = { ...children[idx], parentComponentId: undefined, tabId: undefined }
        return { ...comp, children: children.filter((_, i) => i !== idx) }
      }
    }
    return null
  }

  let updated = components.value.map(comp => {
    const result = extractFromContainer(comp)
    if (result) return result
    if (comp.children && comp.children.length > 0) {
      const childIdx = comp.children.findIndex(c => c.id === fromContainerId)
      if (childIdx !== -1) {
        const container = comp.children[childIdx]
        const extracted = extractFromContainer(container)
        if (extracted) {
          const newChildren = [...comp.children]
          newChildren[childIdx] = extracted
          return { ...comp, children: newChildren }
        }
      }
    }
    return comp
  })

  if (!childToMove) return

  // Add to root level
  if (insertIndex < 0 || insertIndex >= updated.length) {
    updated = [...updated, childToMove]
  } else {
    updated.splice(insertIndex, 0, childToMove)
  }

  components.value = updated
  selectedId.value = String(childToMove.id || childToMove.componentId)
  refreshSelectedComponent()
}
    }
  }

  components.value = updated
  selectedId.value = childId
  refreshSelectedComponent()
}

function handleMoveToContainer(containerId: string, componentId: string, tabIndex?: number) {
  console.log('[EditorPage] handleMoveToContainer:', { containerId, componentId, tabIndex })
  const comp = findComponent(components.value, componentId)
  console.log('[EditorPage] found component:', comp?.type, comp?.id)
  if (!comp) return
  const parentId = findParentContainerId(components.value, componentId)
  console.log('[EditorPage] parentId:', parentId)
  if (parentId) {
    handleRemoveChildFromContainer(parentId, componentId)
  } else {
    components.value = components.value.filter(c => c.id !== componentId)
  }
  handleAddChildToContainer(containerId, comp, tabIndex)
  console.log('[EditorPage] after move, components:', JSON.stringify(components.value))
}

function handleMoveOutOfContainer(containerId: string, componentId: string) {
  handleMoveChildToRoot(containerId, componentId, -1)
}

function handleResize(id: string, width: number, height: number) {
  components.value = updateComponentProps(components.value, id, { width, height })
  refreshSelectedComponent()
}

function handleUpdateProps(newProps: Record<string, any>) {
  if (selectedId.value) {
    components.value = updateComponentProps(components.value, selectedId.value, newProps)
    // Tabs 属性变更后，selectedComponent 会自动通过 computed 响应式更新
    // 因为 selectedComponent 依赖 components.value，而 updateComponentProps 创建了新引用
  }
}

function handleUpdatePropsDirect(id: string, newProps: Record<string, any>) {
  components.value = updateComponentProps(components.value, id, newProps)
  refreshSelectedComponent()
}

function handleUpdateComponent(id: string, key: string, value: any) {
  components.value = updateComponentProps(components.value, id, { [key]: value })
  refreshSelectedComponent()
}

function handleFlattenComponents() {
  if (confirm('确定要拆散所有嵌套组件吗？嵌套的子组件将全部移到根层级。')) {
    components.value = flattenComponents(components.value)
    selectedId.value = null
    ElMessage.success('已拆散所有嵌套组件')
  }
}

function handleClear() {
  if (confirm('确定要清空所有组件吗？')) {
    components.value = []
    selectedId.value = null
  }
}

function handleDataPanelUpdate(newComponents: CanvasComponent[]) {
  components.value = newComponents
  selectedId.value = null
}

function goToList() {
  router.push('/pages')
}

function handlePreview() {
  // 切换预览模式
  previewMode.value = !previewMode.value
}

async function handleSave() {
  if (!pageName.value.trim()) {
    ElMessage.error('请输入页面名称')
    return
  }

  saving.value = true
  try {
    // 扁平化组件树，保存 parentComponentId + tabId 层级关系
    const flatComponents = flattenComponentsWithParentId(components.value)
    console.log('[EditorPage] saving flatComponents:', flatComponents.map(c => ({
      id: c.id,
      type: c.type,
      parentComponentId: c.parentComponentId,
      tabId: c.tabId
    })))
    
    const result = await savePageConfig({
      id: pageId.value || undefined,
      name: pageName.value,
      code: pageCode.value || `page_${Date.now()}`,
      components: flatComponents
    })

    if (result?.code === 0 || result?.code === 1) {
      if (result.data?.id && !pageId.value) {
        pageId.value = result.data.id
        pageCode.value = result.data.code || pageCode.value
        isNewPage.value = false
        // Update URL
        window.history.replaceState(null, '', `#/editor?pageId=${result.data.id}`)
      }
      ElMessage.success('保存成功！')
      router.push('/pages')
    } else {
      ElMessage.error(result?.msg || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(`保存失败: ${error?.response?.data?.msg || error.message || '请重试'}`)
  } finally {
    saving.value = false
  }
}

// Helper to update component recursively
function updateComponentInTree(
  components: CanvasComponent[],
  id: string,
  updater: (c: CanvasComponent) => CanvasComponent
): CanvasComponent[] {
  return components.map(c => {
    // Match by id or componentId (containerId might be either)
    const matchId = c.id === id || c.componentId === id
    if (matchId) {
      return updater(c)
    }
    if (c.children && c.children.length > 0) {
      return { ...c, children: updateComponentInTree(c.children, id, updater) }
    }
    return c
  })
}

// Helper to find and remove component recursively
function removeComponentFromTree(components: CanvasComponent[], id: string): CanvasComponent[] {
  return components.flatMap(c => {
    const matchId = c.id === id || c.componentId === id
    if (matchId) return []
    if (c.children && c.children.length > 0) {
      return [{ ...c, children: removeComponentFromTree(c.children, id) }]
    }
    return [c]
  })
}

// Helper to update component props recursively
function updateComponentProps(components: CanvasComponent[], id: string, newProps: Record<string, any>): CanvasComponent[] {
  return components.map(c => {
    const matchId = c.id === id || c.componentId === id
    if (matchId) {
      return { ...c, props: { ...c.props, ...newProps } }
    }
    if (c.children && c.children.length > 0) {
      return { ...c, children: updateComponentProps(c.children, id, newProps) }
    }
    return c
  })
}

// ============ Lifecycle ============
async function loadPageConfig() {
  console.log('[EditorPage] loadPageConfig called, route.query:', route.query)
  const pageIdParam = route.query.id || route.query.pageId
  const isNew = route.query.new === 'true'
  
  if (isNew) {
    isNewPage.value = true
    const timestamp = Date.now()
    pageName.value = `未命名页面-${timestamp}`
    pageCode.value = `page_${timestamp}`
    components.value = []
    selectedId.value = null
  } else if (pageIdParam) {
    isNewPage.value = false
    try {
      console.log('[EditorPage] getPageConfig called, id:', pageIdParam)
      const data = await getPageConfig(Number(pageIdParam))
      console.log('[EditorPage] getPageConfig returned:', data)
      if ((data?.code === 0 || data?.success) && data.data) {
        const pageData = data.data.page
        const pageComponents = data.data.components
        pageName.value = pageData?.name || '未命名页面'
        pageCode.value = pageData?.code || ''
        pageId.value = pageData?.id || null
        
        // 解析组件数据
        if (pageComponents && Array.isArray(pageComponents)) {
          const tree = buildComponentTree(pageComponents)
          console.log('[EditorPage] built tree, root components:', tree.length)
          tree.forEach((comp, i) => {
            console.log(`  [${i}] id=${comp.id}, type=${comp.type}, label=${comp.label}, children count=${comp.children?.length || 0}`)
          })
          components.value = tree
        }
      }
    } catch (err) {
      console.error('加载页面失败', err)
      ElMessage.error('加载页面失败')
    }
  }
}

onMounted(async () => {
  console.log('[EditorPage] onMounted called')
  await loadPageConfig()
  
  // 键盘快捷键
  document.addEventListener('keydown', handleKeyDown)
})

// 监听路由变化，刷新时重新加载
watch(() => route.fullPath, (newPath, oldPath) => {
  console.log('[EditorPage] route.fullPath changed:', oldPath, '->', newPath)
  loadPageConfig()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(e: KeyboardEvent) {
  // Delete selected component
  if (e.key === 'Delete' && selectedId.value && !isInputFocused()) {
    handleDelete(selectedId.value)
  }
}

function isInputFocused(): boolean {
  const active = document.activeElement
  return active instanceof HTMLInputElement ||
         active instanceof HTMLTextAreaElement ||
         active instanceof HTMLSelectElement
}
</script>

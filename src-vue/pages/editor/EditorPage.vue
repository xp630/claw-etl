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
          :type="activeLeftTab === 'layer' ? 'primary' : 'default'"
          size="small"
          @click="toggleLeftTab('layer')"
        >
          <Layers class="w-4 h-4 mr-1" />组件层
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
            <ComponentRenderer :component="comp" :editable="false" :show-children="getContainerChildren(comp)" :selected-id="selectedId" canvas-mode @select="handleSelectComponent" />
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
import type { CanvasComponent, UnifiedTabs, TabsFormat, TabItem } from './types'
import { isLegacyTabs, migrateTabs } from './types'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// ============ State ============
// Helper: Get unified tabs format (supports both legacy and new)
function getUnifiedTabs(tabs: UnifiedTabs, childrenMap?: Record<string, (string | number)[]>): TabsFormat {
  if (isLegacyTabs(tabs)) {
    return migrateTabs(tabs, childrenMap)
  }
  return tabs
}

// Helper: Get active tab id
function getActiveTabId(activeTab: string | number | undefined): string {
  if (activeTab === undefined || activeTab === null) return ''
  return String(activeTab)
}

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
  if (comp.type === 'tabs') {
    const childrenMap = comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
    if (childrenMap) {
      const tabIndex = String(comp.props?.activeTab || 0)
      const childIds = childrenMap[tabIndex] || []
      return (comp.children || []).filter(c => 
        childIds.includes(c.componentId as any) || childIds.includes(c.id as any)
      )
    }
    return comp.children || []
  }
  return comp.children || []
}

function generateId(): number {
  return Date.now()
}

function findComponent(comps: CanvasComponent[], id: string | null): CanvasComponent | null {
  if (!id) return null
  for (const c of comps) {
    if (c.id === id) return c
    if (c.children && c.children.length > 0) {
      const found = findComponent(c.children, id)
      if (found) return found
    }
  }
  return null
}

function findParentContainerId(comps: CanvasComponent[], childId: string, parentId: string | null = null): string | null {
  for (const c of comps) {
    if (c.id === childId) {
      return parentId
    }
    if (c.children && c.children.length > 0) {
      const found = findParentContainerId(c.children, childId, c.id)
      if (found !== null) return found
    }
  }
  return null
}

// Load component from flat data
function loadComponent(c: any): CanvasComponent {
  let props: Record<string, any> = {}
  try {
    props = JSON.parse(c.props || '{}')
  } catch {}
  return {
    id: String(c.id) || `comp_${Date.now()}`,
    componentId: c.componentId || undefined,
    parentId: c.parentId || undefined,
    type: c.type,
    label: c.label || '',
    props,
    children: []
  }
}

// Build tree structure from flat list with parentId
function buildComponentTree(flatComponents: any[]): CanvasComponent[] {
  const componentMap = new Map<string | number, CanvasComponent>()
  const rootComponents: CanvasComponent[] = []

  // First create all components
  flatComponents.forEach(c => {
    const comp = loadComponent(c)
    // Store with both id and componentId keys for lookup
    componentMap.set(comp.id, comp)
    if (typeof comp.id === 'string') {
      componentMap.set(Number(comp.id), comp)
    }
    // Also store by componentId for stable linking
    if (comp.componentId) {
      componentMap.set(comp.componentId, comp)
    }
  })

  // Then build parent-child relationships using componentId for linking
  const addedToChildren = new Set<string | number>()
  flatComponents.forEach(c => {
    const comp = componentMap.get(c.id) || componentMap.get(String(c.id)) || componentMap.get(c.componentId)
    if (!comp) return
    const parentId = c.parentId
    if (parentId) {
      const parent = componentMap.get(parentId) || componentMap.get(String(parentId)) || componentMap.get(c.componentId)
      if (parent) {
        parent.children = parent.children || []
        // Avoid double-adding same component to children (might already be added via componentId link)
        if (!addedToChildren.has(comp.id)) {
          parent.children.push(comp)
          addedToChildren.add(comp.id)
        }
      } else {
        rootComponents.push(comp)
      }
    } else {
      rootComponents.push(comp)
    }
  })

  // Fix childrenMap: resolve childrenMap IDs to actual component objects
  componentMap.forEach(comp => {
    const childrenMap = comp.props?.childrenMap as Record<string, (string | number)[]> | undefined
    
    // If childrenMap is empty or undefined but children exists, rebuild childrenMap from children
    if (!childrenMap || Object.keys(childrenMap).length === 0) {
      if (comp.children && comp.children.length > 0) {
        // Rebuild childrenMap from children array using componentId (stable)
        comp.props.childrenMap = { '0': comp.children.map(c => c.componentId || c.id) }
      }
    } else if (childrenMap && typeof childrenMap === 'object') {
      // Existing logic: resolve childrenMap IDs to actual component objects
      const allChildIds: (string | number)[] = []
      Object.values(childrenMap).forEach(ids => {
        if (Array.isArray(ids)) {
          allChildIds.push(...ids)
        }
      })
      
      // Resolve children by componentId (stable) or id
      const resolvedChildren = allChildIds
        .map(id => componentMap.get(id) || componentMap.get(String(id)) || componentMap.get(String(id)))
        .filter((c): c is CanvasComponent => c !== undefined)

      if (resolvedChildren.length > 0) {
        const existingIds = new Set(comp.children?.map(c => c.id) || [])
        resolvedChildren.forEach(child => {
          if (!existingIds.has(child.id)) {
            comp.children = comp.children || []
            comp.children.push(child)
          }
        })
      }
    }
  })

  return rootComponents
}

// Flatten tree to flat list with parentId for saving
function flattenComponentsWithParentId(comps: CanvasComponent[], parentId: string | null = null): any[] {
  const result: any[] = []
  for (const c of comps) {
    const { children, ...rest } = c
    const item: any = { ...rest }
    if (parentId) {
      item.parentId = parentId
    }
    result.push(item)
    if (children && children.length > 0) {
      result.push(...flattenComponentsWithParentId(children, c.id))
    }
  }
  return result
}

// Flatten all nested containers
function flattenComponents(comps: CanvasComponent[]): CanvasComponent[] {
  const result: CanvasComponent[] = []
  for (const comp of comps) {
    const isContainer = comp.type === 'tabs' || comp.type === 'card' || comp.type === 'collapse'
    result.push({ 
      ...comp, 
      children: undefined,
      props: isContainer ? { ...comp.props, childrenMap: {} } : comp.props
    })
    if (comp.children && comp.children.length > 0) {
      result.push(...flattenComponents(comp.children))
    }
  }
  return result
}

// ============ Computed ============
// Force refresh selectedComponent by using a refresh trigger
const refreshTrigger = ref(0)
const selectedComponent = computed(() => {
  refreshTrigger.value // dependency
  return findComponent(components.value, selectedId.value)
})

function refreshSelectedComponent() {
  if (selectedId.value) {
    refreshTrigger.value++
  }
}

// ============ Actions ============
function toggleLeftTab(tab: 'layer' | 'components') {
  activeLeftTab.value = activeLeftTab.value === tab ? '' : tab
}

function handleSelectComponent(id: string) {
  selectedId.value = id
}

// 双击打开属性面板
function openPropsPanel() {
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

function handleDrop(data: { fromPalette: boolean, type?: string, label?: string, defaultProps?: Record<string, unknown> } | null) {
  console.log('[EditorPage] handleDrop called with:', data)
  if (data && data.fromPalette) {
    const newComponent: CanvasComponent = {
      type: data.type || 'text',
      label: data.label || '新组件',
      props: data.defaultProps || {},
    }
    components.value = [...components.value, newComponent]
    selectedId.value = newComponent.id
  }
}

function handleQuickAdd(comp: { type: string; label: string; defaultProps?: Record<string, any> }) {
  const newComponent: CanvasComponent = {
    type: comp.type,
    label: comp.label,
    props: comp.defaultProps || {},
  }
  components.value = [...components.value, newComponent]
  activeLeftTab.value = ''
}

// Recursively update parentId for all nested components (deep copy)
function updateParentIdDeep(comp: CanvasComponent, newParentId: string): CanvasComponent {
  return {
    ...comp,
    parentId: newParentId,
    children: comp.children?.map(child => updateParentIdDeep(child, comp.componentId || comp.id))
  }
}

function handleAddChildToContainer(containerId: string, childComponent: CanvasComponent, tabIndex?: number) {
  console.log('[handleAddChildToContainer] called:', { containerId, childComponentType: childComponent.type, childComponentId: childComponent.id, tabIndex })
  console.log('[handleAddChildToContainer] childComponent.children:', childComponent.children?.map(c => ({ id: c.id, type: c.type, childrenCount: c.children?.length })))
  // Deep copy and update parentId for all nested components (grandchildren included)
  const childWithParent = updateParentIdDeep(childComponent, containerId)
  const childKey = childWithParent.componentId || childWithParent.id
  
  components.value = updateComponentInTree(components.value, containerId, (comp: CanvasComponent) => {
    if (comp.type === 'tabs') {
      // Use tabIndex if valid (>=0), otherwise fall back to comp.props.activeTab, default to 0
      const rawActiveTab = comp.props.activeTab
      const effectiveTabIndex = (tabIndex !== undefined && tabIndex >= 0) ? tabIndex : (typeof rawActiveTab === 'number' && rawActiveTab >= 0 ? rawActiveTab : 0)
      const childrenMap = (comp.props.childrenMap as Record<string, (string | number)[]>) || {}
      const tabKey = String(effectiveTabIndex)
      const existingChildIds = childrenMap[tabKey] || []
      console.log('[Tabs] add-child:', {
        containerId: comp.id,
        compActiveTab: rawActiveTab,
        tabIndex,
        effectiveTabIndex,
        tabKey,
        childKey,
        childId: childWithParent.id,
        existingChildIds
      })
      return {
        ...comp,
        children: [...(comp.children || []), childWithParent],
        props: {
          ...comp.props,
          childrenMap: {
            ...childrenMap,
            [tabKey]: [...existingChildIds, childKey],
          },
        },
      }
    }
    return {
      ...comp,
      children: [...(comp.children || []), childWithParent],
    }
  })
  selectedId.value = childWithParent.id
  refreshSelectedComponent()
}

function handleRemoveChildFromContainer(containerId: string, childId: string) {
  components.value = updateComponentInTree(components.value, containerId, (comp: CanvasComponent) => {
    if (comp.type === 'tabs') {
      const childrenMap = { ...((comp.props.childrenMap as Record<string, string[]>) || {}) }
      for (const key of Object.keys(childrenMap)) {
        childrenMap[key] = childrenMap[key].filter(id => id !== childId)
      }
      return {
        ...comp,
        children: (comp.children || []).filter(c => c.id !== childId),
        props: { ...comp.props, childrenMap },
      }
    }
    return {
      ...comp,
      children: (comp.children || []).filter(c => c.id !== childId),
    }
  })
  if (selectedId.value === childId) {
    selectedId.value = null
  } else {
    // Refresh panel in case a nested child was removed from a selected container
    refreshSelectedComponent()
  }
}

function handleMoveChildToRoot(fromContainerId: string, childId: string, insertIndex: number, tabIndex?: number) {
  // Prevent dropping a container into itself or its descendant
  const isDescendant = (targetId: string, ancestorId: string): boolean => {
    if (targetId === ancestorId) return true
    const findComp = (comps: CanvasComponent[], id: string): CanvasComponent | null => {
      for (const c of comps) {
        if (c.id === id) return c
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
      if (comp.id === targetId) return true
      return comp.children?.some(checkDescendants) || false
    }
    return checkDescendants(ancestor)
  }

  // Find and extract child
  let childToMove: CanvasComponent | null = null
  
  const extractFromContainer = (comp: CanvasComponent): CanvasComponent | null => {
    if (comp.id === fromContainerId) {
      if (comp.type === 'tabs') {
        const childrenMap = { ...(comp.props.childrenMap as Record<string, string[]>) }
        for (const key of Object.keys(childrenMap)) {
          const ids = childrenMap[key]
          const idx = ids.findIndex(id => id === childId)
          if (idx !== -1) {
            // Find actual component in the full component tree
            const findComp = (comps: CanvasComponent[]): CanvasComponent | null => {
              for (const c of comps) {
                if (c.id === childId) return c
                if (c.children) {
                  const found = findComp(c.children)
                  if (found) return found
                }
              }
              return null
            }
            childToMove = findComp(components.value)
            if (childToMove) {
              childToMove = { ...childToMove, parentId: undefined }
            }
            // Remove from childrenMap AND from comp.children (both must be in sync)
            const filteredIds = ids.filter((_, i) => i !== idx)
            const filteredChildren = (comp.children || []).filter(c => c.id !== childId)
            return { ...comp, children: filteredChildren, props: { ...comp.props, childrenMap: { ...childrenMap, [key]: filteredIds } } }
          }
        }
      }
      const children = comp.children || []
      const idx = children.findIndex(c => c.id === childId)
      if (idx !== -1) {
        childToMove = { ...children[idx], parentId: undefined }
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

  // Prevent dropping a container into itself or its descendant
  // isDescendant(target, ancestor) returns true if target is a descendant of ancestor
  // Check if target container (fromContainerId) is inside the component being moved (childToMove)
  // If true, dropping would create a cycle: parent -> ... -> child -> parent
  const wouldCreateCycle = isDescendant(fromContainerId, childToMove.id) || fromContainerId === childToMove.id
  if (isContainerType(childToMove.type) && wouldCreateCycle) {
    console.warn('[EditorPage] Cannot drop container into itself or its descendant')
    return
  }

  // If tabIndex is provided, add to the target container's specific tab instead of root
  if (tabIndex !== undefined && tabIndex >= 0) {
    updated = updateComponentInTree(updated, fromContainerId, (comp: CanvasComponent) => {
      if (comp.type === 'tabs') {
        const childrenMap = (comp.props.childrenMap as Record<string, (string | number)[]>) || {}
        const targetTabKey = String(tabIndex)
        const existingChildIds = childrenMap[targetTabKey] || []
        const childKey = childToMove!.componentId || childToMove!.id
        return {
          ...comp,
          children: [...(comp.children || []), childToMove!],
          props: {
            ...comp.props,
            childrenMap: {
              ...childrenMap,
              [targetTabKey]: [...existingChildIds, childKey],
            },
          },
        }
      }
      return comp
    })
  } else {
    // Add to root level
    if (insertIndex < 0 || insertIndex >= updated.length) {
      updated = [...updated, childToMove]
    } else {
      updated.splice(insertIndex, 0, childToMove)
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
    // 扁平化组件树，保存 parentId 层级关系
    const flatComponents = flattenComponentsWithParentId(components.value)
    
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
    if (c.id === id) {
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
    if (c.id === id) return []
    if (c.children && c.children.length > 0) {
      return [{ ...c, children: removeComponentFromTree(c.children, id) }]
    }
    return [c]
  })
}

// Helper to update component props recursively
function updateComponentProps(components: CanvasComponent[], id: string, newProps: Record<string, any>): CanvasComponent[] {
  return components.map(c => {
    if (c.id === id) {
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
          //console.log('[EditorPage] raw pageComponents:', JSON.stringify(pageComponents))
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

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

/**
 * 加载时迁移 Tabs 组件从旧格式到新格式
 * 
 * 【函数作用】页面加载时自动将旧格式的 tabs 数据转换为新格式,确保数据一致性
 * 
 * 【参数】
 *   - comps: CanvasComponent[] - 组件树数组(可能包含嵌套的子组件)
 * 
 * 【返回值】迁移后的 CanvasComponent[] - 转换完成的组件树
 * 
 * 【核心逻辑】
 *   1. 递归遍历所有组件,检查是否为 tabs 类型
 *   2. 如果 tabs 是旧格式(string[]),转换为新格式 TabItem[]
 *   3. 从 childrenMap 中提取每个 tab 的子组件 ID 列表
 *   4. 删除 childrenMap 属性(新格式不再需要)
 *   5. 确保 activeTab 是字符串格式的 tab ID(如 "tab_0")
 * 
 * 【Tabs 格式区别】
 *   旧格式: tabs=string[], childrenMap={}, activeTab=number
 *   新格式: tabs=TabItem[], childrenMap 已删除, activeTab=string
 */
function migrateTabsComponents(comps: CanvasComponent[]): CanvasComponent[] {
  return comps.map(comp => {
    let migrated = { ...comp }
    if (migrated.type === 'tabs' && migrated.props?.tabs) {
      const tabs = migrated.props.tabs as UnifiedTabs
      if (isLegacyTabs(tabs)) {
        // 旧格式 string[] + childrenMap → 新格式 TabItem[]
        const childrenMap = (migrated.props.childrenMap as Record<string, (string | number)[]>) || {}
        const migratedTabs = tabs.map((label: string, index: number) => {
          const tabChildIds: (string | number)[] = childrenMap[String(index)] || []
          return {
            tabId: `tab_${index}`,
            label,
            params: {},
            children: tabChildIds,
            layout: { direction: 'column' as const, gap: 8, wrap: false }
          }
        })
        migrated.props = { ...migrated.props, tabs: migratedTabs, childrenMap: undefined }
      } else if (Array.isArray(tabs)) {
        // 新格式 TabItem[]：统一使用 tabId 字段，如果还是用的旧 id 字段则转换
        const newTabs = (tabs as any[]).map((tab: any, index: number) => {
          // 如果用的是旧 id 字段，转换为 tabId
          if ('id' in tab && !('tabId' in tab)) {
            return { ...tab, tabId: tab.id, id: undefined }
          }
          return tab
        })
        migrated.props = { ...migrated.props, tabs: newTabs, childrenMap: undefined }
      }
      // 无论新旧格式，activeTab 必须是 tab ID 字符串
      const rawActiveTab = migrated.props.activeTab
      if (typeof rawActiveTab === 'number') {
        migrated.props = { ...migrated.props, activeTab: `tab_${rawActiveTab}` }
      } else if (rawActiveTab === undefined || rawActiveTab === null) {
        migrated.props = { ...migrated.props, activeTab: 'tab_0' }
      }
    }
    if (migrated.children && migrated.children.length > 0) {
      migrated = { ...migrated, children: migrateTabsComponents(migrated.children) }
    }
    return migrated
  })
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
    const tabs = comp.props?.tabs as UnifiedTabs | undefined
    const childrenMap = comp.props?.childrenMap as Record<string, (string | number)[]> | undefined

    // 确定当前 tab 的索引
    const rawActiveTab = comp.props?.activeTab
    let tabIdx = 0
    if (rawActiveTab !== undefined && rawActiveTab !== null && tabs) {
      if (isLegacyTabs(tabs)) {
        tabIdx = Number(rawActiveTab) || 0
      } else {
        const idStr = String(rawActiveTab)
        const idx = tabs.findIndex((t: any) => t.tabId === idStr || t.id === idStr)
        tabIdx = idx >= 0 ? idx : 0
      }
    }

    // 旧格式：使用 childrenMap
    if (childrenMap && isLegacyTabs(tabs || [])) {
      const tabKey = String(tabIdx)
      const childIds = childrenMap[tabKey] || []
      return (comp.children || []).filter(c =>
        childIds.includes(c.componentId as any) || childIds.includes(c.id as any)
      )
    }

    // 新格式 TabItem[]：tab.children 存的是 componentId 数组
    if (tabs && !isLegacyTabs(tabs) && Array.isArray(tabs)) {
      const tabItem = (tabs as TabItem[])[tabIdx]
      if (tabItem?.children) {
        const childIds = (tabItem.children as (string | number)[]).map(id => String(id))
        return (comp.children || []).filter(c =>
          childIds.includes(String(c.componentId)) || childIds.includes(String(c.id))
        )
      }
      return []
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
    // 确保 componentId 存在：如果数据库没有，或等于 id（说明之前存的是 db id），则生成一个新的稳定 ID
    componentId: (c.componentId && c.componentId !== String(c.id))
      ? String(c.componentId)
      : `${c.type}_${c.id || Date.now()}`,
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
  // Note: Tabs with new format use TabItem.children instead, skip childrenMap handling for tabs
  componentMap.forEach(comp => {
    if (comp.type === 'tabs') return // Skip tabs (new format uses TabItem.children)
    
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

/**
 * 保存时扁平化组件树并转换格式
 * 
 * 【函数作用】将树形结构的组件转换为扁平的 parentId 层级列表,同时处理 tabs 格式转换
 * 
 * 【参数】
 *   - comps: CanvasComponent[] - 树形组件数组
 *   - parentId: string | null - 当前组件的父组件 ID(用于建立父子关系)
 * 
 * 【返回值】any[] - 扁平化后的组件数组,每个元素包含 parentId 字段表示父子关系
 * 
 * 【核心逻辑】
 *   1. 遍历组件树,提取每个组件(排除 children 数组)
 *   2. 为每个组件添加 parentId 字段表示所属容器
 *   3. 递归处理嵌套的子组件
 * 
 * 【Tabs 格式处理】
 *   - 旧格式(检测到 isLegacyTabs 时):
 *     * 将 tabs 从 string[] 转换为 TabItem[]
 *     * 将 childrenMap 中的 ID 列表迁移到 TabItem.children
 *     * 删除 childrenMap(新格式不再需要)
 *     * 递归时不展开 tab.children(避免重复)
 *   - 新格式:
 *     * 确保 activeTab 是字符串 tab ID
 *     * 清空 root children(子组件已内联在 TabItem.children)
 * 
 * 【新旧格式区别】
 *   旧格式保存: tabs=["标签1","标签2"], childrenMap={"0":[ids]}, activeTab=0
 *   新格式保存: tabs=[{tabId:"tab_0",label:"标签1",children:[ids]}], activeTab="tab_0"
 */
function flattenComponentsWithParentId(comps: CanvasComponent[], parentId: string | null = null): any[] {
  const result: any[] = []
  for (const c of comps) {
    const { children, ...rest } = c
    const item: any = { ...rest }
    // 新格式 tabs 不递归（子组件已内联在 tab.children）
    let skipRecursion = false

    // Tabs 组件：保存时将旧格式转换为新格式
    if (item.type === 'tabs' && item.props?.tabs) {
      const tabs = item.props.tabs
      if (isLegacyTabs(tabs)) {
        // 旧格式 string[] + childrenMap → 转换为新格式 TabItem[]（children 内联完整对象）
        const childrenMap = (item.props.childrenMap as Record<string, (string | number)[]>) || {}
        const migratedTabs = tabs.map((label: string, index: number) => {
          // childrenMap 存的就是 ID 数组，直接用
          const tabChildIds: (string | number)[] = childrenMap[String(index)] || []
          return {
            tabId: `tab_${index}`,
            label,
            params: {},
            children: tabChildIds, // ID 数组，与 ComponentRenderer.tabChildren 期望一致
            layout: { direction: 'column', gap: 8, wrap: false }
          }
        })
        item.props = { ...item.props, tabs: migratedTabs }
        delete item.props.childrenMap // childrenMap 不再需要
        // 递归时不展开 tab.children（已经是完整对象，会在各自的 FlattenComponentsWithParentId 调用中展开）
        result.push(item)
        continue
      }
      // 新格式 tabs：确保 activeTab 是 tab ID 字符串
      const rawActiveTab = item.props.activeTab
      if (typeof rawActiveTab === 'number') {
        item.props = { ...item.props, activeTab: `tab_${rawActiveTab}` }
      } else if (rawActiveTab === undefined || rawActiveTab === null) {
        item.props = { ...item.props, activeTab: 'tab_0' }
      }
      // 新格式：子组件已内联到 tab.children
      // 注意：tabs.children 里可能已经有从旧格式保留下来的子组件对象，
      // 需要把它们也扁平化添加进去（使用 tabs.id 作为 parentId）
      skipRecursion = true
    }

    if (parentId) {
      item.parentId = parentId
    }
    result.push(item)
    // skipRecursion 为 true 时不递归（子组件已内联在 tab.children）
    // 但 tabs.children 里的子组件需要单独添加（使用 tabs.id 作为 parentId）
    if (!skipRecursion && children && children.length > 0) {
      result.push(...flattenComponentsWithParentId(children, c.id))
    } else if (skipRecursion && children && children.length > 0) {
      // 新格式 tabs：子组件已内联在 tab.children，但仍需把 tabs.children 里的对象添加到结果
      result.push(...flattenComponentsWithParentId(children, item.id))
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
function toggleLeftTab(tab: 'layer' | 'components') {
  activeLeftTab.value = activeLeftTab.value === tab ? '' : tab
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
function handleAddChildToContainer(containerId: string, childComponent: CanvasComponent, tabIndex?: number) {
  // Find the container component to get its componentId
  const container = findComponent(components.value, containerId)
  const containerComponentId = container?.componentId || containerId
  // Deep copy and update parentId: parentId 统一指向 componentId（稳定 ID）
  const childWithParent = updateParentIdDeep(childComponent, containerComponentId)
  const childKey = String(childWithParent.componentId || childWithParent.id)

  // 从根数组中移除 child，同时更新容器的 children
  // 避免 child 同时存在于根数组和容器 children 中导致 buildComponentTree 时 componentMap key 冲突
  components.value = components.value
    .filter(c => String(c.id) !== String(childWithParent.id) && c.componentId !== childKey)
    .map(c => {
      const matchId = c.id === containerId || c.componentId === containerId
      if (!matchId) {
        if (c.children?.length) {
          const updatedChildren = c.children
            .filter(child => String(child.id) !== String(childWithParent.id) && child.componentId !== childKey)
            .map(child => {
              const childMatch = child.id === containerId || child.componentId === containerId
              if (child.id === containerId || child.componentId === containerId) {
                return updateContainerChildren(child, tabIndex, childKey, childWithParent)
              }
              return child
            })
          return { ...c, children: updatedChildren }
        }
        return c
      }
      return updateContainerChildren(c, tabIndex, childKey, childWithParent)
    })

  selectedId.value = childKey  // selectedId 统一存 componentId
  refreshSelectedComponent()
}

// 更新容器的 children（处理 tabs 等嵌套结构）
function updateContainerChildren(comp: CanvasComponent, tabIndex: number | undefined, childKey: string, childWithParent: CanvasComponent): CanvasComponent {
  if (comp.type === 'tabs') {
    const tabs = comp.props.tabs as UnifiedTabs
    if (tabs && !isLegacyTabs(tabs) && Array.isArray(tabs)) {
      const rawActiveTab = comp.props.activeTab
      const activeId = rawActiveTab !== undefined ? String(rawActiveTab) : ''
      const tabIdx = tabs.findIndex(t => t.tabId === activeId || t.id === activeId)
      const targetIdx = (tabIndex !== undefined && tabIndex >= 0) ? tabIndex : (tabIdx >= 0 ? tabIdx : 0)
      const newTabs = tabs.map((tab, i) => {
        if (i !== targetIdx) return tab
        return { ...tab, children: [...(tab.children || []), childKey] }
      })
      return { ...comp, children: [...(comp.children || []), childWithParent], props: { ...comp.props, tabs: newTabs } }
    }
    // 旧格式
    const childrenMap = { ...(comp.props.childrenMap as Record<string, (string | number)[]>) }
    const tabKey = String(tabIndex ?? 0)
    childrenMap[tabKey] = [...(childrenMap[tabKey] || []), childKey]
    return { ...comp, children: [...(comp.children || []), childWithParent], props: { ...comp.props, childrenMap } }
  }
  return { ...comp, children: [...(comp.children || []), childWithParent] }
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
 * 
 * 【核心逻辑】
 *   1. 查找子组件的 componentId(用于从 tabs 的 children 引用中移除)
 *   2. 递归更新容器组件,移除子组件
 *   3. 对于 tabs 组件,从对应 TabItem.children 或 childrenMap 中移除引用
 *   4. 同时从容器的 children 数组中移除子组件对象
 * 
 * 【Tabs 格式处理】
 *   - 新格式(TabItem[]):
 *     * 从所有 TabItem.children 中过滤掉该子组件的 ID(使用 componentId 匹配)
 *     * 因为组件可能被移动过,所以需要检查所有 tab 的 children 数组
 *   - 旧格式(childrenMap):
 *     * 遍历 childrenMap 的所有键,过滤掉该子组件的 ID
 * 
 * 【新旧格式区别】
 *   新格式: tabs[i].children = tabs[i].children.filter(id => id !== childCompId)
 *   旧格式: childrenMap[key] = childrenMap[key].filter(id => id !== childCompId)
 */
function handleRemoveChildFromContainer(containerId: string, childId: string) {
  console.log('[DEBUG] handleRemoveChildFromContainer called:', containerId, childId)
  if (!confirm('确定要移除这个组件吗？')) return

  // 找到被移除组件的 componentId（用于从 tab.children 中移除）
  const childComp = findComponent(components.value, childId)
  const childCompId = childComp?.componentId ? String(childComp.componentId) : String(childId)

  components.value = updateComponentInTree(components.value, containerId, (comp: CanvasComponent) => {
    if (comp.type === 'tabs') {
      const tabs = comp.props.tabs as UnifiedTabs
      if (tabs && !isLegacyTabs(tabs) && Array.isArray(tabs)) {
        // 新格式 TabItem[]：children 是 componentId 数组，从每个 tab.children 中移除
        const newTabs = tabs.map(tab => ({
          ...tab,
          children: (tab.children || []).filter((cid: any) => String(cid) !== childCompId)
        }))
        return {
          ...comp,
          children: (comp.children || []).filter(c => String(c.id) !== String(childId) && c.componentId !== childCompId),
          props: { ...comp.props, tabs: newTabs }
        }
      }
      // 旧格式：使用 childrenMap
      const childrenMap = { ...((comp.props.childrenMap as Record<string, string[]>) || {}) }
      for (const key of Object.keys(childrenMap)) {
        childrenMap[key] = childrenMap[key].filter(id => String(id) !== childCompId)
      }
      return {
        ...comp,
        children: (comp.children || []).filter(c => String(c.id) !== String(childId) && c.componentId !== childCompId),
        props: { ...comp.props, childrenMap },
      }
    }
    return {
      ...comp,
      children: (comp.children || []).filter(c => String(c.id) !== String(childId) && c.componentId !== childCompId),
    }
  })
  if (String(selectedId.value) === String(childId)) {
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
    // Match by id or componentId
    if (comp.id === fromContainerId || comp.componentId === fromContainerId) {
      if (comp.type === 'tabs') {
        const tabs = comp.props.tabs as UnifiedTabs
        if (tabs && !isLegacyTabs(tabs) && Array.isArray(tabs)) {
          // 新格式 TabItem[]：children 存的是 componentId，从对应 tab.children 中移除
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
        // 旧格式：使用 childrenMap
        const childrenMap = { ...(comp.props.childrenMap as Record<string, string[]>) }
        for (const key of Object.keys(childrenMap)) {
          const ids = childrenMap[key]
          const idx = ids.findIndex(id => String(id) === childCompId)
          if (idx !== -1) {
            childToMove = childComp ? { ...childComp, parentId: undefined } : null
            const filteredIds = ids.filter((_, i) => i !== idx)
            const filteredChildren = (comp.children || []).filter(c => String(c.id) !== String(childId) && c.componentId !== childCompId)
            return { ...comp, children: filteredChildren, props: { ...comp.props, childrenMap: { ...childrenMap, [key]: filteredIds } } }
          }
        }
      }
      const children = comp.children || []
      const idx = children.findIndex(c => String(c.id) === String(childId))
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
  // Check if container's componentId matches child's id or componentId
  const wouldCreateCycle = isDescendant(fromContainerId, childToMove.id) || isDescendant(fromContainerId, childToMove.componentId) || fromContainerId === childToMove.id || fromContainerId === childToMove.componentId
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
          //console.log('[EditorPage] raw pageComponents:', JSON.stringify(pageComponents))
          let tree = buildComponentTree(pageComponents)
          // 加载时自动将 tabs 旧格式迁移为新格式
          tree = migrateTabsComponents(tree)
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

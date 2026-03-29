<template>
  <div class="h-screen flex flex-col bg-[var(--bg-tertiary)] dark:bg-gray-900">
    <!-- Header -->
    <div class="h-14 bg-[var(--bg-secondary)] dark:bg-gray-800 border-b border-[var(--border-light)] dark:border-gray-700 flex items-center px-4 gap-4">
      <h1 class="text-lg font-medium text-[var(--text-primary)] dark:text-white">
        {{ isNewPage ? '新建页面' : '页面编辑器' }}
      </h1>
      <input
        type="text"
        v-model="pageName"
        placeholder="输入页面名称"
        class="px-3 py-1.5 border border-[var(--border)] dark:border-gray-600 rounded text-sm w-48 bg-[var(--input-bg)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
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
          size="small"
          :disabled="!selectedId"
          @click="showPropsModal = true"
        >
          <Settings2 class="w-4 h-4 mr-1" />属性
        </el-button>
      </div>
      
      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-[var(--text-muted)]">{{ components.length }} 个组件</span>
        <el-button type="primary" size="small" :loading="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </el-button>
        <el-button type="success" size="small" @click="handlePreview" :disabled="!pageCode && !isNewPage">
          预览
        </el-button>
        <el-button size="small" @click="handleClear">
          清空
        </el-button>
        <el-button size="small" @click="goToList">
          返回列表
        </el-button>
        <el-button type="warning" size="small" @click="handleFlattenComponents">
          拆散
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 浮动面板 -->
      <div 
        v-if="activeLeftTab"
        class="absolute left-4 top-4 z-40 w-72 h-[calc(100vh-140px)] bg-[var(--bg-secondary)] dark:bg-gray-800 border border-[var(--border-light)] dark:border-gray-700 rounded-lg shadow-xl flex flex-col"
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

      <!-- 属性配置弹窗 -->
      <div 
        v-if="showPropsModal && selectedComponent"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showPropsModal = false"
      >
        <div class="bg-[var(--bg-secondary)] dark:bg-gray-800 rounded-lg shadow-xl w-[900px] max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] dark:border-gray-700">
            <h3 class="font-medium text-[var(--text-primary)] dark:text-white">
              属性配置 - {{ selectedComponent.label }}
            </h3>
            <el-button text @click="showPropsModal = false">
              <X class="w-5 h-5" />
            </el-button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <PropertyPanel
              :selected-component="selectedComponent"
              :components="components"
              @update-props="handleUpdateProps"
              @move-to-container="handleMoveToContainer"
              @move-out-of-container="handleMoveOutOfContainer"
              @delete-component="handleDelete"
              @select-component="handleSelectComponent"
            />
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <DropCanvas
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
import type { CanvasComponent } from './types'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

// ============ State ============
const components = ref<CanvasComponent[]>([])
const selectedId = ref<string | null>(null)
const showPropsModal = ref(false)
const pageName = ref('未命名页面')
const pageCode = ref('')
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
  const res = await api.post('/page/save', data)
  return res.data
}

// Re-export API functions for PropertyPanel
export { getDataSources, getFeatures, getFeatureDetail }

// ============ Helpers ============
function generateId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
    componentMap.set(c.id, comp)
  })

  // Then build parent-child relationships
  flatComponents.forEach(c => {
    const comp = componentMap.get(c.id)!
    const parentId = c.parentId
    if (parentId) {
      const parent = componentMap.get(parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(comp)
      } else {
        rootComponents.push(comp)
      }
    } else {
      rootComponents.push(comp)
    }
  })

  // Fix childrenMap: resolve childrenMap IDs to actual component objects
  componentMap.forEach(comp => {
    const childrenMap = comp.props?.childrenMap as Record<string, string[]> | undefined
    if (childrenMap && typeof childrenMap === 'object') {
      const allChildIds: string[] = []
      Object.values(childrenMap).forEach(ids => {
        if (Array.isArray(ids)) {
          allChildIds.push(...ids)
        }
      })
      
      const resolvedChildren = allChildIds
        .map(id => componentMap.get(id))
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
const selectedComponent = computed(() => findComponent(components.value, selectedId.value))

// ============ Actions ============
function toggleLeftTab(tab: 'layer' | 'components') {
  activeLeftTab.value = activeLeftTab.value === tab ? '' : tab
}

function handleSelectComponent(id: string) {
  selectedId.value = id
  showPropsModal.value = true
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
    showPropsModal.value = false
  }
}

function handleDrop(data: { fromPalette: boolean, type?: string, label?: string, defaultProps?: Record<string, unknown> } | null) {
  console.log('[EditorPage] handleDrop called with:', data)
  if (data && data.fromPalette) {
    const newComponent: CanvasComponent = {
      id: generateId(),
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
    id: generateId(),
    type: comp.type,
    label: comp.label,
    props: comp.defaultProps || {},
  }
  components.value = [...components.value, newComponent]
  activeLeftTab.value = ''
}

function handleAddChildToContainer(containerId: string, childComponent: CanvasComponent, tabIndex?: number) {
  components.value = updateComponentInTree(components.value, containerId, (comp: CanvasComponent) => {
    if (comp.type === 'tabs') {
      const activeTab = tabIndex !== undefined ? tabIndex : (comp.props.activeTab as number || 0)
      const childrenMap = (comp.props.childrenMap as Record<string, string[]>) || {}
      const tabKey = String(activeTab)
      const existingChildIds = childrenMap[tabKey] || []
      return {
        ...comp,
        children: [...(comp.children || []), childComponent],
        props: {
          ...comp.props,
          childrenMap: {
            ...childrenMap,
            [tabKey]: [...existingChildIds, childComponent.id],
          },
        },
      }
    }
    return {
      ...comp,
      children: [...(comp.children || []), childComponent],
    }
  })
  selectedId.value = childComponent.id
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
  }
}

function handleMoveChildToRoot(fromContainerId: string, childId: string, insertIndex: number) {
  // Find and extract child
  let childToMove: CanvasComponent | null = null
  
  const extractFromContainer = (comp: CanvasComponent): CanvasComponent | null => {
    if (comp.id === fromContainerId) {
      if (comp.type === 'tabs') {
        const childrenMap = comp.props.childrenMap as Record<string, string[]> || {}
        for (const key of Object.keys(childrenMap)) {
          const ids = childrenMap[key]
          const idx = ids.findIndex(id => id === childId)
          if (idx !== -1) {
            // Find actual component
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
            childrenMap[key] = ids.filter((_, i) => i !== idx)
            return { ...comp, props: { ...comp.props, childrenMap } }
          }
        }
      }
      const children = comp.children || []
      const idx = children.findIndex(c => c.id === childId)
      if (idx !== -1) {
        childToMove = children[idx]
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
  if (insertIndex < 0 || insertIndex >= updated.length) {
    updated = [...updated, childToMove]
  } else {
    updated.splice(insertIndex, 0, childToMove)
  }
  components.value = updated
  selectedId.value = childId
}

function handleMoveToContainer(containerId: string, componentId: string, tabIndex?: number) {
  const comp = findComponent(components.value, componentId)
  if (!comp) return
  const parentId = findParentContainerId(components.value, componentId)
  if (parentId) {
    handleRemoveChildFromContainer(parentId, componentId)
  } else {
    components.value = components.value.filter(c => c.id !== componentId)
  }
  handleAddChildToContainer(containerId, comp, tabIndex)
}

function handleMoveOutOfContainer(containerId: string, componentId: string) {
  handleMoveChildToRoot(containerId, componentId, -1)
}

function handleResize(id: string, width: number, height: number) {
  components.value = updateComponentProps(components.value, id, { width, height })
}

function handleUpdateProps(newProps: Record<string, any>) {
  if (selectedId.value) {
    components.value = updateComponentProps(components.value, selectedId.value, newProps)
  }
}

function handleUpdatePropsDirect(id: string, newProps: Record<string, any>) {
  components.value = updateComponentProps(components.value, id, newProps)
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
  if (isNewPage.value || !pageCode.value) {
    ElMessage.info('请先保存页面后再预览')
    return
  }
  window.open(`/#/render/${pageCode.value}`, '_blank')
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

    if (result?.code === 1) {
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
          const tree = buildComponentTree(pageComponents)
          console.log('[EditorPage] built tree:', tree)
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
  // Escape to close modal
  if (e.key === 'Escape' && showPropsModal.value) {
    showPropsModal.value = false
  }
}

function isInputFocused(): boolean {
  const active = document.activeElement
  return active instanceof HTMLInputElement ||
         active instanceof HTMLTextAreaElement ||
         active instanceof HTMLSelectElement
}
</script>

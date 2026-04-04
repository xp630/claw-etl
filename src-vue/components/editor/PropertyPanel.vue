<template>
  <div class="property-panel-container h-full flex flex-col">
    <!-- Header - 匹配 DataPanel 风格 -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)] shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-[var(--text-primary)]">属性配置</span>
        <span v-if="selectedComponent" class="text-xs text-[var(--text-muted)]">
          — {{ selectedComponent.label || selectedComponent.type }}
        </span>
      </div>
      <button
        class="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        @click="handleClose"
      >
        ×
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
        <div v-if="!selectedComponent" class="empty-state">
          <p>点击组件进行配置</p>
        </div>
        
        <div v-else class="component-props p-4">
          <!-- 面包屑导航 -->
          <div class="prop-section">
            <div class="breadcrumb">
              <span
                v-for="(item, index) in breadcrumbPath"
                :key="item.componentId"
                class="breadcrumb-item"
              >
                <span
                  v-if="index > 0"
                  class="breadcrumb-separator"
                > › </span>
                <span
                  :class="{ 'is-current': index === breadcrumbPath.length - 1 }"
                  @click="index < breadcrumbPath.length - 1 && handleTreeSelect(item.componentId)"
                >
                  {{ item.label || item.type }}
                </span>
              </span>
            </div>
          </div>

      <!-- 基本信息 -->
      <div class="prop-section">
        <h4 class="prop-section-title">基本信息</h4>
        
        <div class="prop-item">
          <label>组件类型</label>
          <span class="prop-value type-badge">{{ selectedComponent.type }}</span>
        </div>
        
        <div class="prop-item">
          <label>组件标签</label>
          <input
            :value="selectedComponent.label"
            type="text"
            class="prop-input"
            :class="{ 'is-highlighted': highlightedField === 'label' }"
            @input="updateLabel(($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="prop-item">
          <label>组件ID</label>
          <input
            :value="selectedComponent.componentId || selectedComponent.id"
            type="text"
            class="prop-input bg-[var(--bg-secondary)]"
            readonly
            title="组件唯一标识，用于内部引用"
          />
        </div>
      </div>

      <!-- 表格属性 -->
      <TablePropsPanel
        v-if="selectedComponent.type === 'table'"
        :selected-component="selectedComponent"
        :update-prop="updateProp"
      />

      <!-- 通用属性 - Schema 驱动 -->
      <div class="prop-section">
        <h4 class="prop-section-title">通用属性</h4>
        
        <DynamicPropEditor
          v-if="componentSchema"
          :schema="componentSchema"
          :props="selectedComponent.props"
          @update="handleDynamicUpdate"
        />
        
        <!-- Fallback: 如果没有 Schema，显示基于 hasProp 的旧方式 -->
        <template v-else>
          <div v-if="hasProp('placeholder')" class="prop-item">
            <label>占位符</label>
            <input
              :value="selectedComponent.props.placeholder"
              type="text"
              class="prop-input"
              @input="updateProp('placeholder', ($event.target as HTMLInputElement).value)"
            />
          </div>
          
          <div v-if="hasProp('options')" class="prop-item">
            <label>选项（逗号分隔）</label>
            <input
              :value="(selectedComponent.props.options as string[])?.join(', ')"
              type="text"
              class="prop-input"
              @input="handleOptionsInput($event)"
            />
          </div>
          
          <div v-if="hasProp('value')" class="prop-item">
            <label>默认值</label>
            <input
              v-if="selectedComponent.type === 'slider'"
              :value="Number(selectedComponent.props.value)"
              type="range"
              min="0"
              max="100"
              class="prop-range"
              @input="updateProp('value', Number(($event.target as HTMLInputElement).value))"
            />
            <input
              v-else-if="selectedComponent.type === 'switch'"
              :value="selectedComponent.props.value"
              type="checkbox"
              class="prop-checkbox"
              @change="updateProp('value', ($event.target as HTMLInputElement).checked)"
            />
            <input
              v-else
              :value="selectedComponent.props.value"
              type="text"
              class="prop-input"
              @input="updateProp('value', ($event.target as HTMLInputElement).value)"
            />
          </div>
          
          <div v-if="hasProp('text')" class="prop-item">
            <label>显示文本</label>
            <input
              :value="selectedComponent.props.text"
              type="text"
              class="prop-input"
              @input="updateProp('text', ($event.target as HTMLInputElement).value)"
            />
          </div>
          
          <div v-if="hasProp('content')" class="prop-item">
            <label>文本内容</label>
            <textarea
              :value="selectedComponent.props.content"
              class="prop-textarea"
              rows="3"
              @input="updateProp('content', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </template>
      </div>
      
      <!-- tabs 配置 (tabs) - 扁平化重构 -->
      <div v-if="hasProp('tabs')" class="prop-section">
        <div class="flex items-center justify-between mb-2">
          <h4 class="prop-section-title mb-0">标签页</h4>
          <button
            type="button"
            class="text-xs text-[var(--accent)] hover:underline"
            @click="addTab"
          >
            + 添加
          </button>
        </div>
        
        <!-- el-tabs 可视化切换 -->
        <el-tabs
          v-if="editableTabs.length > 0"
          v-model="activeTabIndex"
          type="card"
          class="tabs-flat-tabs"
        >
          <el-tab-pane
            v-for="(tab, index) in editableTabs"
            :key="index"
            :label="tab.label || `标签${index + 1}`"
            :name="index"
          >
            <div class="tab-config-content">
              <!-- Tab 标签名 -->
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs text-[var(--text-muted)] shrink-0">标签名:</span>
                <input
                  :value="tab.label"
                  type="text"
                  class="flex-1 px-2 py-1 border border-[var(--border)] rounded text-xs"
                  placeholder="输入标签名"
                  @input="updateTabLabel(index, ($event.target as HTMLInputElement).value)"
                />
                <button
                  type="button"
                  class="px-2 py-1 text-xs text-[var(--danger)] hover:bg-red-50 rounded"
                  @click="removeTab(index)"
                >
                  删除
                </button>
              </div>
              
              <!-- 布局配置 - 合并为一行 -->
              <div class="bg-[var(--bg-hover-light)] rounded p-2 mb-3">
                <div class="text-xs text-[var(--text-muted)] mb-2 font-medium">布局设置</div>
                <div class="flex flex-wrap items-center gap-2">
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-[var(--text-muted)]">方向:</span>
                    <select
                      :value="tab.layout?.direction || 'column'"
                      class="px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                      @change="updateTabLayout(index, 'direction', ($event.target as HTMLSelectElement).value as 'row' | 'column')"
                    >
                      <option value="column">纵向</option>
                      <option value="row">横向</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-[var(--text-muted)]">间距:</span>
                    <input
                      :value="tab.layout?.gap ?? 8"
                      type="number"
                      class="w-14 px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                      min="0"
                      @input="updateTabLayout(index, 'gap', Number(($event.target as HTMLInputElement).value))"
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-[var(--text-muted)]">对齐:</span>
                    <select
                      :value="tab.layout?.alignItems || 'stretch'"
                      class="px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                      @change="updateTabLayout(index, 'alignItems', ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="start">起始</option>
                      <option value="center">居中</option>
                      <option value="end">末尾</option>
                      <option value="stretch">拉伸</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-[var(--text-muted)]">换行:</span>
                    <input
                      type="checkbox"
                      :checked="tab.layout?.wrap || false"
                      class="w-3 h-3"
                      @change="updateTabLayout(index, 'wrap', ($event.target as HTMLInputElement).checked)"
                    />
                  </div>
                </div>
              </div>
              
              <!-- 参数配置 - key-value 列表 -->
              <div class="bg-[var(--bg-hover-light)] rounded p-2">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-[var(--text-muted)] font-medium">参数 (Key-Value)</span>
                  <button
                    type="button"
                    class="text-xs text-[var(--accent)] hover:underline"
                    @click="addTabParam(index)"
                  >
                    + 添加参数
                  </button>
                </div>
                
                <!-- 参数列表 -->
                <div class="space-y-1">
                  <div
                    v-for="(paramVal, paramKey) in (tab.params || {})"
                    :key="paramKey"
                    class="flex items-center gap-1"
                  >
                    <input
                      :value="paramKey"
                      type="text"
                      class="w-20 px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                      placeholder="key"
                      @change="updateTabParamKey(index, String(paramKey), ($event.target as HTMLInputElement).value)"
                    />
                    <span class="text-xs text-[var(--text-muted)]">=</span>
                    <input
                      :value="paramVal"
                      type="text"
                      class="flex-1 px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                      placeholder="value"
                      @input="updateTabParam(index, String(paramKey), ($event.target as HTMLInputElement).value)"
                    />
                    <button
                      type="button"
                      class="px-1 text-[var(--danger)] hover:text-red-400 text-xs"
                      @click="removeTabParam(index, String(paramKey))"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <!-- 空状态 -->
                <div v-if="!tab.params || Object.keys(tab.params).length === 0" class="text-xs text-[var(--text-muted)] italic py-1">
                  暂无参数，点击上方添加
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        
        <!-- 无标签页时 -->
        <div v-else class="text-xs text-[var(--text-muted)] text-center py-4">
          暂无标签页，点击上方添加
        </div>
      </div>

      <!-- 样式属性 -->
      <div class="prop-section">
        <h4 class="prop-section-title">样式</h4>
        
        <div class="prop-item">
          <label>宽度</label>
          <input
            :value="selectedComponent.props.width"
            type="text"
            class="prop-input"
            placeholder="如: 100%, 200px, auto"
            @input="updateProp('width', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <div class="prop-item">
          <label>高度</label>
          <input
            :value="selectedComponent.props.height"
            type="text"
            class="prop-input"
            placeholder="如: 100%, 50px, auto"
            @input="updateProp('height', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <div class="prop-item">
          <label>自定义Class</label>
          <input
            :value="selectedComponent.props.customClass"
            type="text"
            class="prop-input"
            placeholder="额外的CSS类名"
            @input="updateProp('customClass', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- 容器操作 -->
      <div class="prop-section">
        <h4 class="prop-section-title">容器操作</h4>
        
        <div class="prop-item">
          <label>移动到容器</label>
          <select class="prop-input" @change="handleMoveToContainerAction($event)">
            <option value="">-- 选择容器 --</option>
            <option
              v-for="container in containerComponents"
              :key="container.id"
              :value="container.id"
            >
              {{ container.label }} ({{ container.type }})
            </option>
          </select>
        </div>

        <div v-if="isInsideContainer" class="prop-item">
          <button class="prop-button prop-button--secondary" @click="handleMoveOutOfContainer">
            从容器移出
          </button>
        </div>

        <div class="prop-item">
          <button class="prop-button prop-button--danger" @click="handleDeleteComponent">
            删除组件
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { CanvasComponent, TabItem } from '@/pages/editor/types'
import TablePropsPanel from './TablePropsPanel.vue'
import TreeNode from './TreeNode.vue'

interface Props {
  modelValue: boolean
  selectedComponent: CanvasComponent | null
  components: CanvasComponent[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  'update-props': [props: Record<string, unknown>]
  'update-label': [label: string]
  'move-to-container': [containerId: string, componentId: string, tabIndex?: number]
  'move-out-of-container': [containerId: string, componentId: string]
  'delete-component': [id: string]
  'select-component': [id: string | null]
  'remove-tab': [tabIndex: number, tabChildren: (string | number)[]]
}>()

// 关闭抽屉
function handleClose() {
  emit('update:modelValue', false)
}

// 组件结构树
const componentTreeExpanded = ref(true)

// 字段高亮状态（修改时闪烁高亮）
const highlightedField = ref<string | null>(null)

// 递归构建组件树节点
interface TreeNodeData {
  componentId: string
  id: string
  type: string
  label: string
  children?: TreeNodeData[]
  tabChildren?: TreeNodeData[][]
  isExpanded?: boolean
}

function buildComponentTree(comps: CanvasComponent[]): TreeNodeData[] {
  return comps.map(c => {
    const node: TreeNodeData = {
      componentId: c.componentId || c.id,
      id: c.id,
      type: c.type,
      label: c.label || c.type,
    }
    
    // 处理 tabs 的子组件
    if (c.type === 'tabs' && c.props?.tabs) {
      const tabs = c.props.tabs as any[]
      node.tabChildren = tabs.map((tab: any) => {
        if (tab.children && Array.isArray(tab.children)) {
          // tab.children 是 componentId 数组，需要从 allComponents 中查找
          return tab.children.map((childId: string) => {
            const childComp = findComponentById(childId)
            if (childComp) {
              return buildSingleNode(childComp)
            }
            return null
          }).filter(Boolean)
        }
        return []
      })
    }
    
    // 处理普通 children
    if (c.children && c.children.length > 0) {
      node.children = buildComponentTree(c.children)
    }
    
    return node
  })
}

function buildSingleNode(c: CanvasComponent): TreeNodeData {
  const node: TreeNodeData = {
    componentId: c.componentId || c.id,
    id: c.id,
    type: c.type,
    label: c.label || c.type,
  }
  if (c.children && c.children.length > 0) {
    node.children = buildComponentTree(c.children)
  }
  return node
}

function findComponentById(id: string): CanvasComponent | null {
  const find = (comps: CanvasComponent[]): CanvasComponent | null => {
    for (const c of comps) {
      if (c.componentId === id || c.id === id) return c
      if (c.children) {
        const found = find(c.children)
        if (found) return found
      }
    }
    return null
  }
  return find(props.components)
}

// 面包屑路径：从根到当前选中组件的路径
interface BreadcrumbItem {
  componentId: string
  id: string
  type: string
  label: string
}

// Dynamic schema for component
import { componentSchemas, getComponentSchema } from '@/pages/editor/component-schema'
import DynamicPropEditor from './DynamicPropEditor.vue'

const componentSchema = computed(() => {
  if (!props.selectedComponent) return null
  return getComponentSchema(props.selectedComponent.type)
})

function handleDynamicUpdate(propName: string, value: unknown) {
  updateProp(propName, value)
}

const breadcrumbPath = computed<BreadcrumbItem[]>(() => {
  if (!props.selectedComponent) return []
  
  const path: BreadcrumbItem[] = []
  const selectedId = props.selectedComponent.componentId || props.selectedComponent.id
  
  // 递归查找路径
  const findPath = (comps: CanvasComponent[], targetId: string): boolean => {
    for (const c of comps) {
      const cid = c.componentId || c.id
      
      // 选中的是当前组件
      if (cid === targetId) {
        path.push({ componentId: cid, id: c.id, type: c.type, label: c.label || c.type })
        return true
      }
      
      // 检查 tabs 子组件
      if (c.type === 'tabs' && c.props?.tabs) {
        const tabs = c.props.tabs as any[]
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i]
          if (tab.children && Array.isArray(tab.children)) {
            for (const childId of tab.children) {
              const childComp = findComponentById(String(childId))
              if (childComp) {
                const childCid = childComp.componentId || childComp.id
                if (childCid === targetId) {
                  // 找到目标：加入 Tabs -> Tab -> Child
                  path.push({ componentId: cid, id: c.id, type: c.type, label: c.label || c.type })
                  path.push({ componentId: tab.tabId, id: tab.tabId, type: 'tab', label: tab.label || `标签${i + 1}` })
                  path.push({ componentId: childCid, id: childComp.id, type: childComp.type, label: childComp.label || childComp.type })
                  return true
                }
              }
            }
          }
        }
      }
      
      // 检查普通 children
      if (c.children && c.children.length > 0) {
        if (findPath(c.children, targetId)) {
          path.unshift({ componentId: cid, id: c.id, type: c.type, label: c.label || c.type })
          return true
        }
      }
    }
    return false
  }
  
  findPath(props.components, selectedId)
  return path
})

const componentTree = computed(() => buildComponentTree(props.components))

function toggleComponentTree() {
  componentTreeExpanded.value = !componentTreeExpanded.value
}

function handleTreeSelect(componentId: string) {
  emit('select-component', componentId)
}

// 展开/折叠节点
function toggleNode(node: TreeNodeData) {
  node.isExpanded = !node.isExpanded
}

// 获取所有容器类型组件（card, tabs, collapse）
const containerComponents = computed(() => {
  const containers: CanvasComponent[] = []
  const findContainers = (comps: CanvasComponent[]) => {
    for (const c of comps) {
      if (['card', 'tabs', 'collapse'].includes(c.type)) {
        containers.push(c)
      }
      if (c.children) {
        findContainers(c.children)
      }
    }
  }
  findContainers(props.components)
  return containers
})

// 检查当前组件是否在容器内
const isInsideContainer = computed(() => {
  return parentContainerId.value !== null
})

// 获取当前组件的父容器ID
const parentContainerId = computed(() => {
  if (!props.selectedComponent) return null
  const findParent = (comps: CanvasComponent[], targetId: string): CanvasComponent | null => {
    for (const c of comps) {
      if (c.children) {
        for (const child of c.children) {
          if (child.id === targetId) return c
        }
        const parent = findParent(c.children, targetId)
        if (parent) return parent
      }
    }
    return null
  }
  const parent = findParent(props.components, props.selectedComponent.id)
  return parent ? parent.id : null
})

// 处理移动到容器（select change事件）
async function handleMoveToContainerAction(e: Event) {
  const containerId = (e.target as HTMLSelectElement).value
  console.log('[PropertyPanel] handleMoveToContainerAction:', containerId, props.selectedComponent?.id)
  if (containerId && props.selectedComponent) {
    const targetContainer = containerComponents.value.find(c => c.id === containerId)
    // If target is tabs, ask user which tab to move to
    if (targetContainer?.type === 'tabs') {
      const tabs = targetContainer.props?.tabs as TabItem[] || []
      const tabCount = tabs.length
      const tabOptionsHtml = tabs.map((t, i) =>
        `<option value="${i}">${t.label || `标签${i + 1}`}</option>`
      ).join('')
      const { ElMessageBox } = await import('element-plus')
      try {
        await ElMessageBox.confirm(
          `<p style="margin:0 0 12px 0;font-size:13px;color:var(--text-secondary)">目标容器是 <strong>${targetContainer.label || targetContainer.type}</strong>，共 ${tabCount} 个标签页，请选择目标标签页：</p>
          <select id="tab-select-target" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:4px;font-size:13px;background:var(--input-bg)">
            ${tabOptionsHtml}
          </select>`,
          '移动到标签页容器',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            dangerouslyUseHTMLString: true,
            type: 'info',
          }
        )
        const selectEl = document.getElementById('tab-select-target')
        const tabIndex = selectEl ? parseInt((selectEl as HTMLSelectElement).value, 10) : 0
        if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= tabCount) {
          ElMessage.error('无效的标签页，操作已取消。')
          return
        }
        emit('move-to-container', containerId, props.selectedComponent.id, tabIndex)
      } catch {
        // 用户取消
      }
    } else {
      emit('move-to-container', containerId, props.selectedComponent.id)
    }
    ;(e.target as HTMLSelectElement).value = ''
  }
}

// Tabs 操作 - 新格式
const editableTabs = computed<TabItem[]>(() => {
  const tabs = props.selectedComponent?.props?.tabs
  if (!tabs) return []
  return tabs as TabItem[]
})

function addTab() {
  const tabs = editableTabs.value
  const newTab: TabItem = {
    id: `tab_${tabs.length}`,
    label: `标签${tabs.length + 1}`,
    params: {},
    children: [],
    layout: { direction: 'column', gap: 8, wrap: false }
  }
  updateProp('tabs', [...tabs, newTab])
}

function updateTabLabel(index: number, label: string) {
  const tabs = editableTabs.value.map((t, i) => i === index ? { ...t, label } : t)
  updateProp('tabs', tabs)
}

function updateTabLayout(index: number, key: string, value: any) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    return { ...t, layout: { ...t.layout, [key]: value } }
  })
  updateProp('tabs', tabs)
}

async function removeTab(index: number) {
  const tab = editableTabs.value[index]
  if (!tab) return
  
  // 检查该 tab 是否包含嵌套组件
  const tabChildren = tab.children || []
  if (tabChildren.length > 0) {
    const { ElMessageBox } = await import('element-plus')
    try {
      await ElMessageBox.confirm(
        `该标签页中包含 ${tabChildren.length} 个嵌套组件，删除标签页将一并删除这些组件。\n\n确定要删除吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      return
    }
    // 通知父组件删除 tab 及其嵌套组件
    emit('remove-tab', index, tabChildren)
    return
  }
  
  const tabs = editableTabs.value.filter((_, i) => i !== index)
  updateProp('tabs', tabs)
  // 如果当前激活的 tab 被删除，调整 activeTab
  const activeTab = props.selectedComponent?.props.activeTab
  if (activeTab !== undefined && typeof activeTab === 'string') {
    const newActiveTab = tabs[Math.min(Number(activeTab.replace('tab_', '')), tabs.length - 1)]
    if (newActiveTab) updateProp('activeTab', newActiveTab.tabId)
  } else if (typeof activeTab === 'number' && activeTab >= tabs.length) {
    updateProp('activeTab', Math.max(0, tabs.length - 1))
  }
}

// 添加 tab 参数
function addTabParam(index: number) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    return { ...t, params: { ...(t.params || {}), ['']: '' } }
  })
  updateProp('tabs', tabs)
}

// 更新 tab 参数的值
function updateTabParam(index: number, key: string, value: string) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    return { ...t, params: { ...(t.params || {}), [key]: value } }
  })
  updateProp('tabs', tabs)
}

// 更新 tab 参数的 key（重新命名）
function updateTabParamKey(index: number, oldKey: string, newKey: string) {
  if (newKey === oldKey) return
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    const newParams: Record<string, unknown> = {}
    for (const k in t.params || {}) {
      if (k === oldKey) newParams[newKey] = t.params[k]
      else newParams[k] = t.params[k]
    }
    return { ...t, params: newParams }
  })
  updateProp('tabs', tabs)
}

// 删除 tab 参数
function removeTabParam(index: number, key: string) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    const newParams: Record<string, unknown> = {}
    for (const k in t.params || {}) {
      if (k !== key) newParams[k] = t.params[k]
    }
    return { ...t, params: newParams }
  })
  updateProp('tabs', tabs)
}

// 处理从容器移出
function handleMoveOutOfContainer() {
  if (props.selectedComponent && parentContainerId.value) {
    emit('move-out-of-container', parentContainerId.value, props.selectedComponent.id)
  }
}

// 处理删除组件
function handleDeleteComponent() {
  if (props.selectedComponent) {
    emit('delete-component', props.selectedComponent.id)
  }
}

// 检查组件是否有某个属性
function hasProp(prop: string): boolean {
  if (!props.selectedComponent) return false
  const has = prop in props.selectedComponent.props
  console.log('[PropertyPanel] hasProp:', prop, has, 'props:', Object.keys(props.selectedComponent.props || {}))
  return has
}

// 更新属性
function updateProp(key: string, value: unknown) {
  if (props.selectedComponent) {
    const newProps = { ...props.selectedComponent.props, [key]: value }
    emit('update-props', newProps)
    // 高亮反馈
    highlightedField.value = key
    setTimeout(() => {
      highlightedField.value = null
    }, 800)
    ElMessage({ message: '属性已更新', type: 'success', duration: 1000 })
  }
}

// 更新标签
function updateLabel(label: string) {
  emit('update-label', label)
  highlightedField.value = 'label'
  setTimeout(() => { highlightedField.value = null }, 800)
  ElMessage({ message: '标签已更新', type: 'success', duration: 1000 })
}

// 处理 options 输入（逗号分隔转数组）
function handleOptionsInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  const options = value.split(',').map(s => s.trim()).filter(Boolean)
  updateProp('options', options)
}

// 处理 API ID 更新（兼容不同组件的字段名）
function handleApiIdUpdate(value: string) {
  if (!props.selectedComponent) return
  const type = props.selectedComponent.type
  if (type === 'table' || type === 'form') {
    updateProp('apiId', value)
    updateProp('queryApiId', value)
    updateProp('datasourceId', value)
  } else {
    updateProp('apiId', value)
  }
}

// 添加表格列
function addTableColumn() {
  if (!props.selectedComponent) return
  const columns = props.selectedComponent.props.columns || []
  const newColumn = {
    key: '',
    label: '',
    fieldType: 'text',
    width: 100,
    visible: true,
    sortable: false,
    align: 'left',
    queryCondition: false,
  }
  updateProp('columns', [...columns, newColumn])
}

// 删除表格列
function removeTableColumn(index: number) {
  if (!props.selectedComponent) return
  const columns = [...(props.selectedComponent.props.columns || [])]
  columns.splice(index, 1)
  updateProp('columns', columns)
}

// 更新表格列属性
function updateTableColumn(index: number, field: string, value: unknown) {
  if (!props.selectedComponent) return
  const columns = [...(props.selectedComponent.props.columns || [])]
  columns[index] = { ...columns[index], [field]: value }
  updateProp('columns', columns)
}
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light, #e4e7ed);
}

.empty-state {
  text-align: center;
  color: var(--text-muted, #909399);
  padding: 40px 20px;
}

.component-props {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prop-section {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e4e7ed);
  border-radius: 6px;
  padding: 12px;
}

.prop-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #606266);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  padding: 4px 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-separator {
  color: var(--text-muted, #909399);
  margin: 0 2px;
}

.breadcrumb-item span:not(.breadcrumb-separator) {
  color: var(--text-secondary, #606266);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.breadcrumb-item span:not(.breadcrumb-separator):hover {
  background-color: var(--bg-hover, #f5f7fa);
  color: var(--accent, #409eff);
}

.breadcrumb-item span.is-current {
  color: var(--accent, #409eff);
  font-weight: 500;
  cursor: default;
}

.breadcrumb-item span.is-current:hover {
  background-color: transparent;
}

.prop-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.prop-item:last-child {
  margin-bottom: 0;
}

.prop-item.inline-item {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.prop-item.inline-item label {
  min-width: 40px;
}

.prop-item label {
  font-size: 12px;
  color: var(--text-muted, #909399);
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--accent-light, #ecf5ff);
  color: var(--accent, #409eff);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  width: fit-content;
}

.prop-value {
  font-size: 13px;
  color: var(--text-primary, #303133);
}

.prop-input {
  padding: 6px 10px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
  width: 100%;
}

.prop-input:focus {
  outline: none;
  border-color: var(--accent, #409eff);
  box-shadow: 0 0 0 2px var(--accent-light, #ecf5ff);
}

.prop-input.is-highlighted {
  border-color: var(--el-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  animation: field-flash 0.8s ease-out;
}

@keyframes field-flash {
  0% { background-color: rgba(64, 158, 255, 0.15); }
  100% { background-color: transparent; }
}

.prop-textarea {
  padding: 6px 10px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
  width: 100%;
  resize: vertical;
  font-family: inherit;
}

.prop-textarea:focus {
  outline: none;
  border-color: var(--accent, #409eff);
  box-shadow: 0 0 0 2px var(--accent-light, #ecf5ff);
}

.prop-range {
  width: 100%;
  cursor: pointer;
}

.prop-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent, #409eff);
}

.w-20 {
  width: 80px !important;
}

.w-24 {
  width: 96px !important;
}

.prop-button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.prop-button--primary {
  background: var(--accent, #409eff);
  color: white;
}

.prop-button--primary:hover {
  opacity: 0.9;
}

.prop-button--danger {
  background: var(--danger, #f56c6c);
  color: white;
}

.prop-button--danger:hover {
  opacity: 0.9;
}

.prop-button--secondary {
  background: var(--bg-secondary, #f5f7fa);
  color: var(--text-primary, #303133);
  border-color: var(--border, #dcdfe6);
}

.prop-button--secondary:hover {
  background: var(--bg-hover, #ecf5ff);
}
</style>

<template>
  <div class="property-panel">
    <h3 class="panel-title">属性配置</h3>

    <div v-if="!selectedComponent" class="empty-state">
      <p>点击组件进行配置</p>
    </div>

    <div v-else class="component-props">
      <!-- 面包屑导航 -->
      <div class="prop-section">
        <div class="breadcrumb">
          <span
            v-for="(item, index) in breadcrumbPath"
            :key="item.componentId"
            class="breadcrumb-item"
          >
            <span v-if="index > 0" class="breadcrumb-separator"> › </span>
            <span
              :class="{ 'is-current': index === breadcrumbPath.length - 1 }"
              @click="index < breadcrumbPath.length - 1 && handleTreeSelect(item.componentId)"
            >
              {{ item.label || item.type }}
            </span>
          </span>
        </div>
      </div>

      <!-- ========== 基础信息（始终展开）========== -->
      <div class="prop-card">
        <div class="prop-card-header" @click="toggleSection('basic')">
          <span class="prop-card-title">基础信息</span>
          <span class="prop-card-arrow" :class="{ 'is-open': openSections.basic }">▼</span>
        </div>
        <div v-show="openSections.basic" class="prop-card-content">
          <div class="prop-item">
            <label>组件标签</label>
            <input
              :value="selectedComponent.label"
              type="text"
              class="prop-input"
              @input="updateLabel(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="prop-item">
            <label>组件ID</label>
            <input
              :value="selectedComponent.componentId || selectedComponent.id"
              type="text"
              class="prop-input bg-[var(--bg-secondary)] text-xs"
              readonly
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="type-badge">{{ selectedComponent.type }}</span>
          </div>
        </div>
      </div>

      <!-- ========== 表格配置 ========== -->
      <TablePropsPanel
        v-if="selectedComponent.type === 'table'"
        :selected-component="selectedComponent"
        :update-prop="updateProp"
      />

      <!-- ========== Tabs 配置 ========== -->
      <TabsPropsPanel
        v-if="selectedComponent.type === 'tabs'"
        :selected-component="selectedComponent"
        @update-tabs="handleTabsUpdate"
        @update-prop="(key, value) => updateProp(key, value)"
        @remove-tab="(index, children) => emit('remove-tab', index, children)"
      />

      <!-- ========== 常用属性（始终展开）========== -->
      <div class="prop-card">
        <div class="prop-card-header" @click="toggleSection('common')">
          <span class="prop-card-title">常用属性</span>
          <span class="prop-card-arrow" :class="{ 'is-open': openSections.common }">▼</span>
        </div>
        <div v-show="openSections.common" class="prop-card-content">
          <!-- title -->
          <div v-if="hasProp('title')" class="prop-item">
            <label>标题</label>
            <input
              :value="selectedComponent.props.title"
              type="text"
              class="prop-input"
              @input="updateProp('title', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- text -->
          <div v-if="hasProp('text')" class="prop-item">
            <label>显示文本</label>
            <input
              :value="selectedComponent.props.text"
              type="text"
              class="prop-input"
              @input="updateProp('text', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- content -->
          <div v-if="hasProp('content')" class="prop-item">
            <label>文本内容</label>
            <textarea
              :value="selectedComponent.props.content"
              class="prop-textarea"
              rows="2"
              @input="updateProp('content', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>

          <!-- placeholder -->
          <div v-if="hasProp('placeholder')" class="prop-item">
            <label>占位符</label>
            <input
              :value="selectedComponent.props.placeholder"
              type="text"
              class="prop-input"
              @input="updateProp('placeholder', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- options -->
          <div v-if="hasProp('options')" class="prop-item">
            <label>选项（逗号分隔）</label>
            <input
              :value="(selectedComponent.props.options as string[])?.join(', ')"
              type="text"
              class="prop-input"
              @input="handleOptionsInput($event)"
            />
          </div>
        </div>
      </div>

      <!-- ========== 数据配置（折叠）========== -->
      <div class="prop-card">
        <div class="prop-card-header" @click="toggleSection('data')">
          <span class="prop-card-title">数据配置</span>
          <span class="prop-card-arrow" :class="{ 'is-open': openSections.data }">▼</span>
        </div>
        <div v-show="openSections.data" class="prop-card-content">
          <!-- url/src -->
          <div v-if="hasProp('url')" class="prop-item">
            <label>{{ selectedComponent.type === 'image' ? '图片地址' : '链接地址' }}</label>
            <input
              :value="selectedComponent.props.url || selectedComponent.props.src"
              type="text"
              class="prop-input"
              @input="updateProp(selectedComponent.type === 'image' ? 'src' : 'url', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- alt -->
          <div v-if="hasProp('alt')" class="prop-item">
            <label>图片描述</label>
            <input
              :value="selectedComponent.props.alt"
              type="text"
              class="prop-input"
              @input="updateProp('alt', ($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- apiId -->
          <div v-if="hasProp('apiId')" class="prop-item">
            <label>API / 数据源ID</label>
            <input
              :value="selectedComponent.props.apiId || selectedComponent.props.queryApiId || selectedComponent.props.datasourceId"
              type="text"
              class="prop-input"
              placeholder="输入数据源ID"
              @input="handleApiIdUpdate(($event.target as HTMLInputElement).value)"
            />
          </div>

          <!-- dataDictionary -->
          <div v-if="hasProp('dataDictionary')" class="prop-item">
            <label>数据字典</label>
            <input
              :value="selectedComponent.props.dataDictionary"
              type="text"
              class="prop-input"
              placeholder="输入数据字典ID"
              @input="updateProp('dataDictionary', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- ========== 布局配置（折叠）========== -->
      <div class="prop-card">
        <div class="prop-card-header" @click="toggleSection('layout')">
          <span class="prop-card-title">布局配置</span>
          <span class="prop-card-arrow" :class="{ 'is-open': openSections.layout }">▼</span>
        </div>
        <div v-show="openSections.layout" class="prop-card-content">
          <!-- cols/gap (grid) -->
          <div v-if="hasProp('cols')" class="prop-item inline-item">
            <label>列数</label>
            <input
              :value="selectedComponent.props.cols"
              type="number"
              min="1"
              max="12"
              class="prop-input w-16"
              @input="updateProp('cols', Number(($event.target as HTMLInputElement).value))"
            />
            <label>间距</label>
            <input
              :value="selectedComponent.props.gap"
              type="number"
              min="0"
              class="prop-input w-16"
              @input="updateProp('gap', Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <!-- height -->
          <div v-if="hasProp('height')" class="prop-item">
            <label>高度</label>
            <input
              :value="selectedComponent.props.height"
              type="number"
              class="prop-input"
              placeholder="高度(px)"
              @input="updateProp('height', Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <!-- width -->
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
        </div>
      </div>

      <!-- ========== 样式（折叠）========== -->
      <div class="prop-card">
        <div class="prop-card-header" @click="toggleSection('style')">
          <span class="prop-card-title">样式</span>
          <span class="prop-card-arrow" :class="{ 'is-open': openSections.style }">▼</span>
        </div>
        <div v-show="openSections.style" class="prop-card-content">
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
      </div>

      <!-- ========== 操作 ========== -->
      <div class="prop-card">
        <div class="prop-card-header" @click="toggleSection('actions')">
          <span class="prop-card-title">操作</span>
          <span class="prop-card-arrow" :class="{ 'is-open': openSections.actions }">▼</span>
        </div>
        <div v-show="openSections.actions" class="prop-card-content">
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
            <button class="prop-button prop-button--secondary w-full" @click="handleMoveOutOfContainer">
              从容器移出
            </button>
          </div>

          <div class="prop-item">
            <button class="prop-button prop-button--danger w-full" @click="handleDeleteComponent">
              删除组件
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { CanvasComponent, TabItem } from '@/pages/editor/types'
import TablePropsPanel from './TablePropsPanel.vue'
import TabsPropsPanel from './TabsPropsPanel.vue'

interface Props {
  selectedComponent: CanvasComponent | null
  components: CanvasComponent[]
}

const props = defineProps<Props>()

// 折叠状态
const openSections = reactive({
  basic: true,    // 基础信息 - 默认展开
  common: true,   // 常用属性 - 默认展开
  data: false,    // 数据配置 - 默认折叠
  layout: false,  // 布局配置 - 默认折叠
  style: false,   // 样式 - 默认折叠
  actions: true,   // 操作 - 默认展开
})

function toggleSection(key: keyof typeof openSections) {
  openSections[key] = !openSections[key]
}

// 面包屑路径
interface BreadcrumbItem {
  componentId: string
  id: string
  type: string
  label: string
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

const breadcrumbPath = computed<BreadcrumbItem[]>(() => {
  if (!props.selectedComponent) return []
  const path: BreadcrumbItem[] = []
  const selectedId = props.selectedComponent.componentId || props.selectedComponent.id

  const findPath = (comps: CanvasComponent[], targetId: string): boolean => {
    for (const c of comps) {
      const cid = c.componentId || c.id
      if (cid === targetId) {
        path.push({ componentId: cid, id: c.id, type: c.type, label: c.label || c.type })
        return true
      }
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

function handleTreeSelect(componentId: string) {
  emit('select-component', componentId)
}

// 容器列表
const containerComponents = computed(() => {
  const containers: CanvasComponent[] = []
  const findContainers = (comps: CanvasComponent[]) => {
    for (const c of comps) {
      if (['card', 'tabs', 'collapse'].includes(c.type)) {
        containers.push(c)
      }
      if (c.children) findContainers(c.children)
    }
  }
  findContainers(props.components)
  return containers
})

const isInsideContainer = computed(() => parentContainerId.value !== null)

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

const emit = defineEmits<{
  'update-props': [props: Record<string, unknown>]
  'update-label': [label: string]
  'move-to-container': [containerId: string, componentId: string, tabIndex?: number]
  'move-out-of-container': [containerId: string, componentId: string]
  'delete-component': [id: string]
  'select-component': [id: string | null]
  'remove-tab': [tabIndex: number, tabChildren: (string | number)[]]
}>()

function handleTabsUpdate(tabs: TabItem[]) {
  updateProp('tabs', tabs)
}

function handleMoveToContainerAction(e: Event) {
  const containerId = (e.target as HTMLSelectElement).value
  if (containerId && props.selectedComponent) {
    const targetContainer = containerComponents.value.find(c => c.id === containerId)
    if (targetContainer?.type === 'tabs') {
      const tabs = (targetContainer.props?.tabs as TabItem[]) || []
      if (tabs.length === 0) return
      emit('move-to-container', containerId, props.selectedComponent.id, 0)
    } else {
      emit('move-to-container', containerId, props.selectedComponent.id)
    }
    ;(e.target as HTMLSelectElement).value = ''
  }
}

function handleMoveOutOfContainer() {
  if (props.selectedComponent && parentContainerId.value) {
    emit('move-out-of-container', parentContainerId.value, props.selectedComponent.id)
  }
}

function handleDeleteComponent() {
  if (props.selectedComponent) {
    emit('delete-component', props.selectedComponent.id)
  }
}

function hasProp(prop: string): boolean {
  if (!props.selectedComponent) return false
  return prop in props.selectedComponent.props
}

function updateProp(key: string, value: unknown) {
  if (props.selectedComponent) {
    const newProps = { ...props.selectedComponent.props, [key]: value }
    emit('update-props', newProps)
  }
}

function updateLabel(label: string) {
  emit('update-label', label)
}

function handleOptionsInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  const options = value.split(',').map(s => s.trim()).filter(Boolean)
  updateProp('options', options)
}

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
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
}

.panel-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted, #8b8fa3);
  margin: 0 0 16px 0;
}

.empty-state {
  text-align: center;
  color: var(--text-muted, #909399);
  padding: 40px 20px;
  font-size: 13px;
}

.component-props {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 卡片式分组 */
.prop-card {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e8e10);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s, transform 0.2s;
}

.prop-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
}

.prop-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  user-select: none;
  transition: all 0.2s;
}

.prop-card-header:hover {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
}

.prop-card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #1a1d23);
}

.prop-card-arrow {
  font-size: 9px;
  color: var(--text-muted, #8b8fa3);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}

.prop-card-arrow.is-open {
  transform: rotate(180deg);
  opacity: 1;
}

.prop-card-content {
  padding: 12px;
}

.prop-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
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
  font-size: 11px;
  color: var(--text-muted, #8b8fa3);
  font-weight: 500;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #3b82f6;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.prop-input {
  padding: 8px 12px;
  border: 1px solid var(--border, #e2e4e9);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-bg, #fafbfc);
  color: var(--text-primary, #1a1d23);
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.prop-input:hover {
  border-color: #c4c9d4;
}

.prop-input:focus {
  outline: none;
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  background: #fff;
}

.prop-textarea {
  padding: 8px 12px;
  border: 1px solid var(--border, #e2e4e9);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-bg, #fafbfc);
  color: var(--text-primary, #1a1d23);
  width: 100%;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.prop-textarea:hover {
  border-color: #c4c9d4;
}

.prop-textarea:focus {
  outline: none;
  border-color: var(--accent, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  background: #fff;
}

.prop-range {
  width: 100%;
  cursor: pointer;
}

.prop-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent, #409eff);
}

.w-16 {
  width: 64px !important;
}

.prop-button {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  font-weight: 500;
}

.prop-button--secondary {
  background: var(--bg-secondary, #f5f7fa);
  color: var(--text-primary, #303133);
  border-color: var(--border, #e2e4e9);
}

.prop-button--secondary:hover {
  background: #e8f4ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.prop-button--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.prop-button--danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.w-full {
  width: 100%;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  padding: 4px 0;
  margin-bottom: 8px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-separator {
  color: var(--text-muted, #909399);
  margin: 0 4px;
}

.breadcrumb-item span:not(.breadcrumb-separator) {
  color: var(--text-secondary, #606266);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}

.breadcrumb-item span:not(.breadcrumb-separator):hover {
  background-color: var(--bg-hover, #f0f7ff);
  color: var(--accent, #3b82f6);
}

.breadcrumb-item span.is-current {
  color: var(--accent, #3b82f6);
  font-weight: 600;
  cursor: default;
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
}
</style>

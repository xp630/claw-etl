<template>
  <div class="property-panel">
    <h3 class="panel-title">属性配置</h3>
    
    <div v-if="!selectedComponent" class="empty-state">
      <p>点击组件进行配置</p>
    </div>
    
    <div v-else class="component-props">
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
            @input="updateLabel(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- 表格属性 -->
      <TablePropsPanel
        v-if="selectedComponent.type === 'table'"
        :selected-component="selectedComponent"
        :update-prop="updateProp"
      />

      <!-- 通用属性 -->
      <div class="prop-section">
        <h4 class="prop-section-title">通用属性</h4>
        
        <!-- placeholder (input/select) -->
        <div v-if="hasProp('placeholder')" class="prop-item">
          <label>占位符</label>
          <input
            :value="selectedComponent.props.placeholder"
            type="text"
            class="prop-input"
            @input="updateProp('placeholder', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- options (select) -->
        <div v-if="hasProp('options')" class="prop-item">
          <label>选项（逗号分隔）</label>
          <input
            :value="(selectedComponent.props.options as string[])?.join(', ')"
            type="text"
            class="prop-input"
            @input="handleOptionsInput($event)"
          />
        </div>
        
        <!-- v-model / value (input/switch/slider) -->
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
        
        <!-- min/max (slider) -->
        <div v-if="hasProp('min')" class="prop-item inline-item">
          <label>最小值</label>
          <input
            :value="selectedComponent.props.min"
            type="number"
            class="prop-input w-24"
            @input="updateProp('min', Number(($event.target as HTMLInputElement).value))"
          />
          <label>最大值</label>
          <input
            :value="selectedComponent.props.max"
            type="number"
            class="prop-input w-24"
            @input="updateProp('max', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        
        <!-- content (text) -->
        <div v-if="hasProp('content')" class="prop-item">
          <label>文本内容</label>
          <textarea
            :value="selectedComponent.props.content"
            class="prop-textarea"
            rows="3"
            @input="updateProp('content', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        
        <!-- text (button/link) -->
        <div v-if="hasProp('text')" class="prop-item">
          <label>显示文本</label>
          <input
            :value="selectedComponent.props.text"
            type="text"
            class="prop-input"
            @input="updateProp('text', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- url (link) / src (image) -->
        <div v-if="hasProp('url')" class="prop-item">
          <label>{{ selectedComponent.type === 'image' ? '图片地址' : '链接地址' }}</label>
          <input
            :value="selectedComponent.props.url || selectedComponent.props.src"
            type="text"
            class="prop-input"
            @input="updateProp(selectedComponent.type === 'image' ? 'src' : 'url', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- alt (image) -->
        <div v-if="hasProp('alt')" class="prop-item">
          <label>图片描述</label>
          <input
            :value="selectedComponent.props.alt"
            type="text"
            class="prop-input"
            @input="updateProp('alt', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- height (blank) -->
        <div v-if="hasProp('height')" class="prop-item">
          <label>高度 (px)</label>
          <input
            :value="selectedComponent.props.height"
            type="number"
            class="prop-input"
            @input="updateProp('height', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        
        <!-- cols/gap (grid) -->
        <div v-if="hasProp('cols')" class="prop-item inline-item">
          <label>列数</label>
          <input
            :value="selectedComponent.props.cols"
            type="number"
            min="1"
            max="12"
            class="prop-input w-20"
            @input="updateProp('cols', Number(($event.target as HTMLInputElement).value))"
          />
          <label>间距</label>
          <input
            :value="selectedComponent.props.gap"
            type="number"
            min="0"
            class="prop-input w-20"
            @input="updateProp('gap', Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        
        <!-- title (card/table/form) -->
        <div v-if="hasProp('title')" class="prop-item">
          <label>标题</label>
          <input
            :value="selectedComponent.props.title"
            type="text"
            class="prop-input"
            @input="updateProp('title', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- apiId / queryApiId (table/form) -->
        <div v-if="hasProp('apiId')" class="prop-item">
          <label>API ID / 数据源ID</label>
          <input
            :value="selectedComponent.props.apiId || selectedComponent.props.queryApiId || selectedComponent.props.datasourceId"
            type="text"
            class="prop-input"
            placeholder="输入数据源ID"
            @input="handleApiIdUpdate(($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- dataDictionary (input/select) -->
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
        
        <!-- tabs 配置 (tabs) -->
        <div v-if="hasProp('tabs')" class="prop-item">
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-[var(--text-muted)]">标签页</label>
            <button
              type="button"
              class="text-xs text-[var(--accent)] hover:underline"
              @click="addTab"
            >
              + 添加
            </button>
          </div>
          <div class="space-y-1">
            <div
              v-for="(tab, index) in (selectedComponent.props.tabs as string[] || [])"
              :key="index"
              class="flex items-center gap-1"
            >
              <input
                :value="tab"
                type="text"
                class="flex-1 px-2 py-1 border border-[var(--border)] rounded text-xs"
                @input="updateTabTitle(index, ($event.target as HTMLInputElement).value)"
              />
              <button
                type="button"
                class="px-1 text-[var(--danger)] hover:text-red-400 text-xs"
                @click="removeTab(index)"
              >
                ✕
              </button>
            </div>
          </div>
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

      <!-- 临时保存 -->
      <div class="prop-section">
        <h4 class="prop-section-title">临时保存</h4>
        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-sm"
            @click="handleSaveTemp"
          >
            保存临时
          </button>
          <button
            class="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border)] rounded text-sm"
            @click="handleLoadTemp"
          >
            加载临时
          </button>
        </div>
        <div v-if="tempSaveTime" class="text-xs text-[var(--text-muted)] mt-1">
          上次保存: {{ tempSaveTime }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'
import TablePropsPanel from './TablePropsPanel.vue'

interface Props {
  selectedComponent: CanvasComponent | null
  components: CanvasComponent[]
}

const props = defineProps<Props>()

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

// 临时保存到 localStorage
const tempSaveTime = ref<string | null>(null)

function handleSaveTemp() {
  if (!props.selectedComponent) return
  const key = `temp_feature_${props.selectedComponent.id}`
  const data = {
    props: props.selectedComponent.props,
    label: props.selectedComponent.label,
    featureId: props.selectedComponent.props?.featureId,
    datasourceId: props.selectedComponent.props?.datasourceId,
    tableName: props.selectedComponent.props?.tableName,
  }
  localStorage.setItem(key, JSON.stringify(data))
  tempSaveTime.value = new Date().toLocaleString()
}

function handleLoadTemp() {
  if (!props.selectedComponent) return
  const key = `temp_feature_${props.selectedComponent.id}`
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      // 恢复属性
      if (data.props) {
        emit('update-props', { ...props.selectedComponent.props, ...data.props })
      }
      if (data.label) {
        emit('update-label', data.label)
      }
      alert('已加载临时保存的配置')
    } catch (e) {
      console.error('Failed to load temp data:', e)
      alert('加载失败')
    }
  } else {
    alert('没有找到临时保存的配置')
  }
}

const emit = defineEmits<{
  'update-props': [props: Record<string, unknown>]
  'update-label': [label: string]
  'move-to-container': [containerId: string, componentId: string]
  'move-out-of-container': [containerId: string, componentId: string]
  'delete-component': [id: string]
  'select-component': [id: string | null]
}>()

// 处理移动到容器（select change事件）
function handleMoveToContainerAction(e: Event) {
  const containerId = (e.target as HTMLSelectElement).value
  if (containerId && props.selectedComponent) {
    emit('move-to-container', containerId, props.selectedComponent.id)
    ;(e.target as HTMLSelectElement).value = ''
  }
}

// Tabs 操作
function addTab() {
  const tabs = [...(props.selectedComponent?.props.tabs as string[] || [])]
  tabs.push(`标签${tabs.length + 1}`)
  updateProp('tabs', tabs)
}

function updateTabTitle(index: number, title: string) {
  const tabs = [...(props.selectedComponent?.props.tabs as string[] || [])]
  tabs[index] = title
  updateProp('tabs', tabs)
}

function removeTab(index: number) {
  const tabs = [...(props.selectedComponent?.props.tabs as string[] || [])]
  tabs.splice(index, 1)
  updateProp('tabs', tabs)
  // 如果当前激活的 tab 被删除，调整 activeTab
  const activeTab = props.selectedComponent?.props.activeTab as number
  if (activeTab >= tabs.length) {
    updateProp('activeTab', Math.max(0, tabs.length - 1))
  }
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
  return prop in props.selectedComponent.props
}

// 更新属性
function updateProp(key: string, value: unknown) {
  if (props.selectedComponent) {
    const newProps = { ...props.selectedComponent.props, [key]: value }
    emit('update-props', newProps)
  }
}

// 更新标签
function updateLabel(label: string) {
  emit('update-label', label)
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

<template>
  <div class="prop-section">
    <h4 class="prop-section-title">表格配置</h4>

    <!-- 数据配置（核心） -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">数据源</label>
      <select
        :value="selectedComponent.props.datasourceId || ''"
        class="prop-input"
        @change="handleDatasourceChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="">-- 选择数据源 --</option>
        <option
          v-for="ds in dataSources"
          :key="ds.id"
          :value="ds.id"
        >
          {{ ds.name }}
        </option>
      </select>
    </div>

    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">表名</label>
      <select
        :value="selectedComponent.props.tableName || ''"
        class="prop-input"
        @change="handleTableChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="">-- 选择表名 --</option>
        <option
          v-for="table in tables"
          :key="table.tableName"
          :value="table.tableName"
        >
          {{ table.tableName }}{{ table.tableComment ? ` (${table.tableComment})` : '' }}
        </option>
      </select>
      <div v-if="loadingTables" class="text-xs text-[var(--text-muted)] mt-1">加载表名中...</div>
    </div>

    <!-- Feature 选择 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">功能 (Feature)</label>
      <select
        :value="selectedComponent.props.featureId || ''"
        class="prop-input"
        @change="handleFeatureChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="">-- 选择功能 --</option>
        <option
          v-for="feature in availableFeatures"
          :key="feature.id"
          :value="feature.id"
        >
          {{ feature.name }} ({{ feature.code }})
        </option>
      </select>
      <div v-if="loadingFeatures" class="text-xs text-[var(--text-muted)] mt-1">加载中...</div>
      <div v-else-if="availableFeatures.length === 0 && selectedComponent.props.tableName && selectedComponent.props.datasourceId" class="mt-1">
        <span class="text-xs text-[var(--text-muted)]">该表暂无可用功能</span>
        <button
          type="button"
          class="ml-2 text-xs text-[var(--accent)] hover:underline"
          @click="showCreateFeatureModal = true"
        >
          + 新建
        </button>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="border-t border-[var(--border-light)] my-3"></div>

    <!-- 基础样式 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">基础样式</label>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.bordered"
            @change="updateProp('bordered', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          边框
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.striped"
            @change="updateProp('striped', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          斑马纹
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.pagination"
            @change="updateProp('pagination', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          分页
        </label>
      </div>
    </div>

    <!-- 分页设置（仅分页选中时显示） -->
    <div v-if="selectedComponent.props.pagination" class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">每页条数</label>
      <input
        :value="selectedComponent.props.pageSize"
        type="number"
        min="5"
        max="100"
        class="prop-input"
        @input="updateProp('pageSize', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <!-- 分隔线 -->
    <div class="border-t border-[var(--border-light)] my-3"></div>

    <!-- 操作按钮 -->
    <div class="prop-item">
      <label class="text-xs text-[var(--text-muted)] mb-1 block">操作按钮</label>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showSearch"
            @change="updateProp('showSearch', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          搜索
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showAdd"
            @change="updateProp('showAdd', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          新增
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showEdit"
            @change="updateProp('showEdit', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          编辑
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showDelete"
            @change="updateProp('showDelete', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          删除
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showDetail"
            @change="updateProp('showDetail', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          详情
        </label>
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="selectedComponent.props.showExport"
            @change="updateProp('showExport', ($event.target as HTMLInputElement).checked)"
            class="w-3 h-3"
          />
          导出
        </label>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="border-t border-[var(--border-light)] my-3"></div>

    <!-- 列配置 -->
    <div class="prop-item">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs text-[var(--text-muted)]">列配置 ({{ selectedComponent.props.columns?.length || 0 }})</label>
        <button
          type="button"
          class="text-xs text-[var(--accent)] hover:underline"
          @click="openColumnsEditor"
        >
          编辑列
        </button>
      </div>
      <div v-if="selectedComponent.props.columns?.length" class="space-y-1">
        <div
          v-for="(col, index) in (selectedComponent.props.columns || []).slice(0, 5)"
          :key="index"
          class="flex items-center gap-2 text-xs bg-[var(--bg-hover-light)] rounded px-2 py-1"
        >
          <span class="flex-1 truncate">{{ col.label || col.key }}</span>
          <span class="text-[var(--text-muted)]">{{ col.fieldType }}</span>
          <button
            type="button"
            class="text-xs text-[var(--accent)] hover:underline"
            @click="openColumnEditor(index)"
          >
            编辑
          </button>
        </div>
        <div v-if="(selectedComponent.props.columns?.length || 0) > 5" class="text-xs text-[var(--text-muted)] text-center py-1">
          还有 {{ (selectedComponent.props.columns?.length || 0) - 5 }} 列...
        </div>
      </div>
      <div v-else class="text-xs text-[var(--text-muted)] text-center py-2">
        暂无列配置
      </div>
    </div>

    <!-- 列配置编辑弹窗 -->
    <Teleport to="body">
      <div
        v-if="showColumnsEditorModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto"
        @click.self="showColumnsEditorModal = false"
      >
        <div class="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-[900px] max-h-[90vh] overflow-auto m-4">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
            <h3 class="font-medium">编辑列配置</h3>
            <button
              @click="showColumnsEditorModal = false"
              class="p-1 hover:bg-[var(--bg-hover)] rounded"
            >
              ✕
            </button>
          </div>
          <div class="p-4">
            <div class="space-y-3">
              <div
                v-for="(col, index) in editingColumn"
                :key="index"
                class="bg-[var(--bg-hover-light)] rounded p-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-sm">列 {{ index + 1 }}</span>
                  <button
                    type="button"
                    class="text-[var(--danger)] hover:underline text-xs"
                    @click="removeColumn(index)"
                  >
                    删除
                  </button>
                </div>
                <div class="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label class="block text-[var(--text-muted)] mb-1">字段名</label>
                    <input
                      :value="col.key"
                      type="text"
                      class="w-full px-2 py-1 border border-[var(--border)] rounded"
                      @input="updateColumn(index, 'key', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div>
                    <label class="block text-[var(--text-muted)] mb-1">显示名</label>
                    <input
                      :value="col.label"
                      type="text"
                      class="w-full px-2 py-1 border border-[var(--border)] rounded"
                      @input="updateColumn(index, 'label', ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <div>
                    <label class="block text-[var(--text-muted)] mb-1">类型</label>
                    <select
                      :value="col.fieldType"
                      class="w-full px-2 py-1 border border-[var(--border)] rounded"
                      @change="updateColumn(index, 'fieldType', ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="text">文本</option>
                      <option value="number">数字</option>
                      <option value="date">日期</option>
                      <option value="select">下拉</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[var(--text-muted)] mb-1">宽度</label>
                    <input
                      :value="col.width"
                      type="number"
                      class="w-full px-2 py-1 border border-[var(--border)] rounded"
                      @input="updateColumn(index, 'width', Number(($event.target as HTMLInputElement).value))"
                    />
                  </div>
                </div>
                <div class="flex items-center gap-4 mt-2 text-xs">
                  <label class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      :checked="col.visible"
                      @change="updateColumn(index, 'visible', ($event.target as HTMLInputElement).checked)"
                      class="w-3 h-3"
                    />
                    显示
                  </label>
                  <label class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      :checked="col.sortable"
                      @change="updateColumn(index, 'sortable', ($event.target as HTMLInputElement).checked)"
                      class="w-3 h-3"
                    />
                    排序
                  </label>
                  <label class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      :checked="col.queryCondition"
                      @change="updateColumn(index, 'queryCondition', ($event.target as HTMLInputElement).checked)"
                      class="w-3 h-3"
                    />
                    查询
                  </label>
                  <label class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      :checked="col.frozen"
                      @change="updateColumn(index, 'frozen', ($event.target as HTMLInputElement).checked)"
                      class="w-3 h-3"
                    />
                    冻结
                  </label>
                </div>
              </div>
              <button
                type="button"
                class="w-full py-2 border border-dashed border-[var(--border)] rounded text-sm text-[var(--accent)] hover:bg-[var(--bg-hover)]"
                @click="addColumn"
              >
                + 添加列
              </button>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-4 border-t border-[var(--border-light)]">
            <button
              @click="showColumnsEditorModal = false"
              class="px-4 py-2 text-sm border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-hover)]"
            >
              取消
            </button>
            <button
              @click="handleSaveColumns"
              class="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 单列编辑弹窗 -->
    <Teleport to="body">
      <div
        v-if="showSingleColumnEditor"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showSingleColumnEditor = false"
      >
        <div class="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-[500px]">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
            <h3 class="font-medium">编辑列 - {{ editingSingleColumn.label || editingSingleColumn.key }}</h3>
            <button
              @click="showSingleColumnEditor = false"
              class="p-1 hover:bg-[var(--bg-hover)] rounded"
            >
              ✕
            </button>
          </div>
          <div class="p-4 space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[var(--text-muted)] mb-1">字段名</label>
                <input
                  v-model="editingSingleColumn.key"
                  type="text"
                  class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                />
              </div>
              <div>
                <label class="block text-[var(--text-muted)] mb-1">显示名</label>
                <input
                  v-model="editingSingleColumn.label"
                  type="text"
                  class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[var(--text-muted)] mb-1">类型</label>
                <select
                  v-model="editingSingleColumn.fieldType"
                  class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                >
                  <option value="text">文本</option>
                  <option value="number">数字</option>
                  <option value="date">日期</option>
                  <option value="select">下拉</option>
                </select>
              </div>
              <div>
                <label class="block text-[var(--text-muted)] mb-1">宽度</label>
                <input
                  v-model.number="editingSingleColumn.width"
                  type="number"
                  class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                />
              </div>
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">对齐</label>
              <select
                v-model="editingSingleColumn.align"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-1">
                <input type="checkbox" v-model="editingSingleColumn.visible" class="w-4 h-4" />
                显示
              </label>
              <label class="flex items-center gap-1">
                <input type="checkbox" v-model="editingSingleColumn.sortable" class="w-4 h-4" />
                排序
              </label>
              <label class="flex items-center gap-1">
                <input type="checkbox" v-model="editingSingleColumn.queryCondition" class="w-4 h-4" />
                查询
              </label>
              <label class="flex items-center gap-1">
                <input type="checkbox" v-model="editingSingleColumn.frozen" class="w-4 h-4" />
                冻结
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-4 border-t border-[var(--border-light)]">
            <button
              @click="showSingleColumnEditor = false"
              class="px-4 py-2 text-sm border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-hover)]"
            >
              取消
            </button>
            <button
              @click="handleSaveSingleColumn"
              class="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 新建 Feature 弹窗 -->
    <Teleport to="body">
      <div
        v-if="showCreateFeatureModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="showCreateFeatureModal = false"
      >
        <div class="bg-[var(--bg-secondary)] rounded-lg shadow-xl w-[400px]">
          <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
            <h3 class="font-medium">新建功能 (Feature)</h3>
            <button
              @click="showCreateFeatureModal = false"
              class="p-1 hover:bg-[var(--bg-hover)] rounded"
            >
              ✕
            </button>
          </div>
          <div class="p-4 space-y-3 text-sm">
            <div>
              <label class="block text-[var(--text-muted)] mb-1">名称</label>
              <input
                v-model="newFeatureForm.name"
                type="text"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                placeholder="如: 用户管理"
              />
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">编码</label>
              <input
                v-model="newFeatureForm.code"
                type="text"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                placeholder="如: sys_user"
              />
            </div>
            <div>
              <label class="block text-[var(--text-muted)] mb-1">描述</label>
              <textarea
                v-model="newFeatureForm.description"
                class="w-full px-3 py-2 border border-[var(--border-light)] rounded bg-[var(--bg-hover-light)]"
                rows="3"
                placeholder="功能描述（可选）"
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 p-4 border-t border-[var(--border-light)]">
            <button
              @click="showCreateFeatureModal = false"
              class="px-4 py-2 text-sm border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-hover)]"
            >
              取消
            </button>
            <button
              @click="handleCreateFeature"
              :disabled="creatingFeature || !newFeatureForm.name || !newFeatureForm.code"
              class="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {{ creatingFeature ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'
import { getFeatures, getFeatureDetail, getDataSources, getTableList, saveFeature } from '@/lib/api'

interface Props {
  selectedComponent: CanvasComponent | null
  updateProp: (key: string, value: any) => void
}

const props = defineProps<Props>()

// 数据源列表
const dataSources = ref<any[]>([])
const tables = ref<any[]>([])
const availableFeatures = ref<any[]>([])
const loadingTables = ref(false)
const loadingFeatures = ref(false)

// 列配置编辑弹窗
const showColumnsEditorModal = ref(false)
const editingColumn = ref<any[]>([])

// 单列编辑弹窗
const showSingleColumnEditor = ref(false)
const editingColumnIndex = ref<number>(-1)
const editingSingleColumn = ref<any>({})

// 新建 Feature 弹窗
const showCreateFeatureModal = ref(false)
const creatingFeature = ref(false)
const newFeatureForm = ref({
  name: '',
  code: '',
  description: '',
})

// 加载数据源列表
async function loadDataSources() {
  try {
    const res = await getDataSources({ page: 1, limit: 100 })
    dataSources.value = res.list || []
  } catch (error) {
    console.error('Failed to load dataSources:', error)
    dataSources.value = []
  }
}

// 加载表名列表
async function loadTables() {
  const datasourceId = props.selectedComponent?.props.datasourceId
  if (!datasourceId) {
    tables.value = []
    return
  }

  let ds = dataSources.value.find(d => d.id === datasourceId)
  if (!ds) {
    await loadDataSources()
    ds = dataSources.value.find(d => d.id === datasourceId)
  }

  if (!ds) {
    tables.value = []
    return
  }

  const dbName = ds.database_name || ds.dbName || ds.databaseName
  if (!dbName) {
    tables.value = []
    return
  }

  loadingTables.value = true
  try {
    const res = await getTableList(dbName)
    tables.value = res || []
  } catch (error) {
    console.error('Failed to load tables:', error)
    tables.value = []
  } finally {
    loadingTables.value = false
  }
}

// 加载 Feature 列表
async function loadFeaturesForTable() {
  const tableName = props.selectedComponent?.props.tableName
  const datasourceId = props.selectedComponent?.props.datasourceId
  if (!tableName || !datasourceId) {
    availableFeatures.value = []
    return
  }

  loadingFeatures.value = true
  try {
    const res = await getFeatures({ page: 1, limit: 100 })
    const filtered = (res.list || []).filter((f: any) =>
      f.datasourceId === datasourceId && f.tableName === tableName
    )
    availableFeatures.value = filtered
  } catch (error) {
    console.error('Failed to load features:', error)
    availableFeatures.value = []
  } finally {
    loadingFeatures.value = false
  }
}

// 处理数据源变化
function handleDatasourceChange(value: string) {
  if (!value) {
    props.updateProp('datasourceId', undefined)
    props.updateProp('tableName', undefined)
    props.updateProp('featureId', undefined)
    tables.value = []
    availableFeatures.value = []
    return
  }
  props.updateProp('datasourceId', parseInt(value))
  props.updateProp('tableName', undefined)
  props.updateProp('featureId', undefined)
  tables.value = []
  availableFeatures.value = []
  loadTables()
}

// 处理表名变化
function handleTableChange(value: string) {
  if (!value) {
    props.updateProp('tableName', undefined)
    props.updateProp('featureId', undefined)
    availableFeatures.value = []
    return
  }
  props.updateProp('tableName', value)
  props.updateProp('featureId', undefined)
  availableFeatures.value = []
  loadFeaturesForTable()
}

// 处理 Feature 变化
async function handleFeatureChange(featureId: string) {
  if (!featureId) {
    props.updateProp('featureId', undefined)
    props.updateProp('queryApiId', undefined)
    props.updateProp('createApiId', undefined)
    props.updateProp('updateApiId', undefined)
    props.updateProp('deleteApiId', undefined)
    props.updateProp('detailApiId', undefined)
    props.updateProp('columns', [])
    return
  }

  props.updateProp('featureId', parseInt(featureId))

  try {
    const detail = await getFeatureDetail(parseInt(featureId))
    if (detail) {
      props.updateProp('queryApiId', detail.queryApiId)
      props.updateProp('createApiId', detail.createApiId)
      props.updateProp('updateApiId', detail.updateApiId)
      props.updateProp('deleteApiId', detail.deleteApiId)
      props.updateProp('detailApiId', detail.detailApiId)
      if (detail.columns) {
        props.updateProp('columns', detail.columns)
      }
    }
  } catch (error) {
    console.error('Failed to load feature detail:', error)
  }
}

// 新建 Feature
async function handleCreateFeature() {
  if (!newFeatureForm.value.name || !newFeatureForm.value.code) return

  creatingFeature.value = true
  try {
    const datasourceId = props.selectedComponent?.props.datasourceId
    const tableName = props.selectedComponent?.props.tableName
    await saveFeature({
      name: newFeatureForm.value.name,
      code: newFeatureForm.value.code,
      description: newFeatureForm.value.description,
      datasourceId: datasourceId,
      tableName: tableName,
    })
    showCreateFeatureModal.value = false
    newFeatureForm.value = { name: '', code: '', description: '' }
    await loadFeaturesForTable()
  } catch (error) {
    console.error('Failed to create feature:', error)
    alert('创建失败')
  } finally {
    creatingFeature.value = false
  }
}

// 打开列配置编辑器
function openColumnsEditor() {
  editingColumn.value = JSON.parse(JSON.stringify(props.selectedComponent?.props.columns || []))
  showColumnsEditorModal.value = true
}

// 打开单列编辑器
function openColumnEditor(index: number) {
  editingColumnIndex.value = index
  editingSingleColumn.value = { ...props.selectedComponent?.props.columns?.[index] }
  showSingleColumnEditor.value = true
}

// 保存单列编辑
function handleSaveSingleColumn() {
  const columns = [...(props.selectedComponent?.props.columns || [])]
  columns[editingColumnIndex.value] = editingSingleColumn.value
  props.updateProp('columns', columns)
  showSingleColumnEditor.value = false
}

// 更新编辑中的列
function updateColumn(index: number, field: string, value: any) {
  editingColumn.value[index][field] = value
}

// 添加列
function addColumn() {
  editingColumn.value.push({
    key: '',
    label: '',
    fieldType: 'text',
    width: 100,
    visible: true,
    sortable: false,
    align: 'left',
    frozen: false,
    ellipsis: true,
    tooltip: false,
    required: false,
    placeholder: '',
    queryCondition: false,
    dataDictionary: ''
  })
}

// 删除列
function removeColumn(index: number) {
  editingColumn.value.splice(index, 1)
}

// 保存所有列
function handleSaveColumns() {
  props.updateProp('columns', editingColumn.value)
  showColumnsEditorModal.value = false
}

// 初始化监听
watch(() => props.selectedComponent?.id, () => {
  if (props.selectedComponent?.type === 'table') {
    loadDataSources()
  }
}, { immediate: true })

watch(() => props.selectedComponent?.props?.datasourceId, (newDsId) => {
  if (props.selectedComponent?.type === 'table' && newDsId) {
    loadTables()
  } else {
    tables.value = []
  }
})

watch(() => props.selectedComponent?.props?.tableName, (newTableName) => {
  if (props.selectedComponent?.type === 'table' && newTableName && props.selectedComponent?.props?.datasourceId) {
    loadFeaturesForTable()
  } else {
    availableFeatures.value = []
  }
})
</script>

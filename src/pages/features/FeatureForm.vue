<template>
  <div class="p-4 h-full overflow-auto">
    <!-- Loading overlay -->
    <div v-if="initialLoading" class="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center z-50">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-[var(--text-muted)] text-sm">加载中...</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-3 min-w-max">
      <!-- 数据源配置 -->
      <div class="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">数据源</label>
            <select
              :value="formData.datasourceId || ''"
              @change="handleDataSourceChange"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            >
              <option value="">请选择数据源</option>
              <option v-for="ds in dataSources" :key="ds.id" :value="ds.id">
                {{ ds.name }}{{ ds.comment ? ` (${ds.comment})` : '' }}
              </option>
            </select>
          </div>
          <div ref="tableSearchRef" class="relative">
            <label class="block text-sm text-[var(--text-muted)] mb-1">表名</label>
            <div class="relative">
              <input
                type="text"
                :value="tableSearchOpen ? tableSearchValue : formData.tableName"
                @input="e => { tableSearchValue = e.target.value; tableSearchOpen = true }"
                @focus="tableSearchOpen = true"
                :placeholder="formData.datasourceId ? '搜索表名...' : '请先选择数据源'"
                :disabled="!formData.datasourceId"
                class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  v-if="formData.tableName"
                  type="button"
                  @click.stop="handleTableClear"
                  class="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]"
                >
                  <X class="w-3 h-3" />
                </button>
                <Search class="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </div>
            <!-- Table dropdown -->
            <div
              v-if="tableSearchOpen && formData.datasourceId"
              class="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <template v-if="filteredTables.length > 0">
                <button
                  v-for="t in filteredTables"
                  :key="t.tableName"
                  type="button"
                  @click="handleTableSelect(t.tableName)"
                  class="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex justify-between items-center"
                >
                  <span class="font-mono">{{ t.tableName }}</span>
                  <span v-if="t.tableComment" class="text-[var(--text-muted)] text-xs ml-2">{{ t.tableComment }}</span>
                </button>
              </template>
              <div v-else class="px-3 py-2 text-sm text-[var(--text-muted)] text-center">无匹配结果</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">功能名称</label>
            <input
              type="text"
              v-model="formData.name"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">功能编码</label>
            <input
              type="text"
              v-model="formData.code"
              :disabled="isEdit"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-light)]"
              placeholder="如: goods"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">功能类型</label>
            <select
              v-model="formData.type"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            >
              <option value="list">列表页</option>
              <option value="form">表单页</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">状态</label>
            <select
              v-model="formData.status"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            >
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-sm text-[var(--text-muted)] mb-1">描述</label>
          <textarea
            v-model="formData.description"
            rows="2"
            class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            placeholder="请输入功能描述"
          ></textarea>
        </div>
      </div>

      <!-- API配置 -->
      <div class="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">API配置</h2>
          <button
            v-if="formData.tableName && formData.code && !hasApis"
            type="button"
            :disabled="generating"
            @click="handleGenerateApi"
            class="flex items-center gap-1 px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors text-sm"
          >
            <div v-if="generating" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span v-else>生成CRUD API</span>
          </button>
        </div>

        <template v-if="hasApis">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[var(--border-light)]">
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">操作</th>
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">API名称</th>
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">路径</th>
                  <th class="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--border-light)]">
                <tr v-for="api in apiList" :key="api.type" class="hover:bg-[var(--bg-hover-light)]">
                  <td class="px-2 py-1.5 text-xs" :class="apiTagClass(api.type)">{{ api.label }}</td>
                  <td class="px-2 py-1.5 text-xs text-[var(--text-primary)]">{{ api.name || '-' }}</td>
                  <td class="px-2 py-1.5 text-xs text-[var(--text-muted)] font-mono">{{ api.path }}</td>
                  <td class="px-2 py-1.5 text-center">
                    <button
                      v-if="api.id"
                      type="button"
                      @click="handleEditApi(api)"
                      class="text-[var(--accent)] hover:text-purple-300 text-xs"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="text-[var(--text-muted)] text-xs py-4 text-center">
          请在表单配置中选择数据源和表，或点击"生成CRUD API"自动创建
        </div>
      </div>

      <!-- 菜单配置 -->
      <div class="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">显示在菜单</label>
            <select
              v-model="formData.showInMenu"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            >
              <option :value="0">不显示</option>
              <option :value="1">显示</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">菜单图标</label>
            <select
              v-model="formData.menuIcon"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            >
              <option value="layout">布局</option>
              <option value="database">数据库</option>
              <option value="listtodo">任务</option>
              <option value="globe">API</option>
              <option value="key">应用</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">菜单排序</label>
            <input
              type="number"
              v-model.number="formData.menuOrder"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
            />
          </div>
          <div>
            <label class="block text-sm text-[var(--text-muted)] mb-1">路由路径</label>
            <input
              type="text"
              v-model="formData.routePath"
              placeholder="/dynamic/goods"
              class="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-light)]"
            />
          </div>
        </div>
      </div>

      <!-- 字段配置 -->
      <div class="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">字段配置</h2>
          <button
            type="button"
            @click="addColumn"
            class="flex items-center gap-1 px-2 py-1 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 text-[var(--accent)] rounded transition-colors text-xs"
          >
            <Plus class="w-3 h-3" />
            添加字段
          </button>
        </div>

        <template v-if="formData.columns && formData.columns.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[var(--border-light)]">
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">字段名</th>
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">显示名称</th>
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">控件类型</th>
                  <th class="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">数据字典</th>
                  <th class="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">长度</th>
                  <th class="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">对齐</th>
                  <th class="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">可见</th>
                  <th class="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">查询</th>
                  <th class="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(col, index) in formData.columns"
                  :key="index"
                  class="border-b border-[var(--border-light)]"
                >
                  <td class="px-2 py-1">
                    <input
                      type="text"
                      v-model="col.fieldName"
                      class="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-light)]"
                      required
                    />
                  </td>
                  <td class="px-2 py-1">
                    <input
                      type="text"
                      v-model="col.fieldLabel"
                      class="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                      required
                    />
                  </td>
                  <td class="px-2 py-1">
                    <select
                      v-model="col.fieldType"
                      class="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                    >
                      <option value="text">文本</option>
                      <option value="number">数字</option>
                      <option value="date">日期</option>
                      <option value="select">下拉</option>
                      <option value="image">图片</option>
                      <option value="action">操作</option>
                    </select>
                  </td>
                  <td class="px-2 py-1">
                    <select
                      v-model="col.dataDictionary"
                      class="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                    >
                      <option value="">请选择</option>
                      <option v-for="dict in dicts" :key="dict.id" :value="dict.code">{{ dict.name }}</option>
                    </select>
                  </td>
                  <td class="px-2 py-1">
                    <input
                      type="number"
                      v-model.number="col.span"
                      min="1"
                      class="w-14 px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs text-center focus:outline-none focus:border-[var(--accent-light)]"
                    />
                  </td>
                  <td class="px-2 py-1">
                    <select
                      v-model="col.align"
                      class="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                    >
                      <option value="left">左</option>
                      <option value="center">中</option>
                      <option value="right">右</option>
                    </select>
                  </td>
                  <td class="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      v-model="col.visible"
                      class="w-4 h-4 rounded border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-purple-500"
                    />
                  </td>
                  <td class="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      v-model="col.queryCondition"
                      class="w-4 h-4 rounded border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-purple-500"
                    />
                  </td>
                  <td class="px-2 py-1 text-center">
                    <button
                      type="button"
                      @click="removeColumn(index)"
                      class="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="text-center py-4 text-[var(--text-muted)] text-xs">
          暂无字段配置，点击"添加字段"开始配置
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="router.push('/features')"
          class="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
        >
          取消
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Trash2, Search, X } from 'lucide-vue-next'
import {
  getFeatureDetail,
  saveFeature,
  getApiListSimple,
  getDataSources,
  getTableList,
  getTableColumns,
  generateCrudApi,
  getDictList,
} from '@/lib/api'
import type { Feature, FeatureColumn, DataSource, Dict } from '@/lib/api'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const isEdit = computed(() => Boolean(id.value))

const initialLoading = ref(false)
const saving = ref(false)
const generating = ref(false)
const dataSources = ref<DataSource[]>([])
const tables = ref<{ tableName: string; tableComment: string }[]>([])
const dicts = ref<Dict[]>([])
const apis = ref<any[]>([])

const tableSearchValue = ref('')
const tableSearchOpen = ref(false)
const tableSearchRef = ref<HTMLElement | null>(null)

const formData = reactive<Feature & {
  queryApiName?: string
  queryApiPath?: string
  createApiName?: string
  updateApiName?: string
  deleteApiName?: string
  detailApiName?: string
}>({
  name: '',
  code: '',
  type: 'list',
  description: '',
  datasourceId: undefined,
  tableName: '',
  status: 1,
  queryApiId: undefined,
  queryApiName: '',
  queryApiPath: '',
  createApiId: undefined,
  createApiName: '',
  updateApiId: undefined,
  updateApiName: '',
  deleteApiId: undefined,
  deleteApiName: '',
  detailApiId: undefined,
  detailApiName: '',
  showInMenu: 0,
  menuIcon: 'layout',
  menuOrder: 0,
  routePath: '',
  columns: [],
})

const apiList = computed(() => [
  { type: 'query', label: '查询', id: formData.queryApiId, name: formData.queryApiName, path: `/api/${formData.code}/list` },
  { type: 'create', label: '新增', id: formData.createApiId, name: formData.createApiName, path: `/api/${formData.code}/create` },
  { type: 'update', label: '更新', id: formData.updateApiId, name: formData.updateApiName, path: `/api/${formData.code}/update` },
  { type: 'delete', label: '删除', id: formData.deleteApiId, name: formData.deleteApiName, path: `/api/${formData.code}/delete` },
  { type: 'detail', label: '详情', id: formData.detailApiId, name: formData.detailApiName, path: `/api/${formData.code}/detail` },
])

const hasApis = computed(() => apiList.value.some(a => a.id))

const filteredTables = computed(() => {
  if (!tableSearchValue.value) return tables.value
  const search = tableSearchValue.value.toLowerCase()
  return tables.value.filter(t =>
    t.tableName.toLowerCase().includes(search) ||
    (t.tableComment && t.tableComment.toLowerCase().includes(search))
  )
})

function apiTagClass(type: string) {
  const map: Record<string, string> = {
    query: 'text-[var(--success)]',
    create: 'text-blue-500',
    update: 'text-blue-500',
    delete: 'text-[var(--danger)]',
    detail: 'text-purple-500',
  }
  return map[type] || 'text-[var(--text-muted)]'
}

async function loadDicts() {
  const data = await getDictList({ page: 1, limit: 100 })
  dicts.value = data.list || []
}

async function loadFeature() {
  if (!id.value) return
  initialLoading.value = true
  try {
    const data = await getFeatureDetail(parseInt(id.value))
    if (data) {
      Object.assign(formData, data)
      if (data.datasourceId) {
        await loadTables(data.datasourceId)
        if ((!data.columns || data.columns.length === 0) && data.tableName) {
          await loadColumnsForTable(data.datasourceId, data.tableName)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load feature:', error)
  } finally {
    initialLoading.value = false
  }
}

async function loadApis() {
  const data = await getApiListSimple()
  apis.value = data
}

async function loadDataSources() {
  const data = await getDataSources({})
  dataSources.value = data.list || []
}

async function loadTables(dsId: number) {
  let ds = dataSources.value.find(d => d.id === dsId)
  if (!ds) {
    const all = await getDataSources({})
    dataSources.value = all.list || []
    ds = dataSources.value.find(d => d.id === dsId)
  }
  if (ds) {
    const dbName = (ds as any).database_name || (ds as any).dbName || (ds as any).databaseName
    if (dbName) {
      tables.value = await getTableList(dbName)
    }
  }
}

async function loadColumnsForTable(dsId: number, tableName: string) {
  let ds = dataSources.value.find(d => d.id === dsId)
  if (!ds) {
    const all = await getDataSources({})
    dataSources.value = all.list || []
    ds = dataSources.value.find(d => d.id === dsId)
  }
  if (ds && tableName) {
    const dbName = (ds as any).database_name || (ds as any).dbName || (ds as any).databaseName
    if (dbName) {
      const columns = await getTableColumns(dbName, tableName)
      formData.columns = columns.map((col: any) => ({
        fieldName: col.columnName,
        fieldLabel: col.columnComment || col.columnName,
        fieldType: col.dataType?.includes('int') || col.dataType?.includes('decimal') ? 'number' : 'text',
        span: 1,
        visible: true,
        align: 'left' as const,
        queryCondition: false,
      }))
    }
  }
}

function handleDataSourceChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const dsId = val ? parseInt(val) : undefined
  formData.datasourceId = dsId
  formData.tableName = ''
  formData.columns = []
  tables.value = []
  formData.queryApiId = undefined
  formData.queryApiName = ''
  formData.queryApiPath = ''
  formData.createApiId = undefined
  formData.createApiName = ''
  formData.updateApiId = undefined
  formData.updateApiName = ''
  formData.deleteApiId = undefined
  formData.deleteApiName = ''
  formData.detailApiId = undefined
  formData.detailApiName = ''
  if (dsId) loadTables(dsId)
}

async function handleTableSelect(tableName: string) {
  const tableComment = tables.value.find(t => t.tableName === tableName)?.tableComment || ''
  const autoName = tableComment || tableName
  const autoCode = tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/_/g, '')

  formData.tableName = tableName
  tableSearchValue.value = tableName
  tableSearchOpen.value = false

  if (!formData.name) formData.name = autoName
  if (!formData.code) formData.code = autoCode

  if (tableName && formData.datasourceId) {
    const ds = dataSources.value.find(d => d.id === formData.datasourceId)
    const dbName = (ds as any)?.database_name || (ds as any)?.dbName || (ds as any)?.databaseName
    if (dbName) {
      const columns = await getTableColumns(dbName, tableName)
      formData.columns = columns.map((col: any) => ({
        fieldName: col.columnName,
        fieldLabel: col.columnComment || col.columnName,
        fieldType: col.dataType?.includes('int') || col.dataType?.includes('decimal') ? 'number' : 'text',
        span: 1,
        visible: true,
        align: 'left' as const,
        queryCondition: false,
      }))
    }
  }
}

function handleTableClear() {
  formData.tableName = ''
  tableSearchValue.value = ''
  formData.columns = []
  formData.queryApiId = undefined
  formData.queryApiName = ''
  formData.queryApiPath = ''
  formData.createApiId = undefined
  formData.createApiName = ''
  formData.updateApiId = undefined
  formData.updateApiName = ''
  formData.deleteApiId = undefined
  formData.deleteApiName = ''
  formData.detailApiId = undefined
  formData.detailApiName = ''
}

async function handleGenerateApi() {
  if (!formData.datasourceId || !formData.tableName || !formData.code) {
    alert('请先选择数据源、表名和填写功能编码')
    return
  }
  generating.value = true
  try {
    const result = await generateCrudApi(formData.datasourceId, formData.tableName, formData.code)
    if (result) {
      formData.queryApiId = result.queryApi?.id
      formData.queryApiName = result.queryApi?.name
      formData.queryApiPath = result.queryApi?.path
      formData.createApiId = result.createApi?.id
      formData.createApiName = result.createApi?.name
      formData.updateApiId = result.updateApi?.id
      formData.updateApiName = result.updateApi?.name
      formData.deleteApiId = result.deleteApi?.id
      formData.deleteApiName = result.deleteApi?.name
      formData.detailApiId = result.detailApi?.id
      formData.detailApiName = result.detailApi?.name
      loadApis()
      alert('API生成成功！')
    } else {
      alert('API生成失败')
    }
  } catch (error) {
    console.error('Failed to generate API:', error)
    alert('API生成失败: ' + error)
  } finally {
    generating.value = false
  }
}

function handleEditApi(api: any) {
  if (api.id && (window as any).layoutOpenTab) {
    (window as any).layoutOpenTab({ id: `api-${api.id}`, title: `编辑API-${api.name}`, path: `/apis/${api.id}` })
  }
}

function addColumn() {
  formData.columns.push({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'text',
    span: 1,
    visible: true,
    align: 'left',
    queryCondition: false,
  })
}

function removeColumn(index: number) {
  formData.columns.splice(index, 1)
}

async function handleSubmit() {
  saving.value = true
  try {
    const success = await saveFeature(formData as any)
    if (success) {
      router.push('/features')
    }
  } catch (error) {
    console.error('Failed to save feature:', error)
  } finally {
    saving.value = false
  }
}

function handleClickOutside(e: MouseEvent) {
  if (tableSearchRef.value && !tableSearchRef.value.contains(e.target as Node)) {
    tableSearchOpen.value = false
    if (formData.tableName) {
      tableSearchValue.value = formData.tableName
    }
  }
}

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)
  await Promise.all([loadDataSources(), loadApis(), loadDicts()])
  if (isEdit.value) {
    await loadFeature()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

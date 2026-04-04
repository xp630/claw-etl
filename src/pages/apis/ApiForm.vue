<template>
  <div class="flex flex-col h-full">
    <!-- 头部 -->
    <div class="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
      <div class="flex items-center gap-4">
        <button @click="router.push('/apis')" class="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-bold text-[var(--text-primary)]">{{ isEdit ? '编辑API' : '创建API' }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <button @click="router.push('/apis')" class="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">取消</button>
      </div>
    </div>

    <!-- 步骤条 -->
    <div class="flex items-center justify-center gap-4 p-4 border-b border-[var(--border-light)]">
      <div v-for="(step, index) in STEPS" :key="index" class="flex items-center">
        <div
          class="flex items-center justify-center w-8 h-8 rounded-full text-sm"
          :class="{
            'bg-[var(--success)] text-white': index < currentStep,
            'bg-[var(--accent)] text-white': index === currentStep,
            'bg-[var(--bg-secondary)] text-[var(--text-muted)]': index > currentStep
          }"
        >
          {{ index < currentStep ? '✓' : index + 1 }}
        </div>
        <span
          class="ml-2 text-sm"
          :class="index === currentStep ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'"
        >{{ step }}</span>
        <div
          v-if="index < STEPS.length - 1"
          class="w-12 h-0.5 mx-4"
          :class="index < currentStep ? 'bg-[var(--success)]' : 'bg-[var(--bg-secondary)]'"
        />
      </div>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-auto p-6">
      <div v-if="loading" class="flex items-center justify-center h-full text-[var(--text-muted)]">加载中...</div>
      <template v-else>
        <!-- 步骤1: 基本信息 -->
        <div v-show="currentStep === 0" class="space-y-6">
          <div class="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6 space-y-4">
            <h3 class="text-[var(--text-primary)] font-medium">基本信息</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">数据源 * (只显示启用)</label>
                <el-select
                  v-model="formData.datasourceId"
                  placeholder="请选择数据源"
                  class="w-full"
                  @change="handleDataSourceChange"
                >
                  <el-option
                    v-for="ds in datasources"
                    :key="ds.id"
                    :label="ds.name"
                    :value="ds.id"
                  />
                </el-select>
              </div>
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">数据库</label>
                <el-input v-model="formData.databaseName" readonly placeholder="自动填充" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">表 *</label>
                <div class="flex gap-2">
                  <el-select
                    v-model="formData.tableName"
                    placeholder="请选择表"
                    class="flex-1"
                    @change="handleTableChange"
                  >
                    <el-option
                      v-for="t in tables"
                      :key="t.tableName"
                      :label="`${t.tableName} ${t.tableComment ? `(${t.tableComment})` : ''}`"
                      :value="t.tableName"
                    />
                  </el-select>
                  <button
                    @click="refreshTables"
                    class="px-3 py-2 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  >
                    <RefreshCw class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm text-[var(--text-muted)] mb-2">请求方式</label>
                <el-radio-group v-model="formData.method">
                  <el-radio value="GET">GET</el-radio>
                  <el-radio value="POST">POST</el-radio>
                </el-radio-group>
              </div>
            </div>
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">API名称 *</label>
              <el-input v-model="formData.name" placeholder="例如：用户查询" />
            </div>
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">API路径 *</label>
              <el-input v-model="formData.path" placeholder="例如：/api/user/list" />
            </div>
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">权限类型</label>
              <el-radio-group v-model="formData.apiType">
                <el-radio value="private">私有 <span class="text-xs text-[var(--text-muted)] ml-1">(需授权)</span></el-radio>
                <el-radio value="public">公有 <span class="text-xs text-[var(--text-muted)] ml-1">(无需授权)</span></el-radio>
              </el-radio-group>
            </div>
            <div>
              <label class="block text-sm text-[var(--text-muted)] mb-2">描述</label>
              <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="描述" />
            </div>
          </div>
        </div>

        <!-- 步骤2: 参数及SQL配置 -->
        <div v-show="currentStep === 1" class="space-y-6">
          <!-- 请求参数 -->
          <div class="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
            <div class="flex items-center justify-between mb-4">
              <button @click="inputParamsExpanded = !inputParamsExpanded" class="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <span>{{ inputParamsExpanded ? '▼' : '▶' }}</span>
                <span>请求参数（{{ inputParams.length }}）</span>
              </button>
              <div v-if="inputParamsExpanded" class="flex gap-2">
                <el-button size="small" type="success" @click="addInputParam">+ 新增</el-button>
              </div>
            </div>
            <div v-if="inputParamsExpanded" class="overflow-x-auto">
              <el-table :data="inputParams" stripe size="small">
                <el-table-column label="#" width="60" align="center">
                  <template #default="{ $index }">{{ $index + 1 }}</template>
                </el-table-column>
                <el-table-column label="参数名" width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.paramName" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="对应字段" width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.columnName" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="类型" width="120">
                  <template #default="{ row }">
                    <el-select v-model="row.paramType" size="small" class="w-full">
                      <el-option value="string" label="string" />
                      <el-option value="integer" label="integer" />
                      <el-option value="decimal" label="decimal" />
                      <el-option value="date" label="date" />
                      <el-option value="datetime" label="datetime" />
                      <el-option value="boolean" label="boolean" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="必填" width="80" align="center">
                  <template #default="{ row }">
                    <el-checkbox v-model="row.required" :true-value="1" :false-value="0" />
                  </template>
                </el-table-column>
                <el-table-column label="默认值" width="120">
                  <template #default="{ row }">
                    <el-input v-model="row.defaultValue" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="说明">
                  <template #default="{ row }">
                    <el-input v-model="row.description" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="" width="60" align="center">
                  <template #default="{ $index }">
                    <button @click="removeInputParam($index)" class="p-1 text-[var(--danger)] hover:text-red-300">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- 返回值 -->
          <div class="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
            <div class="flex items-center justify-between mb-4">
              <button @click="outputParamsExpanded = !outputParamsExpanded" class="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                <span>{{ outputParamsExpanded ? '▼' : '▶' }}</span>
                <span>返回值（{{ selectedFields.length }}/{{ outputParams.length }}）</span>
              </button>
            </div>
            <div v-if="outputParamsExpanded" class="overflow-x-auto">
              <el-table :data="outputParams" stripe size="small">
                <el-table-column label="#" width="60" align="center">
                  <template #default="{ $index }">{{ $index + 1 }}</template>
                </el-table-column>
                <el-table-column label="字段名" width="150">
                  <template #default="{ row }">
                    <span class="text-[var(--text-primary)]">{{ row.columnName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="别名" width="150">
                  <template #default="{ row, $index }">
                    <el-input v-model="row.alias" size="small" placeholder="输入别名" />
                  </template>
                </el-table-column>
                <el-table-column label="类型" width="120">
                  <template #default="{ row }">
                    <span class="text-[var(--text-muted)]">{{ row.dataType }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="说明">
                  <template #default="{ row }">
                    <el-input v-model="row.description" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="" width="60" align="center">
                  <template #default="{ $index }">
                    <button @click="removeOutputParam($index)" class="p-1 text-[var(--danger)] hover:text-red-300">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- SQL配置 -->
          <div class="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[var(--text-primary)] font-medium">SQL配置</h3>
              <el-button size="small" type="primary" @click="generateSql">重新生成</el-button>
            </div>
            <el-input
              :model-value="formData.querySql || generatedSql"
              type="textarea"
              :rows="12"
              placeholder="编写你的SQL查询语句..."
              class="font-mono"
              @input="formData.querySql = $event"
            />
          </div>
        </div>

        <!-- 步骤3: Mock配置 -->
        <div v-show="currentStep === 2" class="space-y-6">
          <div class="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-[var(--text-primary)] font-medium">Mock配置</h3>
              <el-checkbox v-model="mockEnabled" :true-value="1" :false-value="0">启用Mock</el-checkbox>
            </div>
            <div v-if="mockEnabled === 1" class="space-y-4">
              <el-button size="small" type="primary" @click="generateMockData">根据字段生成</el-button>
              <el-input
                v-model="formData.mockData"
                type="textarea"
                :rows="15"
                placeholder="Mock数据"
                class="font-mono"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部操作栏 -->
    <div class="flex items-center justify-between p-4 border-t border-[var(--border-light)]">
      <button
        @click="currentStep = Math.max(0, currentStep - 1)"
        :disabled="currentStep === 0"
        class="flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50"
      >
        <ArrowLeft class="w-4 h-4" />上一步
      </button>
      <div class="flex items-center gap-2">
        <template v-if="currentStep === STEPS.length - 1">
          <el-button @click="router.push('/apis')">取消</el-button>
          <el-button type="primary" :loading="saving" :disabled="!canSave()" @click="handleSave">
            <Save class="w-4 h-4 mr-1" />保存
          </el-button>
        </template>
        <template v-else>
          <el-button type="primary" :disabled="!canProceed()" @click="currentStep++">
            下一步<ArrowRight class="w-4 h-4 ml-1" />
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Save, RefreshCw, Trash2 } from 'lucide-vue-next'
import {
  getDataSources,
  getTableList,
  getTableColumns,
  saveApi,
  getApiDetail
} from '@/lib/api'

const STEPS = ['基本信息', '参数及SQL配置', 'Mock配置']

// 生成随机16位字符串
const generateRandomString = (length: number = 16): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

interface DataSource {
  id?: number
  name?: string
  databaseName?: string
  database_name?: string
  dbName?: string
}

interface TableInfo {
  tableName: string
  tableComment?: string
}

interface ColumnInfo {
  columnName: string
  columnComment?: string
  dataType: string
}

interface ApiInputParam {
  paramName: string
  columnName: string
  paramType: string
  required: number
  defaultValue: string
  description: string
}

interface ApiOutputParam {
  columnName: string
  alias: string
  dataType: string
  description: string
}

const router = useRouter()
const route = useRoute()

const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!id.value)

const currentStep = ref(0)
const inputParamsExpanded = ref(true)
const outputParamsExpanded = ref(true)
const loading = ref(false)
const saving = ref(false)
const apiParamsLoaded = ref(false)
const datasourcesLoaded = ref(false)
const isLoadingApiDetail = ref(false)

const datasources = ref<DataSource[]>([])
const tables = ref<TableInfo[]>([])
const columns = ref<ColumnInfo[]>([])

const formData = ref({
  name: '',
  path: '',
  method: 'POST',
  datasourceId: undefined as number | undefined,
  datasourceName: '',
  databaseName: '',
  tableName: '',
  apiType: 'private',
  description: '',
  querySql: '',
  mockEnabled: 1,
  mockData: '',
  status: 1,
  source: 'manual',
})

const inputParams = ref<ApiInputParam[]>([])
const outputParams = ref<ApiOutputParam[]>([])
const selectedFields = ref<string[]>([])
const generatedSql = ref('')
const mockEnabled = computed({
  get: () => formData.value.mockEnabled,
  set: (val) => { formData.value.mockEnabled = val }
})

watch([() => formData.value.databaseName, () => formData.value.tableName, datasourcesLoaded], () => {
  if (formData.value.databaseName && formData.value.tableName && datasourcesLoaded.value) {
    loadColumns(formData.value.databaseName, formData.value.tableName)
  }
}, { immediate: true })

watch([inputParams, outputParams, selectedFields, () => formData.value.tableName], () => {
  if (outputParams.value.length > 0 && formData.value.tableName) {
    generateSql()
  }
})

onMounted(async () => {
  await loadDataSources()
  if (isEdit.value && id.value) {
    await loadApiDetail(parseInt(id.value))
  }
})

async function loadDataSources() {
  try {
    // 尝试使用新版API
    let data: any
    try {
      const res = await getDataSources({ page: 1, limit: 100 })
      data = res.list
    } catch {
      // 如果失败，尝试旧版API
      const res = await getDatasourceList({ page: 1, limit: 100 })
      data = res.list
    }
    const activeDatasources = (data || []).filter((ds: DataSource) => ds.status === 1 || ds.status === undefined)
    datasources.value = activeDatasources

    // 检查URL参数
    const datasourceId = route.query.datasourceId as string
    const tableName = route.query.tableName as string

    if (datasourceId) {
      const dsId = parseInt(datasourceId)
      const ds = activeDatasources.find((d: DataSource) => d.id === dsId)
      if (ds) {
        datasourcesLoaded.value = true
        const dbName = ds.databaseName || (ds as any).database_name || (ds as any).dbName || ''
        formData.value = {
          ...formData.value,
          datasourceId: ds.id,
          datasourceName: ds.name,
          databaseName: dbName,
          tableName: tableName || '',
        }
        if (tableName) {
          const tableList = await loadTables(dbName)
          const currentTable = tableList.find((t: TableInfo) => t.tableName === tableName)
          const tableComment = currentTable?.tableComment || tableName
          const random5 = generateRandomString(5)
          formData.value.name = `${tableComment}_${random5}`
          formData.value.path = `/api/${tableName}/${random5}`
        }
      }
    } else {
      datasourcesLoaded.value = true
    }
  } catch (error) {
    console.error('Failed to load datasources:', error)
    datasourcesLoaded.value = true
  }
}

async function loadTables(database: string): Promise<TableInfo[]> {
  try {
    const data = await getTableList(database)
    tables.value = data || []
    return tables.value
  } catch (error) {
    console.error('Failed to load tables:', error)
    return []
  }
}

async function loadColumns(dbName: string, tableName: string) {
  try {
    const data = await getTableColumns(dbName, tableName)
    columns.value = data || []
    if (!apiParamsLoaded.value && !isLoadingApiDetail.value) {
      autoGenerateParams(data)
    }
  } catch (error) {
    console.error('Failed to load columns:', error)
  }
}

async function loadApiDetail(apiId: number) {
  loading.value = true
  isLoadingApiDetail.value = true
  try {
    const data = await getApiDetail(apiId)
    if (data) {
      formData.value = {
        name: data.name || '',
        path: data.path || '',
        method: data.method || 'POST',
        datasourceId: data.datasourceId,
        datasourceName: data.datasourceName || '',
        databaseName: data.databaseName || '',
        tableName: data.tableName || '',
        apiType: data.apiType || 'private',
        description: data.description || '',
        querySql: data.querySql || '',
        mockEnabled: data.mockEnabled ?? 1,
        mockData: data.mockData || '',
        status: data.status ?? 1,
        source: data.source || 'manual',
      }
      if (data.inputParams) {
        inputParams.value = data.inputParams
      }
      if (data.outputParams) {
        outputParams.value = data.outputParams
        selectedFields.value = data.outputParams.map((p: any) => p.columnName)
      }
      apiParamsLoaded.value = true
      currentStep.value = 0
      outputParamsExpanded.value = false

      // 如果有数据源，加载表
      if (formData.value.databaseName) {
        await loadTables(formData.value.databaseName)
      }
    }
  } catch (error) {
    console.error('Failed to load API detail:', error)
  } finally {
    isLoadingApiDetail.value = false
    loading.value = false
  }
}

function autoGenerateParams(cols: ColumnInfo[]) {
  const inputs: ApiInputParam[] = cols.map(col => ({
    paramName: col.columnName,
    columnName: col.columnName,
    paramType: mapDataType(col.dataType),
    required: 0,
    defaultValue: '',
    description: col.columnComment || '',
  }))
  inputParams.value = [...inputs]

  const outputs: ApiOutputParam[] = cols.map(col => ({
    columnName: col.columnName,
    alias: col.columnName,
    dataType: col.dataType,
    description: col.columnComment || '',
  }))
  outputParams.value = outputs
  selectedFields.value = cols.map(c => c.columnName)
}

function mapDataType(dataType: string): string {
  const type = dataType.toLowerCase()
  if (type.includes('int') || type.includes('bigint')) return 'integer'
  if (type.includes('decimal') || type.includes('float') || type.includes('double')) return 'decimal'
  if (type.includes('date') && !type.includes('time')) return 'date'
  if (type.includes('time')) return 'datetime'
  if (type.includes('bool')) return 'boolean'
  return 'string'
}

function handleDataSourceChange(dsId: number) {
  const ds = datasources.value.find(d => d.id === dsId)
  if (ds) {
    const dbName = ds.databaseName || (ds as any).database_name || (ds as any).dbName || ''
    formData.value = {
      ...formData.value,
      datasourceId: ds.id,
      datasourceName: ds.name,
      databaseName: dbName,
      tableName: '',
    }
    tables.value = []
    columns.value = []
    inputParams.value = []
    outputParams.value = []
    selectedFields.value = []
    if (dbName) {
      loadTables(dbName)
    }
  }
}

function handleTableChange(tableName: string) {
  formData.value.tableName = tableName
}

function refreshTables() {
  if (formData.value.databaseName) {
    loadTables(formData.value.databaseName)
  }
}

function addInputParam() {
  inputParams.value.push({
    paramName: '',
    columnName: '',
    paramType: 'string',
    required: 0,
    defaultValue: '',
    description: '',
  })
}

function removeInputParam(index: number) {
  inputParams.value.splice(index, 1)
}

function removeOutputParam(index: number) {
  outputParams.value.splice(index, 1)
  const param = outputParams.value[index]
  if (param) {
    selectedFields.value = selectedFields.value.filter(f => f !== param.columnName)
  }
}

function getOperator(paramType: string): string {
  switch (paramType) {
    case 'string': return 'LIKE'
    default: return '='
  }
}

function generateSql() {
  const tableName = formData.value.tableName
  if (!tableName) return

  const queryFields = outputParams.value
    .filter(p => selectedFields.value.includes(p.columnName))
    .map(p => {
      if (p.alias && p.alias !== p.columnName) {
        return `${p.columnName} AS ${p.alias}`
      }
      return p.columnName
    })
    .join(', ')

  const whereConditions = inputParams.value
    .filter(p => p.columnName)
    .map(p => {
      const operator = getOperator(p.paramType)
      if (p.paramType === 'string') {
        return `  <if test="${p.paramName} != null and ${p.paramName} != ''">
    AND ${p.columnName} LIKE CONCAT('%', #{${p.paramName}}, '%')
  </if>`
      }
      return `  <if test="${p.paramName} != null">
    AND ${p.columnName} ${operator} #{${p.paramName}}
  </if>`
    })
    .join('\n')

  const sql = `SELECT ${queryFields || '*'}
FROM ${tableName}
<where>
${whereConditions || '  1=1'}
</where>`

  generatedSql.value = sql
}

function generateMockData() {
  const mockList = Array.from({ length: 3 }, (_, rowIndex) => {
    const record: Record<string, any> = {}
    selectedFields.value.forEach((field, colIndex) => {
      const param = inputParams.value.find(p => p.columnName === field)
      record[field] = getMockValue(param?.paramType || 'string', rowIndex * selectedFields.value.length + colIndex)
    })
    return record
  })

  const mock: any = {
    code: 1,
    data: {
      list: mockList,
      total: 100,
      page: 1,
      pageSize: 10,
    },
    msg: 'success',
  }
  formData.value.mockData = JSON.stringify(mock, null, 2)
}

function getMockValue(type: string, index: number): any {
  switch (type) {
    case 'integer': return index + 1
    case 'decimal': return (index + 1) * 1.5
    case 'boolean': return true
    case 'date': return '2026-01-01'
    case 'datetime': return '2026-01-01 10:00:00'
    default: return `sample${index + 1}`
  }
}

async function handleSave() {
  saving.value = true
  try {
    const finalSql = formData.value.querySql || generatedSql.value
    const selectedOutputParams = outputParams.value.filter(p => selectedFields.value.includes(p.columnName))

    const finalFormData = {
      ...formData.value,
      querySql: finalSql,
      inputParams: inputParams.value,
      outputParams: selectedOutputParams,
    }

    await saveApi(finalFormData)
    ElMessage.success('保存成功')
    router.push('/apis')
  } catch (error) {
    console.error('Failed to save API:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function canProceed(): boolean {
  switch (currentStep.value) {
    case 0:
      return !!(formData.value.name && formData.value.path && formData.value.datasourceId && formData.value.tableName)
    case 1:
      return !!(inputParams.value.length > 0 && selectedFields.value.length > 0)
    default:
      return true
  }
}

function canSave(): boolean {
  return !!(
    formData.value.name &&
    formData.value.path &&
    formData.value.datasourceId &&
    formData.value.tableName &&
    selectedFields.value.length > 0
  )
}
</script>

<style scoped>
:deep(.el-input__wrapper) {
  background: var(--bg-hover-light);
  box-shadow: none;
  border: 1px solid var(--border-light);
}
:deep(.el-input__inner) {
  color: var(--text-primary);
}
:deep(.el-radio) {
  color: var(--text-primary);
}
:deep(.el-textarea__inner) {
  background: var(--bg-hover-light);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}
:deep(.el-select) {
  width: 100%;
}
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--bg-table-header);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-border-color: var(--border-light);
  --el-table-text-color: var(--text-primary);
  --el-table-muted-color: var(--text-muted);
}
</style>

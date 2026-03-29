<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
          <Eye class="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">API访问日志</h1>
          <p class="text-xs text-[var(--text-muted)]">记录API调用详情</p>
        </div>
      </div>
      <el-button type="primary" @click="handleExport">
        <Download class="w-4 h-4 mr-1" />导出日志
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] p-4 mb-6">
      <div class="grid grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-[var(--text-muted)] mb-2">API名称</label>
          <el-input v-model="filters.keyword" placeholder="搜索API名称" clearable @keyup.enter="loadLogs" />
        </div>
        <div>
          <label class="block text-sm text-[var(--text-muted)] mb-2">开始时间</label>
          <el-date-picker
            v-model="filters.startTime"
            type="datetime"
            placeholder="选择开始时间"
            class="w-full"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </div>
        <div>
          <label class="block text-sm text-[var(--text-muted)] mb-2">结束时间</label>
          <el-date-picker
            v-model="filters.endTime"
            type="datetime"
            placeholder="选择结束时间"
            class="w-full"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </div>
        <div>
          <label class="block text-sm text-[var(--text-muted)] mb-2">响应状态</label>
          <el-select v-model="filters.responseStatus" placeholder="全部" clearable class="w-full">
            <el-option value="200" label="成功 (200)" />
            <el-option value="400" label="客户端错误 (400)" />
            <el-option value="500" label="服务端错误 (500)" />
          </el-select>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <el-button type="primary" @click="loadLogs">
          <RefreshCw class="w-4 h-4 mr-1" />刷新
        </el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="bg-[var(--danger)]/10 border border-red-500/30 rounded-xl p-4 mb-6 text-[var(--danger)]">
      {{ error }}
    </div>

    <!-- 日志列表 -->
    <div class="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] overflow-hidden">
      <el-table
        v-loading="loading"
        :data="logs"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="accessTime" label="时间" width="160">
          <template #default="{ row }">
            <span class="text-[var(--text-secondary)] truncate text-sm">{{ row.accessTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="API" min-width="150">
          <template #default="{ row }">
            <div class="text-[var(--text-primary)]">{{ row.apiName }}</div>
            <div class="text-[var(--text-muted)] text-xs">{{ row.apiPath }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="appName" label="应用" width="120">
          <template #default="{ row }">
            <span class="text-[var(--text-secondary)] truncate text-sm">{{ row.appName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="请求方式" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.requestMethod === 'GET' ? 'success' : 'primary'"
              size="small"
            >
              {{ row.requestMethod }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="getStatusClass(row.responseStatus)" class="font-medium">
              {{ row.responseStatus || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="响应时间" width="100">
          <template #default="{ row }">
            <span class="text-[var(--text-secondary)] truncate text-sm">
              {{ row.responseTime ? `${row.responseTime}ms` : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="clientIp" label="客户端IP" width="140">
          <template #default="{ row }">
            <span class="text-[var(--text-muted)] truncate text-sm">{{ row.clientIp || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click.stop="showDetail(row)">
              <Eye class="w-4 h-4" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end p-4 border-t border-[var(--border-light)]">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="访问详情"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedLog" class="space-y-6">
        <!-- 基本信息 -->
        <div>
          <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">基本信息</h4>
          <div class="grid grid-cols-2 gap-4 bg-[var(--bg-table-header)] p-4 rounded-lg">
            <div>
              <div class="text-xs text-[var(--text-muted)]">API名称</div>
              <div class="text-[var(--text-primary)]">{{ selectedLog.apiName }}</div>
            </div>
            <div>
              <div class="text-xs text-[var(--text-muted)]">API路径</div>
              <div class="text-[var(--text-primary)] font-mono text-sm">{{ selectedLog.apiPath }}</div>
            </div>
            <div>
              <div class="text-xs text-[var(--text-muted)]">访问时间</div>
              <div class="text-[var(--text-primary)]">{{ selectedLog.accessTime }}</div>
            </div>
            <div>
              <div class="text-xs text-[var(--text-muted)]">响应状态</div>
              <div :class="getStatusClass(selectedLog.responseStatus)" class="font-medium">
                {{ selectedLog.responseStatus || '-' }}
              </div>
            </div>
            <div>
              <div class="text-xs text-[var(--text-muted)]">响应时间</div>
              <div class="text-[var(--text-primary)]">{{ selectedLog.responseTime ? `${selectedLog.responseTime}ms` : '-' }}</div>
            </div>
            <div>
              <div class="text-xs text-[var(--text-muted)]">客户端IP</div>
              <div class="text-[var(--text-primary)]">{{ selectedLog.clientIp || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- 请求参数 -->
        <div>
          <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">请求参数</h4>
          <pre class="bg-[var(--bg-table-header)] p-4 rounded-lg text-sm text-[var(--text-secondary)] overflow-auto max-h-40">{{ formatJson(selectedLog.requestParams) }}</pre>
        </div>

        <!-- 响应数据 -->
        <div v-if="selectedLog.responseData">
          <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">响应数据</h4>
          <pre class="bg-[var(--bg-table-header)] p-4 rounded-lg text-sm text-[var(--text-secondary)] overflow-auto max-h-60">{{ formatJson(selectedLog.responseData) }}</pre>
        </div>

        <!-- 错误信息 -->
        <div v-if="selectedLog.errorMsg">
          <h4 class="text-sm font-medium text-[var(--danger)] mb-3">错误信息</h4>
          <div class="bg-[var(--danger)]/10 border border-red-500/30 p-4 rounded-lg text-red-300 text-sm">
            {{ selectedLog.errorMsg }}
          </div>
        </div>

        <!-- 用户代理 -->
        <div v-if="selectedLog.userAgent">
          <h4 class="text-sm font-medium text-[var(--text-muted)] mb-3">用户代理</h4>
          <div class="bg-[var(--bg-table-header)] p-4 rounded-lg text-xs text-[var(--text-muted)] break-all">
            {{ selectedLog.userAgent }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Eye, Download, RefreshCw } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

interface AccessLog {
  id: number
  apiId: number
  apiName: string
  apiPath: string
  appId?: number
  appName?: string
  accessTime: string
  requestMethod: string
  requestParams?: string
  responseStatus?: number
  responseTime?: number
  responseData?: string
  errorMsg?: string
  clientIp?: string
  userAgent?: string
}

// 模拟数据
const MOCK_LOGS: AccessLog[] = [
  {
    id: 1,
    apiId: 1,
    apiName: '用户查询',
    apiPath: '/api/user/list',
    appId: 1,
    appName: 'Web应用',
    accessTime: '2026-03-11 23:15:30',
    requestMethod: 'POST',
    requestParams: '{"page":1,"pageSize":10}',
    responseStatus: 200,
    responseTime: 125,
    responseData: '{"code":1,"data":{"list":[]}}',
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  },
  {
    id: 2,
    apiId: 2,
    apiName: '订单查询',
    apiPath: '/api/order/list',
    appId: 2,
    appName: '移动App',
    accessTime: '2026-03-11 23:14:20',
    requestMethod: 'POST',
    requestParams: '{"status":1}',
    responseStatus: 500,
    responseTime: 50,
    errorMsg: 'SQL执行异常',
    clientIp: '192.168.1.101'
  },
  {
    id: 3,
    apiId: 1,
    apiName: '用户查询',
    apiPath: '/api/user/list',
    accessTime: '2026-03-11 23:10:15',
    requestMethod: 'GET',
    responseStatus: 404,
    responseTime: 10,
    errorMsg: 'API不存在',
    clientIp: '192.168.1.102'
  },
]

const logs = ref<AccessLog[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const detailVisible = ref(false)
const selectedLog = ref<AccessLog | null>(null)

const filters = reactive({
  keyword: '',
  startTime: '',
  endTime: '',
  responseStatus: '' as string | number | undefined,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

onMounted(() => {
  loadLogs()
})

async function loadLogs() {
  loading.value = true
  error.value = null
  try {
    // TODO: 调用后端接口
    // 模拟接口返回
    await new Promise(resolve => setTimeout(resolve, 500))
    logs.value = MOCK_LOGS
    pagination.total = MOCK_LOGS.length
  } catch (err: any) {
    console.error('Failed to load logs:', err)
    error.value = '加载日志失败'
  } finally {
    loading.value = false
  }
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

function formatJson(str: string | undefined): string {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

function getStatusClass(status: number | undefined): string {
  if (!status) return 'text-[var(--text-muted)]'
  if (status >= 200 && status < 300) return 'text-[var(--success)]'
  if (status >= 400 && status < 500) return 'text-[var(--warning)]'
  if (status >= 500) return 'text-[var(--danger)]'
  return 'text-[var(--text-muted)]'
}

function showDetail(log: AccessLog) {
  selectedLog.value = log
  detailVisible.value = true
}

function handleRowClick(row: AccessLog) {
  showDetail(row)
}
</script>

<style scoped>
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--bg-table-header);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-border-color: var(--border-light);
  --el-table-text-color: var(--text-primary);
  --el-table-muted-color: var(--text-muted);
}
:deep(.el-table tr) {
  cursor: pointer;
}
:deep(.el-input__wrapper) {
  background: var(--bg-hover-light);
  box-shadow: none;
  border: 1px solid var(--border-light);
}
:deep(.el-input__inner) {
  color: var(--text-primary);
}
:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: var(--text-muted);
  --el-pagination-button-bg-color: var(--bg-secondary);
  --el-pagination-hover-color: var(--accent);
}
</style>

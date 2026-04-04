<template>
  <div class="config-page p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">系统参数</h1>
    </div>

    <!-- 搜索条件 -->
    <div class="mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <el-form :inline="true" :model="searchForm" class="flex flex-wrap gap-4 items-end">
        <el-form-item label="参数名称" class="flex-1 min-w-[200px]">
          <el-input v-model="searchForm.name" placeholder="搜索参数名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="参数编码">
          <el-input v-model="searchForm.code" placeholder="搜索参数编码" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="searchForm.groupName" placeholder="搜索分组" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <div class="flex justify-between items-center mb-4">
        <span class="text-sm text-[var(--text-muted)]">共 {{ total }} 条</span>
        <el-button type="primary" @click="handleCreate">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增参数
        </el-button>
      </div>

      <el-table v-loading="loading" :data="configs" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="参数名称" min-width="150" />
        <el-table-column prop="code" label="参数编码" width="180" />
        <el-table-column prop="groupName" label="分组" width="120" />
        <el-table-column prop="value" label="参数值" min-width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column prop="sort" label="排序" width="60" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增参数' : '编辑参数'"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="参数名称" required>
          <el-input v-model="formData.name" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数编码" required>
          <el-input v-model="formData.code" placeholder="请输入参数编码" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="formData.groupName" placeholder="请输入分组" />
        </el-form-item>
        <el-form-item label="参数值" required>
          <el-input v-model="formData.value" placeholder="请输入参数值" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.type" placeholder="请选择" class="w-full">
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="布尔" value="boolean" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sort" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSystemConfigList, saveSystemConfig, deleteSystemConfig } from '@/lib/api'

interface SystemConfig {
  id?: number
  name?: string
  code?: string
  value?: string
  type?: string
  groupName?: string
  description?: string
  sort?: number
  status?: number
}

const configs = ref<SystemConfig[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const route = useRoute()
const router = useRouter()

const searchForm = reactive({
  name: '',
  code: '',
  groupName: '',
})

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)

const formData = reactive<SystemConfig>({
  name: '',
  code: '',
  value: '',
  type: 'text',
  groupName: '',
  description: '',
  sort: 0,
  status: 1,
})

async function loadData() {
  loading.value = true
  try {
    const data = await getSystemConfigList({
      page: page.value,
      limit: limit.value,
      name: searchForm.name || undefined,
      code: searchForm.code || undefined,
      groupName: searchForm.groupName || undefined,
    })
    configs.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('Failed to load configs:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.groupName = ''
  page.value = 1
  loadData()
}

function handleSizeChange() {
  page.value = 1
  loadData()
}

function handlePageChange() {
  loadData()
}

function handleCreate() {
  dialogMode.value = 'create'
  Object.assign(formData, {
    id: undefined,
    name: '',
    code: '',
    value: '',
    type: 'text',
    groupName: '',
    description: '',
    sort: 0,
    status: 1,
  })
  dialogVisible.value = true
}

function handleEdit(row: SystemConfig) {
  dialogMode.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleSave() {
  if (!formData.name || !formData.code || !formData.value) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    await saveSystemConfig(formData)
    ElMessage.success(dialogMode.value === 'create' ? '创建成功' : '更新成功')
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该参数吗？', '提示', { type: 'warning' })
    await deleteSystemConfig(id)
    ElMessage.success('删除成功')
    if (configs.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadData()
  // 处理路由参数 /config/new 或 /config/:id -> query 方式
  const configId = route.query.id
  if (route.query.mode === 'create') {
    handleCreate()
  } else if (configId) {
    const config = configs.value.find(c => String(c.id) === String(configId))
    if (config) {
      handleEdit(config)
    } else {
      loadData().then(() => {
        const c = configs.value.find(c => String(c.id) === String(configId))
        if (c) handleEdit(c)
      })
    }
  }
})
</script>

<style scoped>
.config-page {
  background: var(--bg-primary);
  min-height: 100%;
}
</style>

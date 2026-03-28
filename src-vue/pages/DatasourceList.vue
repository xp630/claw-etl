<template>
  <div class="datasource-page p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">数据源管理</h1>
    </div>

    <!-- 搜索条件 -->
    <div class="mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <el-form :inline="true" :model="searchForm" class="flex flex-wrap gap-4 items-end">
        <el-form-item label="数据源名称" class="flex-1 min-w-[200px]">
          <el-input v-model="searchForm.name" placeholder="搜索名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="数据库类型">
          <el-select v-model="searchForm.dataType" placeholder="全部" clearable class="w-32">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="SQL Server" value="sqlserver" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.dbState" placeholder="全部" clearable class="w-24">
            <el-option label="启用" value="启用" />
            <el-option label="禁用" value="禁用" />
          </el-select>
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
          新增数据源
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="datasources"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="数据源名称" min-width="150" />
        <el-table-column prop="dataType" label="数据库类型" width="120">
          <template #default="{ row }">
            {{ getTypeLabel(row.dataType) }}
          </template>
        </el-table-column>
        <el-table-column prop="dbState" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.dbState === '启用' ? 'success' : 'danger'" size="small">
              {{ row.dbState }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dbHost" label="主机" min-width="150" show-overflow-tooltip />
        <el-table-column prop="dbPort" label="端口" width="80" />
        <el-table-column prop="dbName" label="数据库" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="handleTest(row.id)">测试</el-button>
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
      :title="dialogMode === 'create' ? '新增数据源' : '编辑数据源'"
      width="600px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据库类型" prop="dataType">
          <el-select v-model="formData.dataType" placeholder="请选择" class="w-full">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="SQL Server" value="sqlserver" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机" prop="dbHost">
          <el-input v-model="formData.dbHost" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" prop="dbPort">
          <el-input v-model="formData.dbPort" placeholder="请输入端口" />
        </el-form-item>
        <el-form-item label="数据库" prop="dbName">
          <el-input v-model="formData.dbName" placeholder="请输入数据库名称" />
        </el-form-item>
        <el-form-item label="用户名" prop="dbUser">
          <el-input v-model="formData.dbUser" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="dbPassword">
          <el-input v-model="formData.dbPassword" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.dbState">
            <el-radio label="启用" />
            <el-radio label="禁用" />
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getDataSources, createDataSource, updateDataSource, deleteDataSource, testDataSource } from '@/lib/api'

const router = useRouter()

// 类型定义
interface DataSource {
  id?: number
  name?: string
  dataType?: string
  dbHost?: string
  dbPort?: string
  dbName?: string
  dbUser?: string
  dbPassword?: string
  dbState?: string
}

// 状态
const datasources = ref<DataSource[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const limit = ref(10)

const searchForm = reactive({
  name: '',
  dataType: '',
  dbState: '',
})

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const formRef = ref()

const formData = reactive<DataSource>({
  name: '',
  dataType: '',
  dbHost: '',
  dbPort: '',
  dbName: '',
  dbUser: '',
  dbPassword: '',
  dbState: '启用',
})

const formRules = {
  name: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
  dbHost: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  dbPort: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  dbName: [{ required: true, message: '请输入数据库名称', trigger: 'blur' }],
  dbUser: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
}

// 类型标签
function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
  }
  return map[type] || type
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const data = await getDataSources({
      page: page.value,
      limit: limit.value,
      name: searchForm.name || undefined,
      dataType: searchForm.dataType || undefined,
      dbState: searchForm.dbState || undefined,
    })
    datasources.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error('Failed to load datasources:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  page.value = 1
  loadData()
}

// 重置
function handleReset() {
  searchForm.name = ''
  searchForm.dataType = ''
  searchForm.dbState = ''
  page.value = 1
  loadData()
}

// 分页
function handleSizeChange() {
  page.value = 1
  loadData()
}

function handlePageChange() {
  loadData()
}

// 新增
function handleCreate() {
  router.push('/datasources/new')
}

// 编辑
function handleEdit(row: DataSource) {
  router.push(`/datasources/${row.id}`)
}

// 保存
async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    if (dialogMode.value === 'create') {
      await createDataSource(formData)
      ElMessage.success('创建成功')
    } else {
      await updateDataSource(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    if (error !== false) { // 校验失败不提示
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 测试
async function handleTest(id: number) {
  try {
    const result = await testDataSource(id)
    ElMessage.success(result.message || '连接成功')
  } catch (error: any) {
    ElMessage.error(error.message || '连接失败')
  }
}

// 删除
async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除该数据源吗？', '提示', {
      type: 'warning',
    })
    await deleteDataSource(id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.datasource-page {
  background: var(--bg-primary);
  min-height: 100%;
}
</style>

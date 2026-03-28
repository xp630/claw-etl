<template>
  <div class="datasource-form p-6">
    <!-- 标题 -->
    <div class="flex items-center gap-3 mb-6">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div>
        <h1 class="text-xl font-bold text-[var(--text-primary)]">{{ isEdit ? '编辑数据源' : '新增数据源' }}</h1>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-blue-500/30 p-6 mb-4">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-1 h-5 bg-[var(--info)] rounded-full"></div>
        <h3 class="text-base font-medium text-[var(--info)]">基本信息</h3>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <el-form-item label="数据源名称" required>
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="用途" required>
          <el-select v-model="formData.dataType" class="w-full">
            <el-option label="源数据库" value="source" />
            <el-option label="目标数据库" value="target" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源类型" required>
          <el-select v-model="formData.type" class="w-full" @change="handleTypeChange">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="Oracle" value="oracle" />
            <el-option label="SQL Server" value="sqlserver" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" placeholder="请输入描述信息（可选）" />
        </el-form-item>
      </div>
    </div>

    <!-- 连接信息 -->
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-emerald-500/30 p-6 mb-4">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-1 h-5 bg-emerald-500 rounded-full"></div>
        <h3 class="text-base font-medium text-emerald-400">连接信息</h3>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <el-form-item label="JDBC连接地址" required class="col-span-2">
          <el-input v-model="formData.jdbcUrl" placeholder="jdbc:mysql://localhost:3306/database" />
        </el-form-item>
        <el-form-item label="检查SQL" required>
          <el-input v-model="formData.dbCheckUrl" placeholder="select 1" />
        </el-form-item>
        <el-form-item label="用户名" required>
          <el-input v-model="formData.username" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="formData.password" type="password" placeholder="请输入" show-password />
        </el-form-item>
        <el-form-item label="数据库名" required>
          <el-input v-model="formData.database_name" placeholder="请输入" />
        </el-form-item>
      </div>
    </div>

    <!-- 扩展信息 -->
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--accent-light)] p-6 mb-4">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
        <h3 class="text-base font-medium text-[var(--accent)]">扩展信息</h3>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <el-form-item label="最大连接数">
          <el-input-number v-model="formData.maxConnections" :min="1" class="w-full" />
        </el-form-item>
        <el-form-item label="初始化连接数">
          <el-input-number v-model="formData.initialConnections" :min="1" class="w-full" />
        </el-form-item>
        <el-form-item label="最大空闲数">
          <el-input-number v-model="formData.maxIdle" :min="1" class="w-full" />
        </el-form-item>
        <el-form-item label="最大等待时间(毫秒)" required>
          <el-input-number v-model="formData.maxWait" :min="0" class="w-full" />
        </el-form-item>
        <el-form-item label="扩展参数" class="col-span-2">
          <el-input v-model="formData.extraParams" placeholder="例如: useSSL=false&serverTimezone=UTC" />
        </el-form-item>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="flex justify-between mt-6">
      <el-button @click="handleTest" :loading="testing">
        <el-icon class="mr-1"><Connection /></el-icon>
        测试连接
      </el-button>
      <div class="flex gap-3">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          <el-icon class="mr-1"><Finished /></el-icon>
          保存
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Connection, Finished } from '@element-plus/icons-vue'
import { getDataSource, createDataSource, updateDataSource, testDataSource } from '@/lib/api'

const router = useRouter()
const route = useRoute()

const id = computed(() => route.params.id as string)
const isEdit = computed(() => Boolean(id.value))

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)

const DEFAULT_JDBC_URLS: Record<string, string> = {
  mysql: 'jdbc:mysql://localhost:3306/database',
  postgresql: 'jdbc:postgresql://localhost:5432/database',
  oracle: 'jdbc:oracle:thin:@localhost:1521:ORCL',
  sqlserver: 'jdbc:sqlserver://localhost:1433;databaseName=database',
}

const DEFAULT_DB_CHECK_URLS: Record<string, string> = {
  mysql: 'select 1',
  postgresql: 'select 1',
  oracle: 'select 1 from dual',
  sqlserver: 'select 1',
}

interface DataSource {
  name?: string
  type?: string
  dataType?: string
  jdbcUrl?: string
  dbCheckUrl?: string
  username?: string
  password?: string
  database_name?: string
  maxConnections?: number
  initialConnections?: number
  maxIdle?: number
  maxWait?: number
  extraParams?: string
  description?: string
}

const formData = reactive<DataSource>({
  name: '',
  type: 'mysql',
  dataType: 'source',
  jdbcUrl: DEFAULT_JDBC_URLS.mysql,
  dbCheckUrl: DEFAULT_DB_CHECK_URLS.mysql,
  username: '',
  password: '',
  database_name: '',
  maxConnections: 10,
  initialConnections: 5,
  maxIdle: 10,
  maxWait: 30000,
  extraParams: '',
  description: '',
})

function handleTypeChange(type: string) {
  formData.jdbcUrl = DEFAULT_JDBC_URLS[type] || ''
  formData.dbCheckUrl = DEFAULT_DB_CHECK_URLS[type] || ''
}

function goBack() {
  router.push('/datasources')
}

function canSave(): boolean {
  return Boolean(formData.name && formData.jdbcUrl && formData.username && formData.database_name && formData.maxWait && formData.maxWait > 0)
}

async function handleTest() {
  if (!canSave()) {
    ElMessage.error('请填写完整信息')
    return
  }
  testing.value = true
  try {
    const result = await testDataSource(formData as any)
    ElMessage.success(result.message || '连接成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '测试连接失败')
  } finally {
    testing.value = false
  }
}

async function handleSubmit() {
  if (!canSave()) {
    ElMessage.error('请填写必填项')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && id.value) {
      await updateDataSource(parseInt(id.value), formData as any)
      ElMessage.success('更新成功')
    } else {
      await createDataSource(formData as any)
      ElMessage.success('创建成功')
    }
    router.push('/datasources')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value && id.value) {
    loading.value = true
    try {
      const data = await getDataSource(parseInt(id.value))
      if (data) {
        Object.assign(formData, data)
      }
    } catch (error) {
      console.error('Failed to load datasource:', error)
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped>
.datasource-form {
  background: var(--bg-primary);
  min-height: 100%;
}
</style>

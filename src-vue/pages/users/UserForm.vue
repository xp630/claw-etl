<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="flex items-center gap-3 mb-6">
      <el-button text @click="router.back()">
        <el-icon size="20"><ArrowLeft /></el-icon>
      </el-button>
      <div class="flex items-center gap-3">
        <el-icon size="24" color="var(--accent)"><User /></el-icon>
        <h1 class="text-xl font-bold">{{ isEdit ? '编辑用户' : '新增用户' }}</h1>
      </div>
    </div>

    <!-- 表单 -->
    <div class="bg-[var(--bg-secondary)]00 rounded-xl border border-[var(--border-light)]00 p-6">
      <el-form :model="formData" label-position="top" class="max-w-2xl">
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
            <h3 class="text-base font-medium text-[var(--accent)]">基本信息</h3>
          </div>
        </div>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号" required>
              <el-input v-model="formData.employeeNo" placeholder="请输入工号" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="手机号" required>
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-select v-model="formData.status" class="w-full">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item :label="isEdit ? '密码（不修改请留空）' : '密码'">
              <el-input
                v-model="formData.password"
                type="password"
                :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 底部按钮 -->
      <div class="flex justify-end mt-6 gap-3">
        <el-button @click="router.back()">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, User } from '@element-plus/icons-vue'
import { getUserDetail, saveUser } from '@/lib/api'

interface SysUser {
  id?: number
  name: string
  phone: string
  employeeNo: string
  password?: string
  status?: number
}

const router = useRouter()
const route = useRoute()

const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(id.value && id.value !== 'new'))

const loading = ref(false)
const saving = ref(false)
const formData = ref<SysUser>({
  name: '',
  phone: '',
  employeeNo: '',
  password: '',
  status: 1,
})

async function loadUser(userId: number) {
  loading.value = true
  try {
    const data = await getUserDetail(userId)
    if (data) {
      // 编辑时不清空密码
      const { password, ...rest } = data
      formData.value = { ...rest, password: '' }
    }
  } catch (error) {
    console.error('Failed to load user:', error)
  } finally {
    loading.value = false
  }
}

function canSave(): boolean {
  if (!formData.value.name || !formData.value.phone || !formData.value.employeeNo) {
    return false
  }
  // 新增时密码必填
  if (!isEdit.value && !formData.value.password) {
    return false
  }
  return true
}

async function handleSubmit() {
  if (!canSave()) {
    ElMessage.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    await saveUser(formData.value)
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    router.push('/users')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value && id.value) {
    loadUser(parseInt(id.value))
  }
})
</script>

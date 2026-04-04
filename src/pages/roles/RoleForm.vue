<template>
  <div class="p-6">
    <div class="flex items-center gap-3 mb-6">
      <el-button text @click="router.back()">
        <el-icon size="20"><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="text-xl font-bold">{{ isEdit ? '编辑角色' : '新增角色' }}</h1>
    </div>

    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-6 max-w-2xl">
      <el-form :model="formData" label-position="top">
        <el-form-item label="角色名称" required>
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" required>
          <el-input v-model="formData.roleKey" placeholder="请输入角色标识" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div class="mt-6">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
          <h3 class="text-base font-medium text-[var(--accent)]">菜单权限</h3>
        </div>
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          show-checkbox
          :default-expand-all="true"
          @check="handleMenuCheck"
        />
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getRoleDetail, saveRole, getMenuTree } from '@/lib/api'

const router = useRouter()
const route = useRoute()
const id = computed(() => route.params.id as string)
const isEdit = computed(() => Boolean(id.value))

const saving = ref(false)
const menuTreeRef = ref()
const menuTree = ref<any[]>([])
const checkedMenuIds = ref<number[]>([])

const formData = reactive({
  roleName: '',
  roleKey: '',
  description: '',
  sort: 0,
  status: 1,
})

async function loadMenuTree() {
  try {
    const tree = await getMenuTree()
    menuTree.value = tree || []
  } catch (error) {
    console.error('Failed to load menu tree:', error)
  }
}

async function loadRoleDetail() {
  if (!id.value) return
  try {
    const data = await getRoleDetail(parseInt(id.value))
    if (data) {
      formData.roleName = data.roleName || ''
      formData.roleKey = data.roleKey || ''
      formData.description = data.description || ''
      formData.sort = data.sort || 0
      formData.status = data.status ?? 1
      if (data.menuIds) {
        checkedMenuIds.value = data.menuIds
        setTimeout(() => {
          checkedMenuIds.value.forEach((menuId: number) => {
            const node = menuTreeRef.value?.getNode(menuId)
            if (node) {
              menuTreeRef.value?.setChecked(node, true, false)
            }
          })
        }, 100)
      }
    }
  } catch (error) {
    console.error('Failed to load role detail:', error)
  }
}

function handleMenuCheck() {
  const checked = menuTreeRef.value?.getCheckedKeys(true) || []
  checkedMenuIds.value = checked as number[]
}

async function handleSave() {
  if (!formData.roleName || !formData.roleKey) {
    ElMessage.warning('请填写必填项')
    return
  }
  saving.value = true
  try {
    const data: any = { ...formData }
    if (isEdit.value) {
      data.id = parseInt(id.value)
    }
    await saveRole(data)
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    router.back()
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadMenuTree()
  if (isEdit.value) {
    loadRoleDetail()
  }
})
</script>

<style scoped>
</style>

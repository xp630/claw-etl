<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
          <el-icon size="20" color="var(--accent)"><User /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white">用户管理</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">管理系统用户</p>
        </div>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon class="mr-1"><Plus /></el-icon> 新增
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex gap-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户姓名..."
          clearable
          class="w-64"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <el-table :data="users" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="employeeNo" label="工号" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button link type="danger" size="small" @click="confirmDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="mt-4 flex justify-between items-center">
      <div class="text-sm text-gray-500">共 {{ total }} 条记录</div>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadUsers"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400">
      <p>确定要删除该用户吗？此操作不可撤销。</p>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" :loading="deleting" @click="handleDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import { getUsers, deleteUser } from '@/lib/api'

interface SysUser {
  id?: number
  name: string
  phone: string
  employeeNo: string
  status?: number
}

const router = useRouter()

const users = ref<SysUser[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)
const deleting = ref(false)

async function loadUsers() {
  loading.value = true
  try {
    const data = await getUsers({
      name: searchKeyword.value,
      page: page.value,
      limit: limit.value
    })
    users.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadUsers()
}

function handleSizeChange() {
  page.value = 1
  loadUsers()
}

function handleCreate() {
  router.push('/users/new')
}

function handleEdit(row: SysUser) {
  router.push(`/users/${row.id}`)
}

function confirmDelete(row: SysUser) {
  deleteId.value = row.id!
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  deleting.value = true
  try {
    await deleteUser(deleteId.value)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteId.value = null
    // 如果当前页只有一条数据且不是第一页，则回到上一页
    if (users.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

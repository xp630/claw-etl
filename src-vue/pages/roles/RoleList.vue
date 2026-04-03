<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center ">
          <el-icon size="20" color="var(--accent)"><UserFilled /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">角色管理</h1>
          <p class="text-xs text-[var(--text-muted)]">管理系统角色</p>
        </div>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon class="mr-1"><Plus /></el-icon> 新增
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] p-4">
      <div class="flex gap-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索角色名称..."
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
    <div class="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] overflow-hidden">
      <el-table :data="roles" v-loading="loading" style="width: 100%">
        <el-table-column prop="role" label="角色标识" min-width="150">
          <template #default="{ row }">
            <span class="font-mono">{{ row.role }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200">
          <template #default="{ row }">
            {{ row.remark || '-' }}
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
      <div class="text-sm text-[var(--text-muted)]">共 {{ total }} 条记录</div>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadRoles"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400">
      <p>确定要删除该角色吗？此操作不可撤销。</p>
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
import { UserFilled, Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import { getRoles, deleteRole } from '@/lib/api'

interface SysRole {
  roleId?: number
  role: string
  description?: string
  remark?: string
}

const router = useRouter()

const roles = ref<SysRole[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)
const deleting = ref(false)

async function loadRoles() {
  loading.value = true
  try {
    const data = await getRoles({
      role: searchKeyword.value,
      page: page.value,
      limit: limit.value
    })
    roles.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('Failed to load roles:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadRoles()
}

function handleSizeChange() {
  page.value = 1
  loadRoles()
}

function handleCreate() {
  router.push('/roles/new')
}

function handleEdit(row: SysRole) {
  router.push(`/roles/${row.roleId}`)
}

function confirmDelete(row: SysRole) {
  deleteId.value = row.roleId!
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  deleting.value = true
  try {
    await deleteRole(deleteId.value)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteId.value = null
    // 如果当前页只有一条数据且不是第一页，则回到上一页
    if (roles.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadRoles()
  } catch (error) {
    console.error('Failed to delete role:', error)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadRoles()
})
</script>

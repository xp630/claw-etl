<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
          <el-icon size="20" color="var(--accent)"><Document /></el-icon>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-white">数据字典管理</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">管理系统数据字典</p>
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
          v-model="searchName"
          placeholder="搜索字典名称..."
          clearable
          class="w-64"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchCode"
          placeholder="搜索字典编码..."
          clearable
          class="w-64"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <el-table :data="dicts" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="code" label="字典编码" min-width="150">
          <template #default="{ row }">
            <span class="font-mono text-sm">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="字典名称" min-width="150" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            {{ row.type === 'number' ? '数字' : '字符串' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
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
      <div class="text-sm text-gray-500">共 {{ total }} 条记录</div>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @current-change="loadDicts"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400">
      <p>确定要删除该字典吗？此操作不可撤销。</p>
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
import { Document, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getDictList, deleteDict } from '@/lib/api'

interface Dict {
  id?: number
  code: string
  name: string
  type?: string
  remark?: string
  status?: number
}

const router = useRouter()

const dicts = ref<Dict[]>([])
const loading = ref(false)
const searchName = ref('')
const searchCode = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)
const deleting = ref(false)

async function loadDicts() {
  loading.value = true
  try {
    const data = await getDictList({
      name: searchName.value,
      code: searchCode.value,
      page: page.value,
      limit: limit.value
    })
    dicts.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('Failed to load dicts:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadDicts()
}

function handleSizeChange() {
  page.value = 1
  loadDicts()
}

function handleCreate() {
  router.push('/dict/new')
}

function handleEdit(row: Dict) {
  router.push(`/dict/${row.id}`)
}

function confirmDelete(row: Dict) {
  deleteId.value = row.id!
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteId.value) return
  deleting.value = true
  try {
    await deleteDict(deleteId.value)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteId.value = null
    // 如果当前页只有一条数据且不是第一页，则回到上一页
    if (dicts.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadDicts()
  } catch (error) {
    console.error('Failed to delete dict:', error)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadDicts()
})
</script>

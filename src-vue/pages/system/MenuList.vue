<template>
  <div class="p-6 h-full flex flex-col">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <MenuIcon class="w-6 h-6 text-blue-500" />
        <h1 class="text-2xl font-bold text-gray-800">菜单管理</h1>
      </div>
      <el-button type="primary" @click="handleCreate(null)">
        <Plus class="w-4 h-4 mr-1" /> 新增
      </el-button>
    </div>

    <!-- 主体区域：左右分栏 -->
    <div class="flex-1 flex gap-6 min-h-0">
      <!-- 左侧：菜单树 -->
      <div class="w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <!-- 搜索栏 -->
        <div class="p-3 border-b border-gray-200">
          <el-input v-model="searchKeyword" placeholder="搜索菜单..." clearable @clear="loadMenuTree">
            <template #prefix>
              <Search class="w-4 h-4 text-gray-400" />
            </template>
          </el-input>
        </div>

        <!-- 树形列表 -->
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="loading" class="px-4 py-8 text-center text-gray-400">加载中...</div>
          <div v-else-if="menuTree.length === 0" class="px-4 py-8 text-center text-gray-400">暂无数据</div>
          <div v-else>
            <el-tree
              :data="menuTree"
              :props="{ children: 'children', label: 'name' }"
              node-key="id"
              :expand-on-click-node="false"
              :default-expand-all="true"
              @node-click="selectMenu"
            >
              <template #default="{ node, data }">
                <div class="flex items-center gap-2 py-1">
                  <span class="text-gray-700">{{ data.name }}</span>
                  <el-tag v-if="data.type === 'button'" size="small" type="warning">按钮</el-tag>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </div>

      <!-- 右侧：编辑区域 -->
      <div class="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div v-if="isEditing" class="h-full flex flex-col">
          <!-- 表单头部 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800">
              {{ editMode === 'edit' ? '编辑菜单' : '新增菜单' }}
            </h2>
            <el-button text @click="closeForm">
              <X class="w-5 h-5" />
            </el-button>
          </div>

          <!-- 表单内容 -->
          <div class="flex-1 overflow-y-auto p-6">
            <el-form :model="formData" label-width="100px">
              <el-form-item label="菜单名称" required>
                <el-input v-model="formData.name" placeholder="请输入菜单名称" />
              </el-form-item>

              <el-form-item label="图标">
                <el-select v-model="formData.icon" placeholder="请选择图标" clearable>
                  <el-option v-for="icon in iconList" :key="icon.name" :label="icon.label" :value="icon.name">
                    <span>{{ icon.label }}</span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="路由路径">
                <el-input v-model="formData.path" placeholder="请输入路由路径" />
              </el-form-item>

              <el-form-item label="父菜单">
                <el-tree-select
                  v-model="formData.parentId"
                  :data="[{ id: 0, name: '顶级菜单', children: parentMenusTree }]"
                  :props="{ label: 'name', children: 'children' }"
                  check-strictly
                  clearable
                  placeholder="请选择父菜单"
                />
              </el-form-item>

              <el-form-item label="排序号">
                <el-input-number v-model="formData.orderNum" :min="0" />
              </el-form-item>

              <el-form-item label="类型">
                <el-radio-group v-model="formData.type">
                  <el-radio value="menu">菜单</el-radio>
                  <el-radio value="button">按钮</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="菜单来源">
                <el-radio-group v-model="formData.menuFrom">
                  <el-radio value="static">静态菜单</el-radio>
                  <el-radio value="dynamic">动态菜单</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="状态">
                <el-radio-group v-model="formData.status">
                  <el-radio :value="1">启用</el-radio>
                  <el-radio :value="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <!-- 底部按钮 -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <el-button @click="closeForm">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">
              {{ saving ? '保存中...' : '保存' }}
            </el-button>
          </div>
        </div>

        <div v-else class="h-full flex items-center justify-center text-gray-400">
          <div class="text-center">
            <MenuIcon class="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>选择左侧菜单或点击新增按钮</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400px">
      <p class="text-gray-600">确定要删除该菜单吗？子菜单也会被删除。此操作不可撤销。</p>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, X, Menu as MenuIcon } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import axios from 'axios'

interface SysMenu {
  id?: number
  name: string
  icon?: string
  path?: string
  parentId?: number
  orderNum?: number
  type?: 'menu' | 'button'
  menuFrom?: 'static' | 'dynamic'
  status?: number
  children?: SysMenu[]
}

// API
const API_BASE = '/etl-admin'
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

async function getMenuTree(): Promise<SysMenu[]> {
  const res = await api.get('/sysMenu/tree')
  return res.data?.data || []
}

async function getMenuDetail(id: number): Promise<SysMenu | null> {
  const res = await api.get(`/sysMenu/${id}`)
  return res.data?.data || null
}

async function saveMenu(data: Partial<SysMenu>): Promise<void> {
  await api.post('/sysMenu/save', data)
}

async function deleteMenu(id: number): Promise<void> {
  await api.post('/sysMenu/delete', { id })
}

// 图标列表
const iconList = [
  { name: 'home', label: '首页' },
  { name: 'menu', label: '菜单' },
  { name: 'settings', label: '设置' },
  { name: 'users', label: '用户' },
  { name: 'database', label: '数据库' },
  { name: 'file-text', label: '文件' },
  { name: 'bar-chart', label: '图表' },
  { name: 'grid', label: '网格' },
  { name: 'table', label: '表格' },
  { name: 'lock', label: '锁' },
]

// State
const menuTree = ref<SysMenu[]>([])
const parentMenusTree = ref<SysMenu[]>([])
const loading = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const isEditing = ref(false)
const editMode = ref<'create' | 'edit'>('create')
const formLoading = ref(false)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)
const selectedKey = ref<number | null>(null)

const formData = reactive<SysMenu>({
  name: '',
  icon: '',
  path: '',
  parentId: 0,
  orderNum: 0,
  type: 'menu',
  menuFrom: 'static',
  status: 1,
})

onMounted(() => {
  loadMenuTree()
})

async function loadMenuTree() {
  loading.value = true
  try {
    const tree = await getMenuTree()
    menuTree.value = tree
  } catch (error) {
    console.error('Failed to load menu tree:', error)
  } finally {
    loading.value = false
  }
}

function selectMenu(data: SysMenu) {
  selectedKey.value = data.id!
  editMode.value = 'edit'
  isEditing.value = true
  Object.assign(formData, data)
}

function handleCreate(parentId: number | null = null) {
  editMode.value = 'create'
  Object.assign(formData, {
    name: '',
    icon: '',
    path: '',
    parentId: parentId ?? selectedKey.value ?? 0,
    orderNum: 0,
    type: 'menu',
    menuFrom: 'static',
    status: 1,
  })
  isEditing.value = true
}

async function handleSave() {
  if (!formData.name) {
    ElMessage.warning('请输入菜单名称')
    return
  }

  saving.value = true
  try {
    let path = formData.path
    if (formData.menuFrom === 'dynamic' && path && !path.startsWith('/render/')) {
      path = `/render/${path}`
    }
    await saveMenu({ ...formData, path })
    ElMessage.success('保存成功')
    loadMenuTree()
    if (editMode.value === 'create') {
      isEditing.value = false
    }
  } catch (error) {
    console.error('Failed to save menu:', error)
  } finally {
    saving.value = false
  }
}

function closeForm() {
  isEditing.value = false
  selectedKey.value = null
}

function confirmDelete() {
  if (deleteId.value) {
    deleteMenu(deleteId.value).then(() => {
      ElMessage.success('删除成功')
      showDeleteConfirm.value = false
      deleteId.value = null
      if (selectedKey.value === deleteId.value) {
        selectedKey.value = null
        isEditing.value = false
      }
      loadMenuTree()
    }).catch(console.error)
  }
}
</script>

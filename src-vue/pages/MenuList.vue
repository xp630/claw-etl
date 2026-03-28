<template>
  <div class="menu-list-page p-6 h-full flex flex-col">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <el-icon size="24" color="var(--accent)"><Menu /></el-icon>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">菜单管理</h1>
      </div>
      <el-button type="primary" @click="handleCreate(null)">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增
      </el-button>
    </div>

    <!-- 主体区域：左右分栏 -->
    <div class="flex-1 flex gap-6 min-h-0">
      <!-- 左侧：菜单树 -->
      <div class="w-96 flex flex-col bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] overflow-hidden">
        <!-- 搜索栏 -->
        <div class="p-3 border-b border-[var(--border-light)]">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索菜单..."
            clearable
            :prefix-icon="Search"
          />
        </div>

        <!-- 树形列表 -->
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="loading" class="px-4 py-8 text-center text-[var(--text-muted)]">加载中...</div>
          <div v-else-if="menuTree.length === 0" class="px-4 py-8 text-center text-[var(--text-muted)]">暂无数据</div>
          <template v-else>
            <div v-for="menu in menuTree" :key="menu.id">
              <menu-tree-item
                :menu="menu"
                :selected-id="selectedKey"
                :expanded-keys="expandedKeys"
                :level="0"
                @select="selectMenu"
                @toggle="toggleExpand"
                @create="handleCreate"
                @delete="confirmDelete"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧：编辑区域 -->
      <div class="flex-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] overflow-hidden">
        <div v-if="isEditing" class="h-full flex flex-col">
          <!-- 表单头部 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">
              {{ editMode === 'edit' ? '编辑菜单' : '新增菜单' }}
            </h2>
            <el-button text @click="closeForm"><el-icon><Close /></el-icon></el-button>
          </div>

          <!-- 表单内容 -->
          <div class="flex-1 overflow-y-auto p-6">
            <el-form :model="formData" label-position="top" class="space-y-4">
              <el-form-item label="菜单名称" required>
                <el-input v-model="formData.name" placeholder="请输入菜单名称" />
              </el-form-item>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="图标">
                    <div class="grid grid-cols-8 gap-1 p-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg max-h-48 overflow-y-auto">
                      <div
                        v-for="icon in iconList"
                        :key="icon.name"
                        class="p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        :class="formData.icon === icon.name ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-muted)]'"
                        @click="formData.icon = icon.name"
                        :title="icon.label"
                      >
                        <component :is="icon.component" class="w-5 h-5" />
                      </div>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="路由路径">
                    <el-select
                      v-if="formData.menuFrom === 'dynamic'"
                      v-model="formData.path"
                      placeholder="请选择页面"
                      clearable
                    >
                      <el-option
                        v-for="page in pageList"
                        :key="page.id"
                        :label="page.name"
                        :value="page.code"
                      />
                    </el-select>
                    <el-input v-else v-model="formData.path" placeholder="请输入路由路径" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="父菜单">
                    <el-select v-model="formData.parentId" placeholder="顶级菜单" clearable>
                      <el-option label="顶级菜单" :value="0" />
                      <el-option
                        v-for="menu in parentMenusTree"
                        :key="menu.id"
                        :label="menu.name"
                        :value="menu.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="排序号">
                    <el-input-number v-model="formData.orderNum" :min="0" class="w-full" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="16">
                <el-col :span="8">
                  <el-form-item label="类型">
                    <el-select v-model="formData.type">
                      <el-option label="菜单" value="menu" />
                      <el-option label="按钮" value="button" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="菜单来源">
                    <el-select v-model="formData.menuFrom">
                      <el-option label="静态菜单" value="static" />
                      <el-option label="动态菜单" value="dynamic" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="状态">
                    <el-select v-model="formData.status">
                      <el-option label="启用" :value="1" />
                      <el-option label="禁用" :value="0" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <!-- 底部按钮 -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-light)] bg-[var(--bg-hover)]">
            <el-button @click="closeForm">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          </div>
        </div>
        <div v-else class="h-full flex items-center justify-center text-[var(--text-muted)]">
          <div class="text-center">
            <el-icon class="w-16 h-16 mx-auto mb-4 opacity-30"><Menu /></el-icon>
            <p>选择左侧菜单或点击新增按钮</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <el-dialog v-model="showDeleteConfirm" title="确认删除" width="400">
      <p>确定要删除该菜单吗？子菜单也会被删除。此操作不可撤销。</p>
      <template #footer>
        <el-button @click="showDeleteConfirm = false">取消</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Menu, Plus, Close, Search } from '@element-plus/icons-vue'
import { getMenuTree, saveMenu, deleteMenu, getPageConfigList } from '@/lib/api'
import type { SysMenu } from '@/pages/editor/types'

// 图标列表
const iconList = [
  { name: 'Menu', component: Menu },
  { name: 'Plus', component: Plus },
  { name: 'Close', component: Close },
  { name: 'Search', component: Search },
]

// 状态
const menuTree = ref<SysMenu[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const selectedKey = ref<number | null>(null)
const isEditing = ref(false)
const editMode = ref<'create' | 'edit'>('create')
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
const parentMenusTree = ref<SysMenu[]>([])
const pageList = ref<any[]>([])
const formLoading = ref(false)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const deleteId = ref<number | null>(null)
const expandedKeys = ref<Set<number>>(new Set())

// 加载菜单树
async function loadMenuTree() {
  loading.value = true
  try {
    const tree = await getMenuTree()
    menuTree.value = tree || []
  } catch (error) {
    console.error('Failed to load menu tree:', error)
  } finally {
    loading.value = false
  }
}

// 选择菜单
async function selectMenu(menu: SysMenu) {
  selectedKey.value = menu.id!
  editMode.value = 'edit'
  isEditing.value = true
  formLoading.value = true
  try {
    Object.assign(formData, menu)
  } finally {
    formLoading.value = false
  }
}

// 新增菜单
async function handleCreate(parentId: number | null) {
  editMode.value = 'create'
  isEditing.value = true
  selectedKey.value = null
  Object.assign(formData, {
    id: undefined,
    name: '',
    icon: '',
    path: '',
    parentId: parentId ?? 0,
    orderNum: 0,
    type: 'menu',
    menuFrom: 'static',
    status: 1,
  })
}

// 保存
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

// 关闭表单
function closeForm() {
  isEditing.value = false
  selectedKey.value = null
}

// 确认删除
function confirmDelete(id: number) {
  deleteId.value = id
  showDeleteConfirm.value = true
}

// 删除
async function handleDelete() {
  if (!deleteId.value) return
  try {
    await deleteMenu(deleteId.value)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    deleteId.value = null
    if (selectedKey.value === deleteId.value) {
      selectedKey.value = null
      isEditing.value = false
    }
    loadMenuTree()
  } catch (error) {
    console.error('Failed to delete menu:', error)
  }
}

// 展开/折叠
function toggleExpand(id: number) {
  if (expandedKeys.value.has(id)) {
    expandedKeys.value.delete(id)
  } else {
    expandedKeys.value.add(id)
  }
}

// 加载页面列表
async function loadPageList() {
  try {
    const res = await getPageConfigList({ page: 1, limit: 100 })
    pageList.value = res.list.filter((p: any) => p.status === 1)
  } catch (error) {
    console.error('Failed to load page list:', error)
  }
}

onMounted(() => {
  loadMenuTree()
})
</script>

<style scoped>
.menu-list-page {
  background: var(--bg-primary);
}
</style>

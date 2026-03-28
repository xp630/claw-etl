<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="flex items-center gap-3 mb-6">
      <el-button text @click="router.back()">
        <el-icon size="20"><ArrowLeft /></el-icon>
      </el-button>
      <div class="flex items-center gap-3">
        <el-icon size="24" color="var(--accent)"><UserFilled /></el-icon>
        <h1 class="text-xl font-bold">{{ isEdit ? '编辑角色' : '新增角色' }}</h1>
      </div>
    </div>

    <!-- 表单 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
      <el-form :model="formData" label-position="top">
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
            <h3 class="text-base font-medium text-[var(--accent)]">基本信息</h3>
          </div>
        </div>

        <el-form-item label="角色标识" required>
          <el-input v-model="formData.role" placeholder="请输入角色标识，如 admin" :disabled="isEdit" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="formData.description" placeholder="请输入角色描述" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>

        <!-- 分配菜单（编辑时显示） -->
        <el-form-item v-if="isEdit" label="分配菜单">
          <div class="mb-2 text-sm text-gray-500">
            已选 {{ selectedMenuIds.length }} 个菜单
            <el-button link type="primary" size="small" @click="toggleExpandAll">
              {{ expandedKeys.size === 0 ? '展开全部' : '收起全部' }}
            </el-button>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-80 overflow-y-auto">
            <div class="space-y-1">
              <template v-for="menu in menuTree" :key="menu.id">
                <menu-tree-node
                  :menu="menu"
                  :selected-ids="selectedMenuIds"
                  :expanded-keys="expandedKeys"
                  :level="0"
                  @toggle="toggleExpand"
                  @select="toggleMenuSelection"
                />
              </template>
              <div v-if="menuTree.length === 0" class="py-4 text-center text-gray-400">
                暂无菜单数据
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <!-- 底部按钮 -->
      <div class="flex justify-end mt-6 gap-3">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, UserFilled, Check } from '@element-plus/icons-vue'
import { getRoleDetail, saveRole, getMenuTree, getRoleMenuIds, bindMenus } from '@/lib/api'

interface SysRole {
  roleId?: number
  role: string
  description?: string
  remark?: string
}

interface SysMenu {
  id?: number
  name: string
  code?: string
  children?: SysMenu[]
}

const router = useRouter()
const route = useRoute()

const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(id.value && id.value !== 'new'))

const loading = ref(false)
const saving = ref(false)
const formData = ref<SysRole>({
  role: '',
  description: '',
  remark: '',
})
const menuTree = ref<SysMenu[]>([])
const selectedMenuIds = ref<number[]>([])
const expandedKeys = ref<Set<number>>(new Set())

// 加载角色详情
async function loadRole(roleId: number) {
  loading.value = true
  try {
    const data = await getRoleDetail(roleId)
    if (data) {
      formData.value = data
      // 加载角色关联的菜单
      const menuIds = await getRoleMenuIds(roleId)
      selectedMenuIds.value = menuIds
    }
  } catch (error) {
    console.error('Failed to load role:', error)
  } finally {
    loading.value = false
  }
}

// 加载菜单树
async function loadMenuTreeData() {
  try {
    const tree = await getMenuTree()
    menuTree.value = tree || []
  } catch (error) {
    console.error('Failed to load menu tree:', error)
  }
}

// 切换菜单选中状态
function toggleMenuSelection(menuId: number) {
  const index = selectedMenuIds.value.indexOf(menuId)
  if (index > -1) {
    selectedMenuIds.value.splice(index, 1)
  } else {
    selectedMenuIds.value.push(menuId)
  }
}

// 展开/折叠
function toggleExpand(menuId: number) {
  if (expandedKeys.value.has(menuId)) {
    expandedKeys.value.delete(menuId)
  } else {
    expandedKeys.value.add(menuId)
  }
}

// 展开/折叠全部
function toggleExpandAll() {
  if (expandedKeys.value.size === 0) {
    const allKeys = new Set<number>()
    const collectKeys = (menus: SysMenu[]) => {
      menus.forEach(m => {
        if (m.children && m.children.length > 0) {
          if (m.id) allKeys.add(m.id)
          collectKeys(m.children)
        }
      })
    }
    collectKeys(menuTree.value)
    expandedKeys.value = allKeys
  } else {
    expandedKeys.value = new Set()
  }
}

// 提交
async function handleSubmit() {
  if (!formData.value.role) {
    ElMessage.warning('请输入角色标识')
    return
  }

  saving.value = true
  try {
    const saved = await saveRole(formData.value)
    if (saved) {
      // 如果是编辑模式，同时保存菜单关联
      if (isEdit.value && saved.roleId) {
        await bindMenus(saved.roleId, selectedMenuIds.value)
      }
      ElMessage.success('保存成功')
      router.back()
    }
  } catch (error) {
    console.error('Failed to save role:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadMenuTreeData()
  if (isEdit.value && id.value) {
    loadRole(parseInt(id.value))
  }
})
</script>

<!-- 菜单树节点组件 -->
<script lang="ts">
import { defineComponent, PropType } from 'vue'

const MenuTreeNode = defineComponent({
  name: 'MenuTreeNode',
  props: {
    menu: {
      type: Object as PropType<SysMenu>,
      required: true
    },
    selectedIds: {
      type: Array as PropType<number[]>,
      default: () => []
    },
    expandedKeys: {
      type: Object as PropType<Set<number>>,
      default: () => new Set()
    },
    level: {
      type: Number,
      default: 0
    }
  },
  emits: ['toggle', 'select'],
  setup(props, { emit }) {
    const hasChildren = computed(() => props.menu.children && props.menu.children!.length > 0)
    const isExpanded = computed(() => props.expandedKeys.has(props.menu.id!))
    const isSelected = computed(() => props.selectedIds.includes(props.menu.id!))

    return () => (
      <div>
        <div
          class={`flex items-center gap-2 py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer ${
            isSelected.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''
          }`}
          style={{ paddingLeft: `${props.level * 20 + 12}px` }}
        >
          {hasChildren.value && (
            <span
              class="text-gray-400 hover:text-gray-600 cursor-pointer select-none"
              onClick={() => emit('toggle', props.menu.id)}
            >
              {isExpanded.value ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren.value && <span class="w-4" />}
          <input
            type="checkbox"
            checked={isSelected.value}
            onChange={() => emit('select', props.menu.id)}
            class="w-4 h-4 rounded border-gray-300 text-blue-500"
          />
          <span class="text-gray-700 dark:text-gray-200">{props.menu.name}</span>
          {props.menu.code && (
            <span class="text-gray-400 text-sm">({props.menu.code})</span>
          )}
        </div>
        {hasChildren.value && isExpanded.value && props.menu.children!.map(child => (
          <MenuTreeNode
            key={child.id}
            menu={child}
            selectedIds={props.selectedIds}
            expandedKeys={props.expandedKeys}
            level={props.level + 1}
            onToggle={(id: number) => emit('toggle', id)}
            onSelect={(id: number) => emit('select', id)}
          />
        ))}
      </div>
    )
  }
})

export { MenuTreeNode }
</script>

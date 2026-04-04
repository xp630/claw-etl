<template>
  <div>
    <div
      class="flex items-center gap-2 py-2 px-3 hover:bg-[var(--bg-hover)] rounded cursor-pointer group transition-colors"
      :class="selectedId === menu.id ? 'bg-[var(--accent)]/20 border border-[var(--accent)]' : ''"
      :style="{ paddingLeft: `${level * 20 + 12}px` }"
      @click="$emit('select', menu)"
    >
      <button
        v-if="menu.children && menu.children.length > 0"
        @click.stop="$emit('toggle', menu.id)"
        class="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <el-icon><ChevronDown v-if="expandedKeys.has(menu.id!)" /><ChevronRight v-else /></el-icon>
      </button>
      <span v-else class="w-4" />
      
      <span class="text-[var(--text-primary)] font-medium">{{ menu.name }}</span>
      <span
        class="px-2 py-0.5 rounded text-xs"
        :class="menu.type === 'menu' ? 'bg-[var(--info)]/20 text-[var(--info)]' : 'bg-[var(--warning)]/20 text-[var(--warning)]'"
      >
        {{ menu.type === 'menu' ? '菜单' : '按钮' }}
      </span>
      <div class="flex-1" />
      <div class="hidden group-hover:flex items-center gap-1">
        <el-button
          size="small"
          text
          @click.stop="$emit('create', menu.id)"
          title="添加子节点"
        >
          <el-icon class="text-[var(--success)]"><Plus /></el-icon>
        </el-button>
        <el-button
          size="small"
          text
          @click.stop="$emit('delete', menu.id)"
          title="删除"
        >
          <el-icon class="text-[var(--danger)]"><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <template v-if="menu.children && menu.children.length > 0 && expandedKeys.has(menu.id!)">
      <MenuTreeItem
        v-for="child in menu.children"
        :key="child.id"
        :menu="child"
        :selected-id="selectedId"
        :expanded-keys="expandedKeys"
        :level="level + 1"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @create="$emit('create', $event)"
        @delete="$emit('delete', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronRight, Plus, Delete } from '@element-plus/icons-vue'

interface SysMenu {
  id?: number
  parentId?: number
  name: string
  path?: string
  icon?: string
  orderNum?: number
  type?: 'menu' | 'button'
  menuFrom?: 'static' | 'dynamic'
  status?: number
  children?: SysMenu[]
}

defineProps<{
  menu: SysMenu
  selectedId: number | null
  expandedKeys: Set<number>
  level: number
}>()

defineEmits<{
  select: [menu: SysMenu]
  toggle: [id: number]
  create: [id: number]
  delete: [id: number]
}>()
</script>

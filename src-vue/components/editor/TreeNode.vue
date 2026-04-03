<template>
  <div class="tree-node">
    <div
      class="tree-node-content"
      :class="{ 'is-selected': node.componentId === selectedId }"
      :style="{ paddingLeft: `${depth * 12}px` }"
      @click="$emit('select', node.componentId)"
    >
      <!-- 展开/折叠按钮 -->
      <span
        v-if="hasChildren"
        class="tree-toggle"
        @click.stop="$emit('toggle')"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="tree-toggle-placeholder"></span>
      
      <!-- 图标 -->
      <span class="tree-icon">{{ getIcon(node.type) }}</span>
      
      <!-- 标签 -->
      <span class="tree-label">{{ node.label }}</span>
      
      <!-- 类型标签 -->
      <span class="tree-type">{{ node.type }}</span>
    </div>
    
    <!-- Tabs 子组件 -->
    <div v-if="node.tabChildren && isExpanded" class="tree-tab-children">
      <div
        v-for="(tabGroup, tabIndex) in node.tabChildren"
        :key="tabIndex"
        class="tree-tab-group"
      >
        <div
          class="tree-tab-label"
          :style="{ paddingLeft: `${(depth + 1) * 12 + 16}px` }"
        >
          {{ `标签${tabIndex + 1}` }}
        </div>
        <TreeNode
          v-for="child in tabGroup"
          :key="child.componentId"
          :node="child"
          :selected-id="selectedId"
          :depth="depth + 2"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle')"
        />
      </div>
    </div>
    
    <!-- 普通子组件 -->
    <div v-if="node.children && isExpanded" class="tree-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.componentId"
        :node="child"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface TreeNodeData {
  componentId: string
  id: string
  type: string
  label: string
  children?: TreeNodeData[]
  tabChildren?: TreeNodeData[][]
  isExpanded?: boolean
}

const props = withDefaults(defineProps<{
  node: TreeNodeData
  selectedId?: string | null
  depth?: number
}>(), {
  selectedId: null,
  depth: 0
})

const emit = defineEmits<{
  select: [componentId: string]
  toggle: []
}>()

const isExpanded = ref(true)

const hasChildren = computed(() => {
  return (props.node.children && props.node.children.length > 0) ||
         (props.node.tabChildren && props.node.tabChildren.length > 0)
})

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    tabs: '📑',
    card: '📦',
    collapse: '📁',
    table: '📊',
    form: '📝',
    input: '✏️',
    button: '🔘',
    text: '📄',
    image: '🖼️',
    divider: '➖',
    chart: '📈',
    default: '📌'
  }
  return icons[type] || icons.default
}

// 当 props.isExpanded 变化时同步
if (props.node.isExpanded !== undefined) {
  isExpanded.value = props.node.isExpanded
}
</script>

<style scoped>
.tree-node {
  font-size: 12px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.tree-node-content:hover {
  background-color: var(--bg-hover, #f5f7fa);
}

.tree-node-content.is-selected {
  background-color: var(--accent-light, #ecf5ff);
  color: var(--accent, #409eff);
}

.tree-toggle {
  width: 12px;
  font-size: 10px;
  color: var(--text-muted, #909399);
  cursor: pointer;
  flex-shrink: 0;
}

.tree-toggle-placeholder {
  width: 12px;
  flex-shrink: 0;
}

.tree-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-type {
  font-size: 10px;
  color: var(--text-muted, #909399);
  padding: 1px 4px;
  background-color: var(--bg-secondary, #f5f7fa);
  border-radius: 2px;
  flex-shrink: 0;
}

.tree-tab-label {
  font-size: 11px;
  color: var(--text-muted, #909399);
  padding: 2px 0;
}

.tree-tab-group {
  margin-left: 4px;
}
</style>

<template>
  <div class="tree-view font-mono text-xs">
    <div v-if="data.length === 0" class="text-center text-[var(--text-muted)] py-8">
      空组件树
    </div>
    <div v-else>
      <TreeNode
        v-for="comp in data"
        :key="comp.id"
        :comp="comp"
        :depth="0"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, provide } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'

interface Props {
  data: CanvasComponent[]
  selectedId?: string | null
}

defineProps<Props>()
defineEmits<{ select: [id: string] }>

// Type icons
const typeIcons: Record<string, string> = {
  card: '📦',
  tabs: '📑',
  collapse: '📂',
  table: '📊',
  form: '📝',
  button: '🔘',
  input: '✏️',
  text: '🔤',
  image: '🖼️',
  chart: '📈',
  default: '📄'
}

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    comp: { type: Object as () => CanvasComponent, required: true },
    depth: { type: Number, default: 0 },
    selectedId: { type: String as () => string | null, default: null }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const expanded = ref(props.depth < 2)
    
    const icon = typeIcons[props.comp.type] || typeIcons.default
    const isSelected = props.selectedId === props.comp.id
    
    const hasChildren = (props.comp.children?.length ?? 0) > 0 || (props.comp.props?.tabs?.length ?? 0) > 0
    
    // Build label
    const label = props.comp.props?.label 
      || props.comp.props?.title 
      || props.comp.props?.name
      || props.comp.label 
      || props.comp.type
    
    // Children count
    const tabCount = props.comp.props?.tabs?.length ?? 0
    const childCount = props.comp.children?.length ?? 0
    
    return () => {
      const children: any[] = []
      
      // Self
      children.push(
        h('div', {
          class: `flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`,
          style: { paddingLeft: `${props.depth * 16 + 8}px` },
          onClick: () => emit('select', props.comp.id)
        }, [
          // Expand/collapse button
          hasChildren 
            ? h('button', {
                class: 'w-4 h-4 flex items-center justify-center text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                onClick: (e: Event) => { e.stopPropagation(); expanded.value = !expanded.value }
              }, [expanded.value ? '▼' : '▶'])
            : h('span', { class: 'w-4' }),
          
          // Icon
          h('span', { class: 'text-sm' }, icon),
          
          // Type badge
          h('span', { class: 'px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)]' }, props.comp.type),
          
          // Label
          h('span', { class: 'flex-1 truncate' }, label),
          
          // Count badges
          tabCount > 0 ? h('span', { class: 'text-[10px] text-[var(--text-muted)]' }, `${tabCount} tabs`) : null,
          childCount > 0 ? h('span', { class: 'text-[10px] text-[var(--text-muted)]' }, `${childCount} children`) : null
        ])
      )
      
      // Children
      if (hasChildren && expanded.value) {
        // Tabs
        if (props.comp.props?.tabs?.length) {
          props.comp.props.tabs.forEach((tab: any) => {
            children.push(
              h('div', {
                class: 'flex items-center gap-2 py-1 px-2 text-[var(--text-muted)]',
                style: { paddingLeft: `${(props.depth + 1) * 16 + 8}px` }
              }, [
                h('span', { class: 'w-4' }),
                h('span', { class: 'text-sm' }, '📑'),
                h('span', { class: 'text-[var(--text-secondary)]' }, tab.label || 'Tab'),
                tab.children?.length 
                  ? h('span', { class: 'text-[10px] ml-1' }, `(${tab.children.length})`)
                  : null
              ])
            )
          })
        }
        
        // Child components
        if (props.comp.children?.length) {
          props.comp.children.forEach((child: CanvasComponent) => {
            children.push(
              h(TreeNode, {
                comp: child,
                depth: props.depth + 1,
                selectedId: props.selectedId,
                onSelect: (id: string) => emit('select', id)
              })
            )
          })
        }
      }
      
      return h('div', {}, children)
    }
  }
})
</script>

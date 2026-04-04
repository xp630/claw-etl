<template>
  <div v-if="visible" class="data-panel border-t border-[var(--border-light)] bg-[var(--bg-secondary)]" :style="{ height: `${height}px` }">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-[var(--text-primary)]">数据面板</span>
        <div class="flex gap-1">
          <button
            v-for="tab in ['Tree', 'JSON']"
            :key="tab"
            class="px-3 py-1 text-xs rounded transition-colors"
            :class="activeTab === tab ? 'bg-blue-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          @click="formatJson"
          title="格式化"
        >
          格式化
        </button>
        <button
          class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          @click="copyJson"
          title="复制"
        >
          复制
        </button>
        <button
          class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          @click="applyJson"
          title="应用到画布"
        >
          应用
        </button>
        <span class="text-xs text-green-500" v-if="applySuccess">已应用!</span>
        <button
          class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="overflow-auto" :style="{ height: `${height - 45}px` }">
      <!-- Tree View -->
      <div v-if="activeTab === 'Tree'" class="p-4">
        <TreeView :data="components" @select="handleSelect" />
      </div>

      <!-- JSON View -->
      <div v-else class="relative">
        <textarea
          ref="jsonTextarea"
          v-model="jsonText"
          class="w-full h-full p-4 font-mono text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-none resize-none focus:outline-none"
          spellcheck="false"
          @input="onJsonInput"
        />
        <div v-if="jsonError" class="absolute bottom-2 left-2 right-2 text-xs text-red-500 bg-[var(--bg-secondary)] p-2 rounded">
          {{ jsonError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'
import TreeView from './TreeView.vue'

interface Props {
  visible: boolean
  components: CanvasComponent[]
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300
})

const emit = defineEmits<{
  close: []
  'update:components': [components: CanvasComponent[]]
  select: [id: string]
}>()

const activeTab = ref<'Tree' | 'JSON'>('JSON')
const jsonText = ref('')
const jsonError = ref('')
const applySuccess = ref(false)
const jsonTextarea = ref<HTMLTextAreaElement | null>(null)

// Sync components to JSON
watch(() => props.components, (newComps) => {
  try {
    jsonText.value = JSON.stringify(newComps, null, 2)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = '序列化失败'
  }
}, { immediate: true, deep: true })

function formatJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = '无效的 JSON'
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
  } catch (e) {
    // Fallback
    jsonTextarea.value?.select()
    document.execCommand('copy')
  }
}

function applyJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!Array.isArray(parsed)) {
      jsonError.value = '必须是数组'
      return
    }
    emit('update:components', parsed)
    jsonError.value = ''
    applySuccess.value = true
    setTimeout(() => applySuccess.value = false, 2000)
  } catch (e) {
    jsonError.value = '无效的 JSON'
  }
}

function onJsonInput() {
  try {
    JSON.parse(jsonText.value)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = 'JSON 格式错误'
  }
}

function handleSelect(id: string) {
  emit('select', id)
}
</script>

<!-- TreeView Component -->
<script lang="ts">
import { defineComponent, h } from 'vue'

const TreeView = defineComponent({
  name: 'TreeView',
  props: {
    data: { type: Array, required: true },
    depth: { type: Number, default: 0 }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const toggleMap = ref<Record<string, boolean>>({})

    function toggle(id: string) {
      toggleMap.value[id] = !toggleMap.value[id]
    }

    function renderNode(comp: any, depth: number): any {
      const hasChildren = comp.children?.length > 0 || comp.props?.tabs?.length > 0
      const isOpen = toggleMap.value[comp.id] ?? depth < 2
      const indent = depth * 16

      return [
        h('div', {
          class: 'flex items-center gap-1 py-1 px-2 hover:bg-[var(--bg-tertiary)] cursor-pointer rounded text-xs',
          style: { paddingLeft: `${indent + 8}px` },
          onClick: () => emit('select', comp.id)
        }, [
          hasChildren ? h('button', {
            class: 'w-4 h-4 flex items-center justify-center text-[var(--text-muted)]',
            onClick: (e: Event) => { e.stopPropagation(); toggle(comp.id) }
          }, [isOpen ? '▼' : '▶']) : h('span', { class: 'w-4' }),
          h('span', { class: 'px-1 rounded bg-blue-500/20 text-blue-500 text-[10px]' }, comp.type),
          h('span', { class: 'text-[var(--text-secondary)]' }, comp.label || comp.id),
          comp.props?.label ? h('span', { class: 'text-[var(--text-muted)] ml-1' }, `(${comp.props.label})`) : null
        ]),
        ...(hasChildren && isOpen ? [
          ...(comp.children || []).map((child: any) => renderNode(child, depth + 1)),
          ...(comp.props?.tabs || []).map((tab: any) => 
            h('div', {
              class: 'flex items-center gap-1 py-1 px-2 text-[var(--text-muted)] text-xs',
              style: { paddingLeft: `${indent + 28}px` }
            }, [
              h('span', { class: 'text-[10px]' }, `📑 ${tab.label}`),
              tab.children?.length ? h('span', { class: 'ml-1' }, `(${tab.children.length})`) : null
            ])
          )
        ] : [])
      ]
    }

    return () => {
      const nodes = (props.data as any[]).flatMap(comp => renderNode(comp, 0))
      return h('div', { class: 'tree-view font-mono' }, nodes)
    }
  }
})
</script>

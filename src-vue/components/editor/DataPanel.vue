<template>
  <transition name="drawer">
    <div v-if="visible" class="data-panel fixed right-0 top-14 bottom-0 w-[500px] bg-[var(--bg-secondary)] border-l border-[var(--border-light)] shadow-2xl z-50 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
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
        <div class="flex items-center gap-3">
          <button
            class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            @click="formatJson"
          >
            格式化
          </button>
          <button
            class="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            @click="copyJson"
          >
            复制
          </button>
          <button
            class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="applyJson"
          >
            应用
          </button>
          <span class="text-xs text-green-500" v-if="applySuccess">✓ 已应用</span>
          <button
            class="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            @click="$emit('close')"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- Tree View -->
        <div v-if="activeTab === 'Tree'" class="flex-1 overflow-auto p-4">
          <TreeView :data="components" @select="handleSelect" />
        </div>

        <!-- JSON View -->
        <div v-else class="flex-1 relative">
          <textarea
            ref="jsonTextarea"
            v-model="jsonText"
            class="w-full h-full p-4 font-mono text-xs leading-5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-none resize-none focus:outline-none"
            spellcheck="false"
            @input="onJsonInput"
          />
          <div v-if="jsonError" class="absolute top-2 left-2 right-2 text-xs text-red-500 bg-red-500/10 border border-red-500/30 p-2 rounded">
            {{ jsonError }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CanvasComponent } from '@/pages/editor/types'
import TreeView from './TreeView.vue'

interface Props {
  visible: boolean
  components: CanvasComponent[]
}

const props = defineProps<Props>()

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

watch(() => props.components, (newComps) => {
  try {
    jsonText.value = JSON.stringify(newComps, null, 2)
    jsonError.value = ''
  } catch {
    jsonError.value = '序列化失败'
  }
}, { immediate: true, deep: true })

function formatJson() {
  try {
    const parsed = JSON.parse(jsonText.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch {
    jsonError.value = '无效的 JSON'
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
  } catch {
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
  } catch {
    jsonError.value = '无效的 JSON'
  }
}

function onJsonInput() {
  try {
    JSON.parse(jsonText.value)
    jsonError.value = ''
  } catch {
    jsonError.value = 'JSON 格式错误'
  }
}

function handleSelect(id: string) {
  emit('select', id)
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>

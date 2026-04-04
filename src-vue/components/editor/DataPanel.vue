<template>
  <transition name="drawer">
    <div v-if="visible" class="data-panel fixed right-0 top-14 bottom-0 w-[700px] bg-[var(--bg-secondary)] border-l border-[var(--border-light)] shadow-2xl z-50 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
        <span class="text-sm font-medium text-[var(--text-primary)]">数据面板</span>
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
            :disabled="!!jsonError"
          >
            应用
          </button>
          <span class="text-xs text-green-500" v-if="applySuccess">✓ 已应用</span>
          <span class="text-xs text-red-500" v-if="jsonError">✗ JSON错误</span>
          <button
            class="text-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            @click="$emit('close')"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Content: Split View -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left: Tree View -->
        <div class="w-[220px] border-r border-[var(--border-light)] overflow-auto p-2">
          <div class="text-xs text-[var(--text-muted)] mb-2 px-1">组件树</div>
          <TreeView 
            :data="components" 
            :selected-id="selectedId"
            @select="handleSelect" 
          />
        </div>

        <!-- Right: JSON Editor -->
        <div class="flex-1 relative overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
            <div class="flex items-center gap-2">
              <span class="text-xs text-[var(--text-muted)]">
                {{ selectedId ? `已选中: ${selectedId}` : '点击左侧节点高亮 JSON' }}
              </span>
            </div>
          </div>
          <div class="flex-1 overflow-hidden">
            <JsonEditor
              ref="jsonEditorRef"
              v-model="jsonText"
              @error="handleJsonError"
              @change="handleJsonChange"
            />
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
import JsonEditor from './JsonEditor.vue'

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

const selectedId = ref<string | null>(null)
const jsonError = ref<string | null>(null)
const applySuccess = ref(false)
const jsonEditorRef = ref<InstanceType<typeof JsonEditor> | null>(null)

// JSON text
const jsonText = ref('')

// Sync components to JSON
watch(() => props.components, (newComps) => {
  try {
    jsonText.value = JSON.stringify(newComps, null, 2)
    jsonError.value = null
  } catch {
    jsonError.value = '序列化失败'
  }
}, { immediate: true, deep: true })

function handleJsonError(err: string | null) {
  jsonError.value = err
}

function handleJsonChange(value: string) {
  try {
    JSON.parse(value)
    jsonError.value = null
  } catch (e: any) {
    jsonError.value = e.message
  }
}

function formatJson() {
  jsonEditorRef.value?.format()
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
  } catch {
    // Fallback
  }
}

function applyJson() {
  if (jsonError.value) return
  
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!Array.isArray(parsed)) {
      jsonError.value = '必须是数组'
      return
    }
    emit('update:components', parsed)
    jsonError.value = null
    applySuccess.value = true
    setTimeout(() => applySuccess.value = false, 2000)
  } catch (e: any) {
    jsonError.value = e.message
  }
}

function handleSelect(id: string) {
  selectedId.value = id
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

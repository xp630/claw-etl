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

        <!-- Right: JSON View -->
        <div class="flex-1 relative overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-tertiary)]">
            <div class="flex items-center gap-2">
              <span class="text-xs text-[var(--text-muted)]">
                {{ selectedId ? `已选中: ${selectedId}` : '点击左侧节点高亮 JSON' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <input type="checkbox" v-model="isEditable" class="w-3 h-3" />
                可编辑
              </label>
            </div>
          </div>
          <div class="flex-1 overflow-hidden">
            <!-- Editable textarea -->
            <textarea
              v-if="isEditable"
              ref="jsonTextareaRef"
              v-model="jsonText"
              class="w-full h-full p-4 font-mono text-xs leading-5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-none resize-none focus:outline-none"
              spellcheck="false"
              @input="onJsonInput"
            />
            <!-- Highlighted view (read-only) -->
            <div v-else ref="jsonContainerRef" class="w-full h-full overflow-auto p-4">
              <pre
                ref="jsonPreRef"
                class="font-mono text-xs leading-5 text-[var(--text-primary)]"
                v-html="highlightedJson"
              />
            </div>
          </div>
          <div v-if="jsonError" class="absolute bottom-16 left-2 right-2 text-xs text-red-500 bg-red-500/10 border border-red-500/30 p-2 rounded mx-2 mb-2">
            {{ jsonError }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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

const selectedId = ref<string | null>(null)
const jsonError = ref('')
const applySuccess = ref(false)
const jsonPreRef = ref<HTMLPreElement | null>(null)
const jsonContainerRef = ref<HTMLDivElement | null>(null)
const jsonTextareaRef = ref<HTMLTextAreaElement | null>(null)
const isEditable = ref(false)

// Current JSON text (for editing)
const jsonText = ref('')

// Sync components to JSON
watch(() => props.components, (newComps) => {
  try {
    jsonText.value = JSON.stringify(newComps, null, 2)
    jsonError.value = ''
  } catch {
    jsonError.value = '序列化失败'
  }
}, { immediate: true, deep: true })

// Highlighted JSON with selected component highlighted
const highlightedJson = computed(() => {
  try {
    const obj = JSON.parse(jsonText.value)
    const json = JSON.stringify(obj, null, 2)
    
    if (!selectedId.value) {
      return syntaxHighlight(json)
    }

    // Find the selected component in JSON and highlight it
    const lines = json.split('\n')
    const result: string[] = []
    let inSelected = false
    let braceCount = 0
    let selectedStartLine = -1
    let selectedEndLine = -1
    let currentLine = 0

    // Simple approach: highlight lines containing the selected ID
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const idPattern = `"id":\\s*"${selectedId.value}"`
      const hasId = new RegExp(idPattern).test(line)
      
      if (hasId) {
        inSelected = true
        selectedStartLine = i
        // Find matching closing brace
        let bCount = 0
        for (let j = i; j < lines.length; j++) {
          bCount += (lines[j].match(/"/g) || []).length
          braceCount += (lines[j].match(/{/g) || []).length
          braceCount -= (lines[j].match(/}/g) || []).length
          if (braceCount === 0 && j > i) {
            selectedEndLine = j
            break
          }
        }
      }
      
      if (inSelected && i >= selectedStartLine && i <= selectedEndLine) {
        result.push(`<span class="bg-blue-500/30 text-blue-300">${escapeHtml(line)}</span>`)
      } else {
        result.push(`<span class="json-default">${escapeHtml(line)}</span>`)
      }
      
      if (inSelected && i === selectedEndLine) {
        inSelected = false
      }
    }

    return result.join('\n')
  } catch {
    return syntaxHighlight(jsonText.value)
  }
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
          match = match.replace(/:$/, '')
          return `<span class="${cls}">${match}</span>:`
        } else {
          cls = 'json-string'
        }
      }
      return `<span class="${cls}">${match}</span>`
    })
}

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
    // Fallback
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

function handleSelect(id: string) {
  selectedId.value = id
  emit('select', id)
  
  // Scroll to highlighted section
  setTimeout(() => {
    const pre = jsonPreRef.value
    const highlighted = pre?.querySelector('.bg-blue-500\\/30')
    if (highlighted) {
      highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
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

:deep(.json-key) { color: #e6db74; }
:deep(.json-string) { color: #ae81ff; }
:deep(.json-number) { color: #ae81ff; }
:deep(.json-default) { color: #f8f8f2; }
</style>

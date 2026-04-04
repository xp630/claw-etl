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
            <!-- Highlighted view with collapsible regions -->
            <div v-else ref="jsonContainerRef" class="w-full h-full overflow-auto p-4" @click="handleJsonClick">
              <pre
                ref="jsonPreRef"
                class="font-mono text-xs leading-5 text-[var(--text-primary)] cursor-pointer"
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
const collapsedItems = ref<Set<number>>(new Set())

// Parse JSON and build lines with collapse info
interface JsonLine {
  text: string
  indent: number
  lineNum: number
  startChar: number
  endChar: number
  isObject: boolean
  isArray: boolean
  key?: string
  value?: string
  toggleable: boolean
  path: string
}

let parsedJsonLines: JsonLine[] = []

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

// Highlighted JSON with collapsible regions and selection highlighting
const highlightedJson = computed(() => {
  try {
    const obj = JSON.parse(jsonText.value)
    parsedJsonLines = []
    
    // Build structured JSON lines
    const lines = jsonText.value.split('\n')
    let charIndex = 0
    let lineIndex = 0
    
    lines.forEach((line, idx) => {
      const trimmed = line.replace(/^(\s+)/, '')
      const indent = line.length - trimmed.length
      const keyMatch = trimmed.match(/^"([^"]+)":/)
      const isObject = trimmed.includes('{"')
      const isArray = trimmed.includes('[') && trimmed.includes(']')
      const toggleable = (isObject || (trimmed.includes('[') && !trimmed.includes(']'))) && trimmed.endsWith('{')
      
      parsedJsonLines.push({
        text: line,
        indent,
        lineNum: idx,
        startChar: charIndex,
        endChar: charIndex + line.length,
        isObject,
        isArray,
        key: keyMatch ? keyMatch[1] : undefined,
        toggleable,
        path: ''
      })
      
      charIndex += line.length + 1
      lineIndex++
    })
    
    // Build result with collapse and highlight
    const result: string[] = []
    let i = 0
    
    while (i < parsedJsonLines.length) {
      const line = parsedJsonLines[i]
      const isCollapsed = collapsedItems.value.has(i)
      
      // Check if this line should be highlighted (selected component)
      const isHighlighted = selectedId.value && line.text.includes(`"id": "${selectedId.value}"`)
      
      // Build toggle button for collapsible items
      let toggleBtn = ''
      if (line.toggleable) {
        const collapsed = collapsedItems.value.has(i)
        toggleBtn = `<span class="collapse-btn" data-line="${i}">${collapsed ? '▶' : '▼'}</span> `
      } else {
        toggleBtn = '<span class="w-4 inline-block"></span> '
      }
      
      if (isCollapsed) {
        // Show collapsed line with count
        const endLine = findCollapseEnd(i)
        const itemCount = endLine - i
        result.push(`<div class="json-line collapsed" data-start="${i}" data-end="${endLine}">${toggleBtn}<span class="json-key">"${line.key || 'object'}"</span>: <span class="json-comment">${itemCount} items...</span> <span class="json-hover" data-line="${i}">...</span></div>`)
        i = endLine + 1
        continue
      }
      
      // Normal highlight
      const highlighted = isHighlighted 
        ? `<span class="bg-blue-500/30 text-blue-300">${escapeHtml(line.text)}</span>`
        : syntaxHighlightLine(line.text)
      
      result.push(`<div class="json-line" data-line="${i}">${toggleBtn}${highlighted}</div>`)
      i++
    }
    
    return result.join('')
  } catch {
    return syntaxHighlight(jsonText.value)
  }
})

function findCollapseEnd(startLine: number): number {
  let braceCount = 0
  let inString = false
  const text = parsedJsonLines.slice(startLine).map(l => l.text).join('\n')
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"' && text[i-1] !== '\\') inString = !inString
    if (!inString) {
      if (char === '{') braceCount++
      if (char === '}') {
        braceCount--
        if (braceCount === 0) {
          // Find which line this is
          let lineCount = 0
          for (let j = 0; j < i; j++) {
            if (text[j] === '\n') lineCount++
          }
          return startLine + lineCount
        }
      }
    }
  }
  return startLine
}

function syntaxHighlightLine(line: string): string {
  // Escape HTML first
  let result = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Simple JSON syntax highlighting
  // Match strings (keys or values)
  result = result.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/g, '<span class="json-key">"$1"</span>:')
  result = result.replace(/:(\s*)"([^"\\]*(?:\\.[^"\\]*)*)"/g, ':$1<span class="json-string">"$2"</span>')
  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
  // Booleans and null
  result = result.replace(/\b(true|false|null)\b/g, '<span class="json-number">$1</span>')
  
  return result
}

function handleJsonClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  
  // Handle collapse button click
  if (target.classList.contains('collapse-btn') || target.classList.contains('json-hover')) {
    const line = target.dataset.line || target.closest('.json-line')?.getAttribute('data-line')
    if (line !== null) {
      const lineNum = parseInt(line)
      if (collapsedItems.value.has(lineNum)) {
        collapsedItems.value.delete(lineNum)
      } else {
        const endLine = findCollapseEnd(lineNum)
        // Mark all lines in range as collapsed
        for (let i = lineNum; i <= endLine; i++) {
          collapsedItems.value.add(i)
        }
      }
    }
    return
  }
  
  // Handle expand click (on collapsed items)
  const collapsedDiv = target.closest('.collapsed')
  if (collapsedDiv) {
    const start = parseInt(collapsedDiv.getAttribute('data-start') || '0')
    const end = parseInt(collapsedDiv.getAttribute('data-end') || '0')
    for (let i = start; i <= end; i++) {
      collapsedItems.value.delete(i)
    }
  }
}

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

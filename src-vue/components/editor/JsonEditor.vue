<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, foldKeymap } from '@codemirror/language'
import { lintGutter, linter } from '@codemirror/lint'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { bracketMatching } from '@codemirror/language'

interface Props {
  modelValue: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
  'error': [error: string | null]
}>()

const editorRef = ref<HTMLDivElement | null>(null)
const editorView = shallowRef<EditorView | null>(null)
const error = ref<string | null>(null)

// JSON linter
const jsonLinter = linter((view) => {
  const content = view.state.doc.toString()
  if (!content.trim()) return []
  
  try {
    JSON.parse(content)
    error.value = null
    emit('error', null)
    return []
  } catch (e: any) {
    error.value = e.message
    emit('error', e.message)
    
    // Try to find the error position
    const match = e.message.match(/position (\d+)/)
    if (match) {
      const pos = parseInt(match[1])
      return [{
        from: Math.max(0, pos - 1),
        to: Math.min(content.length, pos + 1),
        severity: 'error',
        message: e.message
      }]
    }
    return [{
      from: 0,
      to: content.length,
      severity: 'error',
      message: e.message
    }]
  }
})

// Dark theme
const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12px',
    backgroundColor: 'var(--bg-tertiary, #1e1e1e)'
  },
  '.cm-content': {
    fontFamily: 'Menlo, Monaco, Consolas, monospace',
    caretColor: '#fff',
    padding: '8px 0'
  },
  '.cm-cursor': {
    borderLeftColor: '#fff'
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-secondary, #252526)',
    color: '#6e7681',
    border: 'none',
    paddingRight: '8px'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--bg-tertiary, #2d2d2d)'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  '.cm-foldGutter': {
    width: '12px'
  },
  '.cm-scroller': {
    overflow: 'auto'
  },
  '.cm-diagnostic': {
    backgroundColor: 'rgba(255,100,100,0.1)',
    border: 'none',
    borderLeft: '2px solid #f44'
  },
  '.cm-diagnostic-error': {
    borderLeftColor: '#f44'
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    backgroundColor: 'rgba(255,80,80,0.1)'
  }
}, { dark: true })

function createEditor() {
  if (!editorRef.value) return

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const value = update.state.doc.toString()
      emit('update:modelValue', value)
      emit('change', value)
    }
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      bracketMatching(),
      autocompletion(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...searchKeymap,
        ...completionKeymap
      ]),
      json(),
      jsonLinter,
      lintGutter(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      darkTheme,
      updateListener,
      EditorView.lineWrapping,
      ...(props.readonly ? [EditorState.readOnly.of(true)] : [])
    ]
  })

  editorView.value = new EditorView({
    state,
    parent: editorRef.value
  })
}

function destroyEditor() {
  if (editorView.value) {
    editorView.value.destroy()
    editorView.value = null
  }
}

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (editorView.value) {
    const current = editorView.value.state.doc.toString()
    if (current !== newVal) {
      editorView.value.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: newVal
        }
      })
    }
  }
})

onMounted(() => {
  createEditor()
})

onUnmounted(() => {
  destroyEditor()
})

// Expose methods
function format() {
  if (!editorView.value) return
  const content = editorView.value.state.doc.toString()
  try {
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: content.length,
        insert: formatted
      }
    })
    error.value = null
  } catch (e: any) {
    error.value = e.message
  }
}

function getValue(): string {
  return editorView.value?.state.doc.toString() || ''
}

defineExpose({ format, getValue })
</script>

<template>
  <div class="json-editor h-full flex flex-col">
    <div ref="editorRef" class="flex-1 overflow-hidden" />
  </div>
</template>

<style scoped>
.json-editor {
  background: var(--bg-tertiary, #1e1e1e);
}

.json-editor :deep(.cm-editor) {
  height: 100%;
}

.json-editor :deep(.cm-scroller) {
  font-family: Menlo, Monaco, Consolas, monospace;
}
</style>

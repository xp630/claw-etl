<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine, lineWrapping } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language'
import { linter } from '@codemirror/lint'
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

// JSON linter using built-in jsonParseLinter
const jsonLinter = jsonParseLinter()

// Custom dark theme with better fold styling
const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12px',
    backgroundColor: '#1e1e1e'
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
    backgroundColor: '#252526',
    color: '#6e7681',
    border: 'none',
    paddingRight: '8px'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2d2d2d'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  '.cm-foldGutter': {
    width: '16px'
  },
  '.cm-foldGutter .cm-gutterElement': {
    cursor: 'pointer',
    color: '#6e7681',
    transition: 'color 0.1s'
  },
  '.cm-foldGutter .cm-gutterElement:hover': {
    color: '#fff'
  },
  '.cm-foldGutter .cm-gutterElement .cm-foldIndicator': {
    fontSize: '10px'
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
  },
  '.cm-tooltip': {
    backgroundColor: '#252526',
    border: '1px solid #3c3c3c'
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
      indentOnInput(),
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
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      darkTheme,
      updateListener,
      lineWrapping,
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
  background: #1e1e1e;
}

.json-editor :deep(.cm-editor) {
  height: 100%;
}

.json-editor :deep(.cm-scroller) {
  font-family: Menlo, Monaco, Consolas, monospace;
}

.json-editor :deep(.cm-foldGutter .cm-gutterElement) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

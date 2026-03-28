<template>
  <div class="editor-page">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-left">
        <h1 class="page-title">{{ store.pageTitle }}</h1>
        <input
          v-model="store.pageTitle"
          type="text"
          class="title-input"
          placeholder="输入页面名称"
        />
      </div>
      <div class="header-right">
        <span class="component-count">{{ store.components.length }} 个组件</span>
        <button class="btn btn-save" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button class="btn btn-preview" @click="handlePreview">
          预览
        </button>
        <button class="btn btn-secondary" @click="handleClear">
          清空
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="editor-content">
      <!-- Left: Component Panel -->
      <ComponentPanel class="component-panel" />

      <!-- Center: Canvas -->
      <DropCanvas
        class="drop-canvas"
        :components="store.components"
        :selected-id="store.selectedId"
        @select="store.selectComponent"
        @reorder="store.moveComponent"
        @delete="store.removeComponent"
        @drop="handleDrop"
        @add-child="handleAddChildToContainer"
        @remove-child="store.removeChildFromContainer"
      />

      <!-- Right: Property Panel -->
      <PropertyPanel
        class="property-panel"
        :selected-component="store.selectedComponent"
        @update-props="handleUpdateProps"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import ComponentPanel from '@/components/editor/ComponentPanel.vue'
import DropCanvas from './DropCanvas.vue'
import PropertyPanel from '@/components/editor/PropertyPanel.vue'
import type { CanvasComponent } from './types'

const store = useEditorStore()
const saving = ref(false)

function handleDrop(e: DragEvent) {
  const data = e.dataTransfer?.getData('application/json')
  if (data) {
    try {
      const parsed = JSON.parse(data)
      if (parsed.fromPalette) {
        store.addComponentToCanvas(parsed.type, parsed.label, parsed.defaultProps || {})
      }
    } catch (err) {
      console.error('Failed to parse drop data:', err)
    }
  }
}

function handleUpdateProps(props: Record<string, unknown>) {
  if (store.selectedId) {
    store.updateComponentProps(store.selectedId, props)
  }
}

function handleAddChildToContainer(containerId: string, child: CanvasComponent, tabIndex?: number) {
  store.addChildToContainer(containerId, child, tabIndex)
}

function handlePreview() {
  if (!store.pageCode) {
    alert('请先保存页面后再预览')
    return
  }
  window.open(`#/render/${store.pageCode}`, '_blank')
}

function handleClear() {
  if (confirm('确定要清空所有组件吗？')) {
    store.$reset()
  }
}

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' && store.selectedId && !isInputFocused()) {
    store.removeComponent(store.selectedId)
  }
}

function isInputFocused(): boolean {
  const active = document.activeElement
  return active instanceof HTMLInputElement ||
         active instanceof HTMLTextAreaElement ||
         active instanceof HTMLSelectElement
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-secondary, #f5f7fa);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid var(--border-light, #e4e7ed);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #303133);
  margin: 0;
}

.title-input {
  padding: 4px 12px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
}

.title-input:focus {
  outline: none;
  border-color: var(--accent, #409eff);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.component-count {
  font-size: 12px;
  color: var(--text-muted, #909399);
  margin-right: 8px;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-save {
  background: var(--accent, #409eff);
  color: #fff;
}

.btn-save:hover {
  background: #66b1ff;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-preview {
  background: var(--success, #67c23a);
  color: #fff;
}

.btn-preview:hover {
  background: #85ce61;
}

.btn-secondary {
  background: var(--bg-secondary, #f5f7fa);
  color: var(--text-secondary, #606266);
  border: 1px solid var(--border, #dcdfe6);
}

.btn-secondary:hover {
  background: #ecf5ff;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.component-panel {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--border-light, #e4e7ed);
  overflow-y: auto;
}

.drop-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-secondary, #f5f7fa);
}

.property-panel {
  width: 288px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid var(--border-light, #e4e7ed);
  overflow-y: auto;
}
</style>

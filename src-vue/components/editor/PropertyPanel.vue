<template>
  <div class="property-panel">
    <h3 class="panel-title">属性配置</h3>
    
    <div v-if="!selectedComponent" class="empty-state">
      <p>点击组件进行配置</p>
    </div>
    
    <div v-else class="component-props">
      <div class="prop-section">
        <h4 class="prop-section-title">基本信息</h4>
        <div class="prop-item">
          <label>组件类型</label>
          <span class="prop-value">{{ selectedComponent.type }}</span>
        </div>
        <div class="prop-item">
          <label>组件标签</label>
          <input
            :value="selectedComponent.label"
            type="text"
            class="prop-input"
            @input="updateProp('label', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="prop-section">
        <h4 class="prop-section-title">组件属性</h4>
        <div v-for="(value, key) in selectedComponent.props" :key="key" class="prop-item">
          <label>{{ String(key) }}</label>
          <input
            :value="value"
            type="text"
            class="prop-input"
            @input="updateProp(String(key), ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CanvasComponent } from '@/pages/editor/types'

interface Props {
  selectedComponent: CanvasComponent | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-props': [props: Record<string, unknown>]
}>()

function updateProp(key: string, value: unknown) {
  if (props.selectedComponent) {
    emit('update-props', {
      ...props.selectedComponent.props,
      [key]: value,
    })
  }
}
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #303133);
  margin: 0 0 16px 0;
}

.empty-state {
  text-align: center;
  color: var(--text-muted, #909399);
  padding: 40px 20px;
}

.component-props {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prop-section {
  border: 1px solid var(--border-light, #e4e7ed);
  border-radius: 4px;
  padding: 12px;
}

.prop-section-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #606266);
  margin: 0 0 12px 0;
}

.prop-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.prop-item:last-child {
  margin-bottom: 0;
}

.prop-item label {
  font-size: 12px;
  color: var(--text-muted, #909399);
}

.prop-value {
  font-size: 13px;
  color: var(--text-primary, #303133);
}

.prop-input {
  padding: 6px 8px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
}

.prop-input:focus {
  outline: none;
  border-color: var(--accent, #409eff);
}
</style>

<template>
  <div class="dynamic-props">
    <div
      v-for="(propSchema, propName) in schema.props"
      :key="propName"
      class="prop-item"
    >
      <!-- Skip if prop doesn't exist in component's props -->
      <template v-if="hasPropValue(propName)">
        <label>{{ propSchema.label }}</label>
        
        <!-- text input -->
        <input
          v-if="propSchema.control === 'text'"
          :value="propValue(propName)"
          type="text"
          class="prop-input"
          :placeholder="propSchema.placeholder"
          @input="emit('update', propName, ($event.target as HTMLInputElement).value)"
        />
        
        <!-- textarea -->
        <textarea
          v-else-if="propSchema.control === 'textarea'"
          :value="propValue(propName)"
          class="prop-textarea"
          :rows="propSchema.rows || 3"
          :placeholder="propSchema.placeholder"
          @input="emit('update', propName, ($event.target as HTMLTextAreaElement).value)"
        />
        
        <!-- number input -->
        <input
          v-else-if="propSchema.control === 'number'"
          :value="propValue(propName)"
          type="number"
          class="prop-input"
          :min="propSchema.min"
          :max="propSchema.max"
          :step="propSchema.step"
          @input="emit('update', propName, Number(($event.target as HTMLInputElement).value))"
        />
        
        <!-- switch -->
        <label v-else-if="propSchema.control === 'switch'" class="switch-label">
          <input
            :checked="propValue(propName)"
            type="checkbox"
            class="prop-checkbox"
            @change="emit('update', propName, ($event.target as HTMLInputElement).checked)"
          />
          <span class="switch-text">{{ propValue(propName) ? '是' : '否' }}</span>
        </label>
        
        <!-- slider -->
        <div v-else-if="propSchema.control === 'slider'" class="slider-container">
          <input
            :value="propValue(propName)"
            type="range"
            class="prop-range"
            :min="propSchema.min || 0"
            :max="propSchema.max || 100"
            :step="propSchema.step || 1"
            @input="emit('update', propName, Number(($event.target as HTMLInputElement).value))"
          />
          <span class="slider-value">{{ propValue(propName) }}</span>
        </div>
        
        <!-- select -->
        <select
          v-else-if="propSchema.control === 'select'"
          :value="propValue(propName)"
          class="prop-input"
          @change="emit('update', propName, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in propSchema.options"
            :key="String(opt.value)"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        
        <!-- color -->
        <div v-else-if="propSchema.control === 'color'" class="color-container">
          <input
            :value="propValue(propName)"
            type="color"
            class="prop-color"
            @input="emit('update', propName, ($event.target as HTMLInputElement).value)"
          />
          <input
            :value="propValue(propName)"
            type="text"
            class="prop-input"
            placeholder="#000000"
            @input="emit('update', propName, ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- code (JSON editor) -->
        <div v-else-if="propSchema.control === 'code'" class="code-container">
          <textarea
            :value="typeof propValue(propName) === 'object' ? JSON.stringify(propValue(propName), null, 2) : propValue(propName)"
            class="prop-textarea font-mono text-xs"
            rows="4"
            @input="handleCodeInput(propName, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        
        <!-- options editor (for select/radio/checkbox group) -->
        <OptionsEditor
          v-else-if="propSchema.control === 'custom' && propSchema.custom === 'options-editor'"
          :value="propValue(propName)"
          @update="emit('update', propName, $event)"
        />
        
        <!-- Fallback: show value as text -->
        <span v-else class="prop-value">{{ propValue(propName) }}</span>
      </template>
    </div>
    
    <!-- Show info if no props defined -->
    <div v-if="Object.keys(schema.props).length === 0" class="empty-props">
      <p>该组件暂无可配置属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentSchema, PropSchema } from '@/pages/editor/component-schema'
import OptionsEditor from './OptionsEditor.vue'

interface Props {
  schema: ComponentSchema
  props: Record<string, unknown>
}

interface Emits {
  (e: 'update', propName: string, value: unknown): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Check if component actually has this prop (even if undefined/null, still show it)
function hasPropValue(propName: string): boolean {
  return propName in props.props
}

// Get prop value, handling undefined
function propValue(propName: string): unknown {
  return props.props[propName]
}

// Handle code/JSON input with validation
function handleCodeInput(propName: string, value: string) {
  try {
    // Try to parse as JSON if it looks like JSON
    if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
      const parsed = JSON.parse(value)
      emit('update', propName, parsed)
    } else {
      emit('update', propName, value)
    }
  } catch {
    // Not valid JSON, store as string
    emit('update', propName, value)
  }
}
</script>

<style scoped>
.dynamic-props {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prop-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prop-item label {
  font-size: 12px;
  color: var(--text-muted, #909399);
}

.prop-input {
  padding: 6px 10px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
  width: 100%;
}

.prop-input:focus {
  outline: none;
  border-color: var(--accent, #409eff);
  box-shadow: 0 0 0 2px var(--accent-light, #ecf5ff);
}

.prop-textarea {
  padding: 6px 10px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
  width: 100%;
  resize: vertical;
  font-family: inherit;
}

.prop-textarea:focus {
  outline: none;
  border-color: var(--accent, #409eff);
  box-shadow: 0 0 0 2px var(--accent-light, #ecf5ff);
}

.prop-range {
  width: 100%;
  cursor: pointer;
}

.prop-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent, #409eff);
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.switch-text {
  font-size: 13px;
  color: var(--text-primary, #303133);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-value {
  font-size: 12px;
  color: var(--text-muted, #909399);
  min-width: 30px;
}

.color-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prop-color {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
}

.code-container textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.empty-props {
  padding: 16px;
  text-align: center;
  color: var(--text-muted, #909399);
  font-size: 13px;
}
</style>

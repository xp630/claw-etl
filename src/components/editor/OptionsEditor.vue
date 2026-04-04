<template>
  <div class="options-editor">
    <div
      v-for="(option, index) in options"
      :key="index"
      class="option-row"
    >
      <input
        :value="option.label"
        type="text"
        class="option-input"
        placeholder="标签"
        @input="updateOption(index, 'label', ($event.target as HTMLInputElement).value)"
      />
      <input
        :value="option.value"
        type="text"
        class="option-input option-value"
        placeholder="值"
        @input="updateOption(index, 'value', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="option-remove"
        @click="removeOption(index)"
      >
        ✕
      </button>
    </div>
    <button
      type="button"
      class="add-option"
      @click="addOption"
    >
      + 添加选项
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: unknown
}

interface Props {
  value?: Option[] | string[]
}

interface Emits {
  (e: 'update', value: Option[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Parse value into Option[] format
const options = computed<Option[]>(() => {
  if (!props.value) return []
  if (Array.isArray(props.value)) {
    // Check if it's already Option[] or string[]
    if (props.value.length === 0) return []
    const first = props.value[0]
    if (typeof first === 'string') {
      // Convert string[] to Option[]
      return (props.value as string[]).map(s => ({ label: s, value: s }))
    }
    return props.value as Option[]
  }
  return []
})

function addOption() {
  const newOptions = [...options.value, { label: '', value: '' }]
  emit('update', newOptions)
}

function removeOption(index: number) {
  const newOptions = options.value.filter((_, i) => i !== index)
  emit('update', newOptions)
}

function updateOption(index: number, key: 'label' | 'value', val: string) {
  const newOptions = options.value.map((opt, i) => {
    if (i !== index) return opt
    return { ...opt, [key]: val }
  })
  emit('update', newOptions)
}
</script>

<style scoped>
.options-editor {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.option-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border, #dcdfe6);
  border-radius: 4px;
  font-size: 12px;
  background: var(--input-bg, #fff);
}

.option-input:focus {
  outline: none;
  border-color: var(--accent, #409eff);
}

.option-value {
  flex: 1;
}

.option-remove {
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: var(--danger, #f56c6c);
  cursor: pointer;
  font-size: 12px;
}

.option-remove:hover {
  opacity: 0.7;
}

.add-option {
  padding: 4px 8px;
  background: var(--bg-secondary, #f5f7fa);
  border: 1px dashed var(--border, #dcdfe6);
  border-radius: 4px;
  color: var(--text-muted, #909399);
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;
}

.add-option:hover {
  border-color: var(--accent, #409eff);
  color: var(--accent, #409eff);
}
</style>

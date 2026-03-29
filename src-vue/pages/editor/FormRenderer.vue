<template>
  <div class="form-renderer">
    <!-- Not configured -->
    <div v-if="!featureId" class="p-6 border border-dashed border-[var(--border)] rounded bg-[var(--bg-table-header)] text-center">
      <div class="text-[var(--text-muted)] text-sm">请先在右侧绑定数据源和 Feature</div>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="p-6 border border-dashed border-[var(--border)] rounded bg-[var(--bg-table-header)] text-center">
      <div class="text-[var(--text-muted)] text-sm">加载中...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-6 border border-dashed border-red-300 rounded bg-red-50 text-center">
      <div class="text-red-400 text-sm">{{ error }}</div>
    </div>

    <!-- Empty fields -->
    <div v-else-if="formColumns.length === 0" class="p-6 border border-dashed border-[var(--border)] rounded bg-[var(--bg-table-header)] text-center">
      <div class="text-[var(--text-muted)] text-sm">未配置表单字段</div>
    </div>

    <!-- Form -->
    <div v-else class="border border-[var(--border-light)] rounded bg-[var(--bg-secondary)] p-4">
      <div class="space-y-4">
        <div v-for="field in formColumns" :key="field.key" class="flex flex-col gap-1">
          <label class="text-xs font-medium text-[var(--text-secondary)]">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500 ml-1">*</span>
          </label>

          <!-- Textarea -->
          <el-input
            v-if="field.fieldType === 'textarea'"
            type="textarea"
            v-model="formValues[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="!showEdit"
            :rows="3"
          />

          <!-- Select -->
          <el-select
            v-else-if="field.fieldType === 'select'"
            v-model="formValues[field.key]"
            :placeholder="field.placeholder || '请选择'"
            :disabled="!showEdit"
            class="w-full"
          >
            <el-option
              v-for="opt in (field.options || [])"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>

          <!-- Date -->
          <el-date-picker
            v-else-if="field.fieldType === 'date'"
            v-model="formValues[field.key]"
            :type="field.dateFormat?.includes('time') || field.dateFormat?.includes('HH') ? 'datetime' : 'date'"
            :placeholder="field.placeholder || `请选择${field.label}`"
            :disabled="!showEdit"
            class="w-full"
          />

          <!-- Number -->
          <el-input-number
            v-else-if="field.fieldType === 'number'"
            v-model="formValues[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="!showEdit"
            class="w-full"
          />

          <!-- Checkbox -->
          <div v-else-if="field.fieldType === 'checkbox'" class="flex items-center gap-2 py-2">
            <el-checkbox
              v-model="formValues[field.key]"
              :disabled="!showEdit"
            />
            <span class="text-sm text-[var(--text-muted)]">{{ field.placeholder || '是' }}</span>
          </div>

          <!-- Default text input -->
          <el-input
            v-else
            v-model="formValues[field.key]"
            :placeholder="field.placeholder || `请输入${field.label}`"
            :disabled="!showEdit"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div v-if="showAdd || showEdit" class="flex gap-2 mt-6 pt-4 border-t border-[var(--border-light)]">
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface ColumnConfig {
  key: string
  label: string
  fieldType?: string
  visible?: boolean
  required?: boolean
  defaultValue?: any
  placeholder?: string
  dataDictionary?: string
  dateFormat?: string
  options?: string[]
  queryCondition?: boolean
}

interface FormField {
  key: string
  label: string
  fieldType: string
  visible?: boolean
  required?: boolean
  defaultValue?: any
  placeholder?: string
  dataDictionary?: string
  dateFormat?: string
  options?: string[]
  queryCondition?: boolean
}

const props = defineProps<{
  datasourceId?: number
  tableName?: string
  featureId?: number
  columns?: ColumnConfig[]
  showAdd?: boolean
  showEdit?: boolean
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const formColumns = ref<FormField[]>([])
const formValues = reactive<Record<string, any>>({})

async function loadFormConfig() {
  if (!props.featureId) {
    error.value = '请先在右侧绑定数据源和 Feature'
    return
  }

  loading.value = true
  error.value = null

  try {
    // 模拟加载 feature 配置
    // 实际应该调用 API 获取 feature detail
    const fields: FormField[] = []

    if (props.columns && props.columns.length > 0) {
      props.columns.forEach((col: ColumnConfig) => {
        const isVisible = col.visible === undefined || col.visible === true
        const isNotAction = col.fieldType !== 'action'
        const isNotQueryCondition = col.queryCondition !== true
        if (isVisible && isNotAction && isNotQueryCondition) {
          fields.push({
            key: col.key,
            label: col.label,
            fieldType: col.fieldType || 'text',
            visible: isVisible,
            required: col.required || false,
            defaultValue: col.defaultValue,
            placeholder: col.placeholder || '',
            dataDictionary: col.dataDictionary,
            dateFormat: col.dateFormat,
            options: col.options,
            queryCondition: col.queryCondition,
          })
        }
      })
    } else {
      // 默认字段
      fields.push(
        { key: 'name', label: '名称', fieldType: 'text', required: true },
        { key: 'status', label: '状态', fieldType: 'select', options: ['启用', '停用'] },
        { key: 'remark', label: '备注', fieldType: 'textarea' },
      )
    }

    formColumns.value = fields

    // Initialize form values
    fields.forEach(field => {
      formValues[field.key] = field.defaultValue ?? ''
    })
  } catch (err) {
    console.error('Failed to load feature detail:', err)
    error.value = '加载表单配置失败'
  } finally {
    loading.value = false
  }
}

function handleInputChange(key: string, value: any) {
  formValues[key] = value
}

function handleReset() {
  formColumns.value.forEach(field => {
    formValues[field.key] = field.defaultValue ?? ''
  })
}

function handleSubmit() {
  // Validate required fields
  const missing: string[] = []
  formColumns.value.forEach(field => {
    if (field.required && !formValues[field.key]) {
      missing.push(field.label)
    }
  })

  if (missing.length > 0) {
    ElMessage.error(`请填写必填字段：${missing.join('、')}`)
    return
  }

  console.log('Form submitted:', formValues)
  ElMessage.success('表单已提交，请查看控制台输出')
}

watch(() => props.featureId, () => {
  loadFormConfig()
}, { immediate: true })

onMounted(() => {
  loadFormConfig()
})
</script>

<style scoped>
</style>

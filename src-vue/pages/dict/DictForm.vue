<template>
  <div class="p-6">
    <!-- 标题 -->
    <div class="flex items-center gap-3 mb-6">
      <el-button text @click="router.back()">
        <el-icon size="20"><ArrowLeft /></el-icon>
      </el-button>
      <div class="flex items-center gap-3">
        <el-icon size="24" color="var(--accent)"><Document /></el-icon>
        <h1 class="text-xl font-bold">{{ isEdit ? '编辑字典' : '新增字典' }}</h1>
      </div>
    </div>

    <div class="max-w-2xl">
      <!-- 字典基本信息 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
          <h3 class="text-base font-medium text-[var(--accent)]">基本信息</h3>
        </div>

        <el-form :model="formData" label-position="top">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="字典编码" required>
                <el-input v-model="formData.code" placeholder="请输入字典编码" :disabled="isEdit" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="字典名称" required>
                <el-input v-model="formData.name" placeholder="请输入字典名称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="类型">
                <el-select v-model="formData.type" class="w-full">
                  <el-option label="字符串" value="string" />
                  <el-option label="数字" value="number" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-select v-model="formData.status" class="w-full">
                  <el-option label="启用" :value="1" />
                  <el-option label="禁用" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 字典项 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
            <h3 class="text-base font-medium text-[var(--accent)]">字典项</h3>
          </div>
        </div>

        <!-- 新增字典项 -->
        <div class="flex gap-2 mb-4">
          <el-input v-model="newItem.itemLabel" placeholder="标签" class="flex-1" />
          <el-input v-model="newItem.itemValue" placeholder="值" class="flex-1" />
          <el-button type="primary" @click="handleAddItem">
            <el-icon class="mr-1"><Plus /></el-icon>
            添加
          </el-button>
        </div>

        <!-- 字典项列表 -->
        <el-table :data="items" stripe size="small">
          <el-table-column label="排序" width="80">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.sort"
                :min="0"
                size="small"
                class="!w-16"
                @change="(val: number) => handleItemChange($index, 'sort', val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="标签" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.itemLabel"
                size="small"
                @change="(val: string) => handleItemChange($index, 'itemLabel', val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="值" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.itemValue"
                size="small"
                @change="(val: string) => handleItemChange($index, 'itemValue', val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="handleRemoveItem($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="items.length === 0" class="py-8 text-center text-gray-400">
          暂无字典项
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-end mt-6 gap-3">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, Plus, Delete } from '@element-plus/icons-vue'
import { getDictDetail, saveDict, getDictItems, saveDictItems } from '@/lib/api'

interface Dict {
  id?: number
  code: string
  name: string
  type?: string
  remark?: string
  status?: number
}

interface DictItem {
  id?: number
  itemLabel: string
  itemValue: string
  sort?: number
  status?: number
}

const router = useRouter()
const route = useRoute()

const id = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(id.value && id.value !== 'new'))

const loading = ref(false)
const saving = ref(false)
const formData = ref<Partial<Dict>>({
  code: '',
  name: '',
  type: 'string',
  remark: '',
  status: 1,
})
const items = ref<DictItem[]>([])
const newItem = ref({ itemLabel: '', itemValue: '' })

async function loadDict(dictId: number) {
  loading.value = true
  try {
    const dict = await getDictDetail(dictId)
    if (dict) {
      formData.value = dict
    }
  } catch (error) {
    console.error('Failed to load dict:', error)
  } finally {
    loading.value = false
  }
  // 单独加载字典项
  try {
    const dictItems = await getDictItems(dictId)
    items.value = dictItems || []
  } catch (error) {
    console.error('Failed to load dict items:', error)
  }
}

function handleAddItem() {
  if (!newItem.value.itemLabel || !newItem.value.itemValue) {
    ElMessage.warning('请输入标签和值')
    return
  }
  const item: DictItem = {
    itemLabel: newItem.value.itemLabel,
    itemValue: newItem.value.itemValue,
    sort: items.value.length,
    status: 1,
  }
  items.value.push(item)
  newItem.value = { itemLabel: '', itemValue: '' }
}

function handleRemoveItem(index: number) {
  items.value.splice(index, 1)
}

function handleItemChange(index: number, field: keyof DictItem, value: any) {
  items.value[index] = { ...items.value[index], [field]: value }
}

async function handleSubmit() {
  if (!formData.value.code || !formData.value.name) {
    ElMessage.warning('请填写必填项')
    return
  }

  saving.value = true
  try {
    const saved = await saveDict(formData.value)
    if (saved && saved.id) {
      // 保存字典项
      await saveDictItems(saved.id, saved.code || '', items.value)
    }
    ElMessage.success('保存成功')
    router.push('/dict')
  } catch (error) {
    console.error('Failed to save dict:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value && id.value) {
    loadDict(parseInt(id.value))
  }
})
</script>

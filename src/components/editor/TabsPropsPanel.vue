<template>
  <div class="prop-section">
    <div class="flex items-center justify-between mb-2">
      <h4 class="prop-section-title mb-0">标签页配置</h4>
      <button
        type="button"
        class="text-xs text-[var(--accent)] hover:underline"
        @click="addTab"
      >
        + 添加
      </button>
    </div>
    <div class="space-y-1">
      <div
        v-for="(tab, index) in editableTabs"
        :key="index"
        class="border border-[var(--border)] rounded p-2 space-y-1"
      >
        <div class="flex items-center gap-1">
          <input
            :value="tab.label"
            type="text"
            class="flex-1 px-2 py-1 border border-[var(--border)] rounded text-xs"
            placeholder="标签名"
            @input="updateTabLabel(index, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="px-1 text-[var(--danger)] hover:text-red-400 text-xs"
            @click="removeTab(index)"
          >
            ✕
          </button>
        </div>
        <!-- tab 布局配置 -->
        <div class="pl-2 text-xs text-[var(--text-muted)] space-y-1">
          <div class="flex items-center gap-1">
            <span class="shrink-0">方向:</span>
            <select
              :value="tab.layout?.direction || 'column'"
              class="px-1 py-0.5 border border-[var(--border)] rounded text-xs"
              @change="updateTabLayout(index, 'direction', ($event.target as HTMLSelectElement).value as 'row' | 'column')"
            >
              <option value="column">纵向</option>
              <option value="row">横向</option>
            </select>
            <span class="shrink-0">间距:</span>
            <input
              :value="tab.layout?.gap ?? 8"
              type="number"
              class="w-12 px-1 py-0.5 border border-[var(--border)] rounded text-xs"
              min="0"
              @input="updateTabLayout(index, 'gap', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="flex items-center gap-1">
            <span class="shrink-0">对齐:</span>
            <select
              :value="tab.layout?.alignItems || 'stretch'"
              class="px-1 py-0.5 border border-[var(--border)] rounded text-xs"
              @change="updateTabLayout(index, 'alignItems', ($event.target as HTMLSelectElement).value)"
            >
              <option value="start">起始</option>
              <option value="center">居中</option>
              <option value="end">末尾</option>
              <option value="stretch">拉伸</option>
            </select>
            <span class="shrink-0">换行:</span>
            <input
              type="checkbox"
              :checked="tab.layout?.wrap || false"
              class="w-3 h-3"
              @change="updateTabLayout(index, 'wrap', ($event.target as HTMLInputElement).checked)"
            />
          </div>
          <!-- tab 参数配置 -->
          <div class="pt-1 border-t border-[var(--border-light)] mt-1">
            <div class="flex items-center gap-1 mb-1">
              <span class="shrink-0 text-[var(--text-muted)]">参数:</span>
              <button
                type="button"
                class="text-xs text-[var(--accent)] hover:underline"
                @click="addTabParam(index)"
              >
                + 添加参数
              </button>
            </div>
            <div
              v-for="(paramVal, paramKey) in (tab.params || {})"
              :key="paramKey"
              class="flex items-center gap-1 mb-0.5"
            >
              <input
                :value="paramKey"
                type="text"
                class="w-16 px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                placeholder="key"
                @change="updateTabParamKey(index, String(paramKey), ($event.target as HTMLInputElement).value)"
              />
              <span>=</span>
              <input
                :value="paramVal"
                type="text"
                class="flex-1 px-1 py-0.5 border border-[var(--border)] rounded text-xs"
                placeholder="value"
                @input="updateTabParam(index, String(paramKey), ($event.target as HTMLInputElement).value)"
              />
              <button
                type="button"
                class="px-1 text-[var(--danger)] hover:text-red-400 text-xs"
                @click="removeTabParam(index, String(paramKey))"
              >
                ✕
              </button>
            </div>
            <div v-if="!tab.params || Object.keys(tab.params).length === 0" class="text-xs text-[var(--text-muted)] italic">
              暂无参数
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanvasComponent, TabItem } from '@/pages/editor/types'

interface Props {
  selectedComponent: CanvasComponent
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-tabs': [tabs: TabItem[]]
  'update-prop': [key: string, value: any]
  'remove-tab': [tabIndex: number, tabChildren: (string | number)[]]
}>()

// Tabs 操作 - 新格式
const editableTabs = computed<TabItem[]>(() => {
  const tabs = props.selectedComponent?.props?.tabs
  if (!tabs) return []
  return tabs as TabItem[]
})

function addTab() {
  const tabs = editableTabs.value
  const newTab: TabItem = {
    tabId: `tab_${tabs.length}`,
    label: `标签${tabs.length + 1}`,
    params: {},
    children: [],
    layout: { direction: 'column', gap: 8, wrap: false }
  }
  emit('update-tabs', [...tabs, newTab])
}

function updateTabLabel(index: number, label: string) {
  const tabs = editableTabs.value.map((t, i) => i === index ? { ...t, label } : t)
  emit('update-tabs', tabs)
}

function updateTabLayout(index: number, key: string, value: any) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    return { ...t, layout: { ...t.layout, [key]: value } }
  })
  emit('update-tabs', tabs)
}

function removeTab(index: number) {
  const tab = editableTabs.value[index]
  if (!tab) return

  // 检查该 tab 是否包含嵌套组件
  const tabChildren = tab.children || []
  if (tabChildren.length > 0) {
    if (!confirm(`该标签页中包含 ${tabChildren.length} 个嵌套组件，删除标签页将一并删除这些组件。\n\n确定要删除吗？`)) {
      return
    }
    // 通知父组件删除 tab 及其嵌套组件
    emit('remove-tab', index, tabChildren)
    return
  }

  const tabs = editableTabs.value.filter((_, i) => i !== index)
  emit('update-tabs', tabs)
  // 如果当前激活的 tab 被删除，调整 activeTab
  const activeTab = props.selectedComponent?.props.activeTab
  if (activeTab !== undefined && typeof activeTab === 'string') {
    const newActiveTab = tabs[Math.min(Number(activeTab.replace('tab_', '')), tabs.length - 1)]
    if (newActiveTab) emit('update-tabs', tabs.map((t, i) => i === 0 ? { ...t, activeTab: t.tabId } : t))
  }
}

// 添加 tab 参数
function addTabParam(index: number) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    return { ...t, params: { ...(t.params || {}), ['']: '' } }
  })
  emit('update-tabs', tabs)
}

// 更新 tab 参数的值
function updateTabParam(index: number, key: string, value: string) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    return { ...t, params: { ...(t.params || {}), [key]: value } }
  })
  emit('update-tabs', tabs)
}

// 更新 tab 参数的 key（重新命名）
function updateTabParamKey(index: number, oldKey: string, newKey: string) {
  if (newKey === oldKey) return
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    const newParams: Record<string, unknown> = {}
    for (const k in t.params || {}) {
      if (k === oldKey) newParams[newKey] = t.params[k]
      else newParams[k] = t.params[k]
    }
    return { ...t, params: newParams }
  })
  emit('update-tabs', tabs)
}

// 删除 tab 参数
function removeTabParam(index: number, key: string) {
  const tabs = editableTabs.value.map((t, i) => {
    if (i !== index) return t
    const newParams: Record<string, unknown> = {}
    for (const k in t.params || {}) {
      if (k !== key) newParams[k] = t.params[k]
    }
    return { ...t, params: newParams }
  })
  emit('update-tabs', tabs)
}
</script>

<style scoped>
.prop-section {
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e4e7ed);
  border-radius: 6px;
  padding: 12px;
}

.prop-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #606266);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>

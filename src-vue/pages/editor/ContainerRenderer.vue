<template>
  <div class="container-renderer">
    <!-- Card container -->
    <div
      v-if="type === 'card'"
      class="border border-[var(--border-light)] rounded-lg p-4 bg-[var(--bg-secondary)] shadow-sm"
      :style="containerStyle"
    >
      <div v-if="props.title" class="font-medium text-[var(--text-primary)] mb-2">
        {{ props.title }}
      </div>
      <div class="flex-1 min-h-0">
        <slot />
      </div>
    </div>

    <!-- Tabs container -->
    <div
      v-else-if="type === 'tabs'"
      class="border border-[var(--border-light)] rounded-lg p-4 bg-[var(--bg-secondary)]"
      :style="containerStyle"
    >
      <!-- Tab header -->
      <div class="flex border-b border-[var(--border-light)] mb-3">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          class="px-4 py-2 text-sm cursor-pointer transition-colors flex items-center gap-1 group"
          :class="[
            activeTab === index
              ? 'text-blue-500 border-b-2 border-blue-500 -mb-px font-medium'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          ]"
          @click="handleTabClick(index)"
        >
          <span>{{ tab }}</span>
          <button
            v-if="canModify && tabs.length > 1"
            @click.stop="handleDeleteTab(index)"
            class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
            title="删除标签"
          >
            <X class="w-3 h-3 text-red-500" />
          </button>
        </div>
        <!-- Add tab button -->
        <button
          v-if="canModify"
          @click="addingTab = true"
          class="px-2 py-1 text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
          title="添加标签"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- New tab input -->
      <div v-if="addingTab" class="flex items-center gap-1 px-2 mb-2">
        <input
          v-model="newTabName"
          type="text"
          placeholder="标签名"
          class="w-20 px-1 py-0.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-blue-500"
          @keydown.enter="handleAddTab"
          @keydown.escape="cancelAddTab"
          @blur="handleAddTab"
          autofocus
        />
      </div>

      <!-- Tab content -->
      <div class="tab-content overflow-auto" style="min-height: 200px; flex: 1 1 auto; display: flex; flex-direction: column;">
        <slot />
      </div>
    </div>

    <!-- Collapse container -->
    <div
      v-else-if="type === 'collapse'"
      class="border border-[var(--border-light)] rounded"
      :style="containerStyle"
    >
      <div
        class="p-3 bg-[var(--bg-table-header)] cursor-pointer flex justify-between items-center"
        @click="isCollapsed = !isCollapsed"
      >
        <span>{{ props.title || '折叠面板' }}</span>
        <span>{{ isCollapsed ? '▼' : '▲' }}</span>
      </div>
      <div v-show="!isCollapsed" class="p-3">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Plus } from 'lucide-vue-next'

interface Props {
  type: string
  props: Record<string, unknown>
  canModify?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canModify: false,
})

const emit = defineEmits<{
  updateProps: [props: Record<string, unknown>]
}>()

// Tabs state
const tabs = computed(() => (props.props.tabs as string[]) || [])
const activeTab = computed(() => (props.props.activeTab as number) || 0)
const addingTab = ref(false)
const newTabName = ref('')
const isCollapsed = ref(false)

// Container style
const containerStyle = computed(() => ({
  width: props.props.width ?? 'auto',
  height: props.props.height ?? 'auto',
  minWidth: props.props.width !== undefined ? undefined : 'auto',
  minHeight: props.props.height !== undefined ? undefined : 'auto',
}))

// Tab handlers
const handleTabClick = (index: number) => {
  emit('updateProps', { activeTab: index })
}

const handleDeleteTab = (index: number) => {
  const newTabs = [...tabs.value]
  newTabs.splice(index, 1)
  let newActiveTab = activeTab.value
  if (index <= newActiveTab && newActiveTab > 0) {
    newActiveTab = Math.max(0, newActiveTab - 1)
  }
  if (newActiveTab >= newTabs.length) {
    newActiveTab = Math.max(0, newTabs.length - 1)
  }
  emit('updateProps', { tabs: newTabs, activeTab: newActiveTab })
}

const handleAddTab = () => {
  if (newTabName.value.trim()) {
    const newTabs = [...tabs.value, newTabName.value.trim()]
    emit('updateProps', { tabs: newTabs })
  }
  cancelAddTab()
}

const cancelAddTab = () => {
  addingTab.value = false
  newTabName.value = ''
}
</script>

<style scoped>
.container-renderer {
  width: 100%;
}
</style>

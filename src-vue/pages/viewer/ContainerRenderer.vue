<template>
  <div class="container-renderer" :style="containerStyle">
    <!-- Card -->
    <div
      v-if="type === 'card'"
      class="w-full bg-white rounded-lg p-4 flex flex-col border border-gray-200"
      :class="{ 'border': bordered !== false }"
    >
      <div v-if="props.title" class="font-medium text-gray-800 mb-3 text-sm flex-shrink-0">
        {{ props.title }}
      </div>
      <div class="flex-1 min-h-0">
        <slot />
      </div>
    </div>

    <!-- Tabs -->
    <div
      v-else-if="type === 'tabs'"
      class="w-full bg-white border border-gray-200 rounded-lg flex flex-col"
    >
      <div class="flex border-b border-gray-200 px-4 mb-3 -mx-4">
        <div
          v-for="(tab, i) in tabs"
          :key="i"
          class="px-4 py-2 text-sm cursor-pointer transition-colors border-b-2 -mb-px"
          :class="[
            i === activeTab
              ? 'text-blue-500 border-blue-500 font-medium'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          ]"
          @click="activeTab = i"
        >
          {{ tab }}
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </div>
    </div>

    <!-- Collapse -->
    <div
      v-else-if="type === 'collapse'"
      class="w-full bg-white border border-gray-200 rounded-lg flex flex-col"
    >
      <div
        v-for="(panel, i) in panels"
        :key="i"
        class="border border-gray-200 rounded mb-2 last:mb-0 flex flex-col"
        :class="{ 'mt-2': i > 0 }"
      >
        <div class="px-4 py-2.5 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <span class="text-sm font-medium text-gray-800">{{ panel.title }}</span>
          <span class="text-gray-400">▼</span>
        </div>
        <div class="p-4 flex-1 min-h-0">
          <slot v-if="i === 0" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  type: string
  props: Record<string, unknown>
  children?: any[]
}>()

const activeTab = ref(0)

const containerStyle = computed(() => ({
  width: (props.props.width as number | string) ?? '100%',
  minWidth: 0,
  flex: 1,
  borderRadius: '8px',
  padding: '16px',
}))

const tabs = computed(() => {
  return (props.props.tabs as string[]) || []
})

const panels = computed(() => {
  return (props.props.panels as Array<{ title: string; content: string }>) || []
})

const bordered = computed(() => props.props.bordered)
</script>

<style scoped>
.container-renderer {
  display: flex;
  flex-direction: column;
}
</style>

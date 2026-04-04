<template>
  <div class="tree-view font-mono text-xs">
    <div v-if="!data || data.length === 0" class="text-center text-[var(--text-muted)] py-8">
      空组件树
    </div>
    <template v-else>
      <TreeNode
        v-for="comp in data"
        :key="comp.id"
        :comp="comp"
        :depth="0"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CanvasComponent } from '@/pages/editor/types'
import TreeNode from './TreeNode.vue'

interface Props {
  data: CanvasComponent[]
  selectedId?: string | null
}

defineProps<Props>()
defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div
    class="border border-[var(--border-light)] rounded p-4 bg-[var(--bg-table-header)] text-center"
  >
    <div class="text-sm text-[var(--text-secondary)]">
      {{ chartIcon }} {{ title || componentType }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  componentType: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

const chartIcon = computed(() => {
  switch (props.componentType) {
    case 'lineChart': return '📈'
    case 'barChart': return '📊'
    case 'pieChart': return '🥧'
    default: return '📊'
  }
})
</script>

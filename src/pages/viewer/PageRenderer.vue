<template>
  <div class="page-renderer flex flex-col gap-4" style="width: 100%">
    <template v-for="comp in components" :key="comp.id">
      <ContainerRenderer v-if="isContainer(comp.type)" :type="comp.type" :props="comp.props" :children="comp.children" />
      <ElementRenderer v-else :type="comp.type" :props="comp.props" />
    </template>
  </div>
</template>

<script setup lang="ts">
import ContainerRenderer from './ContainerRenderer.vue'
import ElementRenderer from './ElementRenderer.vue'
import type { CanvasComponent } from '@/types/canvas-component'

defineProps<{ components: CanvasComponent[] }>()

const isContainer = (type: string) => ['card', 'tabs', 'collapse'].includes(type)
</script>

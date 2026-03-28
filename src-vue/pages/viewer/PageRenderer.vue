<template>
  <div class="flex flex-col gap-4" style="width: 100%">
    <template v-for="comp in components" :key="comp.id">
      <ContainerRenderer
        v-if="isContainer(comp.type)"
        :type="comp.type"
        :props="comp.props"
        :children="comp.children"
        @event="(id, event, data) => handleEvent(id, event, data)"
      />
      <ElementRenderer
        v-else
        :type="comp.type"
        :props="comp.props"
        @event="(id, event, data) => handleEvent(id, event, data)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import ContainerRenderer from './ContainerRenderer.vue'
import ElementRenderer from './ElementRenderer.vue'

interface ComponentConfig {
  id: string
  type: string
  label: string
  props: Record<string, unknown>
  children?: ComponentConfig[]
}

defineProps<{
  components: ComponentConfig[]
}>()

const emit = defineEmits<{
  event: [componentId: string, event: string, data: any]
}>()

const isContainer = (type: string) => {
  return ['card', 'tabs', 'collapse'].includes(type)
}

const handleEvent = (componentId: string, event: string, data: any) => {
  emit('event', componentId, event, data)
}
</script>

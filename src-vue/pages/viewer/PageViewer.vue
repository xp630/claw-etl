<template>
  <div class="page-viewer p-4">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="text-sm text-gray-500">加载中...</p>
      </div>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-64">
      <p class="text-red-500">{{ error }}</p>
    </div>
    <ComponentRenderer v-else v-for="comp in components" :key="comp.id" :component="comp" :editable="false" :show-children="comp.children" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPageConfigList, getPageConfig } from '@/lib/api'
import ComponentRenderer from '../editor/ComponentRenderer.vue'
import type { CanvasComponent } from '@/types/canvas-component'

const components = ref<CanvasComponent[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const route = useRoute()
  const code = route.params.code as string
  if (!code) { error.value = '页面编码不存在'; loading.value = false; return }

  try {
    const res = await getPageConfigList({ page: 1, limit: 1000 })
    const page = res.list.find((p: any) => p.code === code)
    if (!page) { error.value = '页面不存在'; loading.value = false; return }

    const pageConfig = await getPageConfig(page.id)
    //le.log('[PageViewer] pageConfig:', pageConfig)
    if (!pageConfig) { error.value = '页面不存在或已被禁用'; loading.value = false; return }

    // Parse components - flat to tree
    const compsData = pageConfig.components
    //console.log('[PageViewer] compsData:', compsData)
    //console.log('[PageViewer] pageConfig keys:', Object.keys(pageConfig))
    let flatComps: any[] = []
    if (Array.isArray(compsData)) flatComps = compsData
    else if (compsData?.components) flatComps = compsData.components

    const compMap = new Map<string, any>()
    const rootComps: CanvasComponent[] = []

    flatComps.forEach((c: any) => {
      let props = typeof c.props === 'string' ? JSON.parse(c.props) : (c.props || {})
      const parseProps = (p: any): any => {
        if (typeof p === 'string') { try { return parseProps(JSON.parse(p)) } catch { return p } }
        if (Array.isArray(p)) return p.map(parseProps)
        if (typeof p === 'object' && p !== null) {
          const result: any = {}
          for (const key in p) result[key] = parseProps(p[key])
          return result
        }
        return p
      }
      props = parseProps(props)
      const id = String(c.id)
      compMap.set(id, { id, type: c.type, label: c.type, props, children: [] })
    })

    const containerTypes = ['card', 'tabs', 'collapse']
    flatComps.forEach((c: any) => {
      const comp = compMap.get(String(c.id))
      const parentId = c.parentId
      if (parentId != null && parentId !== undefined) {
        const parent = compMap.get(String(parentId))
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(comp)
        } else {
          rootComps.push(comp)
        }
      } else rootComps.push(comp)
    })

    components.value = rootComps
    //console.log('[PageViewer] rootComps:', JSON.stringify(rootComps, null, 2))
  } catch (err) {
    //console.error('Failed to load page:', err)
    error.value = '加载页面失败'
  } finally {
    loading.value = false
  }
})
</script>

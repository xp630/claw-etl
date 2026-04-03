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
import { isLegacyTabs } from '../editor/types'

/**
 * 递归将 tabs 旧格式迁移为新格式（与 EditorPage.migrateTabsComponents 保持一致）
 * 同时解析 TabItem.children ID 数组为实际的组件对象
 */
function migrateTabsComponents(comps: CanvasComponent[], compMap?: Map<string, any>): CanvasComponent[] {
  return comps.map(comp => {
    let migrated = { ...comp }
    if (migrated.type === 'tabs' && migrated.props?.tabs) {
      const tabs = migrated.props.tabs as any
      if (isLegacyTabs(tabs)) {
        const childrenMap = (migrated.props.childrenMap as Record<string, (string | number)[]>) || {}
        const migratedTabs = tabs.map((label: string, index: number) => ({
          id: `tab_${index}`,
          label,
          params: {},
          children: childrenMap[String(index)] || [],
          layout: { direction: 'column' as const, gap: 8, wrap: false }
        }))
        migrated.props = { ...migrated.props, tabs: migratedTabs }
        delete (migrated.props as any).childrenMap
      }
      // 无论新旧格式，activeTab 必须是 tab ID 字符串
      const rawActiveTab = migrated.props.activeTab
      if (typeof rawActiveTab === 'number') {
        migrated.props = { ...migrated.props, activeTab: `tab_${rawActiveTab}` }
      } else if (rawActiveTab === undefined || rawActiveTab === null) {
        migrated.props = { ...migrated.props, activeTab: 'tab_0' }
      }
      // TabItem.children 保持为 ID 数组（由 ComponentRenderer.tabChildren 解析）
      // 不需要在这里转换为组件对象，否则 ComponentRenderer.tabChildren 的 filter 会失效
    }
    if (migrated.children?.length) {
      migrated = { ...migrated, children: migrateTabsComponents(migrated.children, compMap) }
    }
    return migrated
  })
}

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
      // 为组件生成稳定的 componentId（如果没有的话）
      const componentId = c.componentId || `${c.type}_${c.id}`
      const comp: any = { id, componentId, type: c.type, label: c.type, props, children: [] }
      // 同时通过 id 和 componentId 存储，方便查找
      compMap.set(id, comp)
      compMap.set(componentId, comp)
      // DEBUG: log table component to verify componentId
      if (c.type === 'table') {
        console.log('[PageViewer] Table component stored:', { 
          cId: c.id, cComponentId: c.componentId, 
          computedComponentId: componentId,
          storedKeys: [id, componentId]
        })
      }
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

    // 迁移 tabs 旧格式为新格式（支持 layout 布局参数）
    console.log('[PageViewer] Before migrateTabsComponents:', {
      rootComps: rootComps.map(c => ({ type: c.type, id: c.id, componentId: c.componentId })),
      tabsProps: rootComps.find(c => c.type === 'tabs')?.props?.tabs,
      tableInCompMap: compMap.has('table_211'),
      table211: compMap.get('table_211')
    })
    components.value = migrateTabsComponents(rootComps, compMap)
    console.log('[PageViewer] After migrateTabsComponents:', components.value.map(c => ({ type: c.type, id: c.id, componentId: c.componentId, children: c.children?.map(ch => ch.id) })))
    //console.log('[PageViewer] rootComps:', JSON.stringify(rootComps, null, 2))
  } catch (err) {
    //console.error('Failed to load page:', err)
    error.value = '加载页面失败'
  } finally {
    loading.value = false
  }
})
</script>

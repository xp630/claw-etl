/**
 * Component Tree Utilities
 * Pure functions for working with component trees
 */

import type { CanvasComponent, TabItem } from '../types'

/**
 * Find a component by id in a tree (matches by id or componentId)
 */
export function findComponent(comps: CanvasComponent[], id: string | null): CanvasComponent | null {
  if (!id) return null
  const idStr = String(id)
  for (const c of comps) {
    if (String(c.id) === idStr || c.componentId === idStr) return c
    if (c.children && c.children.length > 0) {
      const found = findComponent(c.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Find parent container id for a child component
 */
export function findParentContainerId(comps: CanvasComponent[], childId: string, parentId: string | null = null): string | null {
  for (const c of comps) {
    if (c.id === childId || c.componentId === childId) {
      return parentId
    }
    if (c.children && c.children.length > 0) {
      const found = findParentContainerId(c.children, childId, c.componentId || c.id)
      if (found !== null) return found
    }
  }
  return null
}

/**
 * Check if a type is a container type
 */
export function isContainerType(type: string): boolean {
  return ['card', 'tabs', 'collapse'].includes(type)
}

/**
 * Get children for a container (filtered by active tab for tabs)
 */
export function getContainerChildren(comp: CanvasComponent): CanvasComponent[] {
  if (comp.type === 'tabs') {
    const activeTabId = comp.props?.activeTab as string || 'tab_0'
    return (comp.children || []).filter(c =>
      (c as any).tabId === activeTabId
    )
  }
  return comp.children || []
}

// Load component from flat data
export function loadComponent(c: any): CanvasComponent {
  let props: Record<string, any> = {}
  try {
    if (typeof c.props === 'object' && c.props !== null) {
      props = c.props
    } else {
      props = JSON.parse(c.props || '{}')
    }
  } catch {
    if (typeof c.props === 'object' && c.props !== null) {
      props = c.props
    }
  }
  return {
    id: String(c.id) || `comp_${Date.now()}`,
    componentId: c.componentId
      ? String(c.componentId)
      : `${c.type}_${c.id || Date.now()}`,
    parentComponentId: c.parentComponentId || undefined,
    tabId: c.tabId || undefined,
    type: c.type,
    label: c.label || '',
    props,
    children: []
  }
}

/**
 * Build tree structure from flat list using parentComponentId + tabId
 */
export function buildComponentTree(flatComponents: any[]): CanvasComponent[] {
  const componentMap = new Map<string, CanvasComponent>()
  const rootComponents: CanvasComponent[] = []

  // First create all components and store by componentId
  flatComponents.forEach(c => {
    const comp = loadComponent(c)
    if (comp.componentId) {
      componentMap.set(comp.componentId, comp)
    }
    if (comp.id) {
      componentMap.set(String(comp.id), comp)
    }
  })

  // Group children by parentComponentId (for regular containers)
  const childrenByParent = new Map<string, CanvasComponent[]>()
  // Group children by parentComponentId + tabId (for tabs)
  const childrenByTab = new Map<string, CanvasComponent[]>()

  flatComponents.forEach(c => {
    const comp = componentMap.get(c.componentId || String(c.id))
    if (!comp) return

    if (c.parentComponentId) {
      const key = c.tabId
        ? `${c.parentComponentId}:${c.tabId}`
        : c.parentComponentId

      if (c.tabId) {
        const tabKey = `${c.parentComponentId}:${c.tabId}`
        if (!childrenByTab.has(tabKey)) {
          childrenByTab.set(tabKey, [])
        }
        childrenByTab.get(tabKey)!.push(comp)
      } else {
        if (!childrenByParent.has(c.parentComponentId)) {
          childrenByParent.set(c.parentComponentId, [])
        }
        childrenByParent.get(c.parentComponentId)!.push(comp)
      }
    } else {
      rootComponents.push(comp)
    }
  })

  // Assign children to components
  componentMap.forEach((comp) => {
    if (comp.type === 'tabs') {
      const allTabChildren: CanvasComponent[] = []
      childrenByTab.forEach((children) => {
        allTabChildren.push(...children)
      })
      comp.children = allTabChildren
    } else {
      const parentKey = comp.componentId || String(comp.id)
      comp.children = childrenByParent.get(parentKey) || []
    }
  })

  return rootComponents
}

/**
 * Flatten component tree for saving (fully flat with parentComponentId + tabId)
 */
export function flattenComponentsWithParentId(comps: CanvasComponent[], parentComponentId: string | null = null, tabId: string | null = null): any[] {
  const result: any[] = []
  for (const c of comps) {
    const { children, props, ...rest } = c

    // Clean props: remove childrenMap
    const cleanProps = { ...props }
    delete cleanProps.childrenMap
    delete cleanProps.children

    // For tabs, remove children from tab items
    if (cleanProps.tabs) {
      cleanProps.tabs = (cleanProps.tabs as TabItem[]).map(({ children, ...tabRest }) => tabRest)
    }

    const item: any = {
      ...rest,
      componentId: c.componentId,
      parentComponentId: parentComponentId || undefined,
      tabId: tabId || undefined,
      props: cleanProps
    }

    // Ensure tabs have activeTab as string
    if (item.type === 'tabs' && item.props?.tabs) {
      const rawActiveTab = item.props.activeTab
      if (typeof rawActiveTab === 'number') {
        item.props.activeTab = `tab_${rawActiveTab}`
      } else if (!rawActiveTab) {
        item.props.activeTab = 'tab_0'
      }
    }

    result.push(item)

    // Recursively flatten children
    if (children && children.length > 0) {
      children.forEach((child: CanvasComponent) => {
        const childTabId = c.type === 'tabs' ? (child.tabId || null) : null
        result.push(...flattenComponentsWithParentId(
          [child],
          c.componentId || String(c.id),
          childTabId
        ))
      })
    }
  }
  return result
}

/**
 * Legacy function for compatibility
 */
export function flattenComponents(comps: CanvasComponent[]): CanvasComponent[] {
  return flattenComponentsWithParentId(comps)
}

/**
 * Update component recursively
 */
export function updateComponentInTree(
  components: CanvasComponent[],
  id: string,
  updater: (c: CanvasComponent) => CanvasComponent
): CanvasComponent[] {
  return components.map(c => {
    const matchId = c.id === id || c.componentId === id
    if (matchId) {
      return updater(c)
    }
    if (c.children && c.children.length > 0) {
      return { ...c, children: updateComponentInTree(c.children, id, updater) }
    }
    return c
  })
}

/**
 * Remove component recursively
 */
export function removeComponentFromTree(components: CanvasComponent[], id: string): CanvasComponent[] {
  return components.flatMap(c => {
    const matchId = c.id === id || c.componentId === id
    if (matchId) return []
    if (c.children && c.children.length > 0) {
      return [{ ...c, children: removeComponentFromTree(c.children, id) }]
    }
    return [c]
  })
}

/**
 * Update component props recursively
 */
export function updateComponentProps(components: CanvasComponent[], id: string, newProps: Record<string, any>): CanvasComponent[] {
  return components.map(c => {
    const matchId = c.id === id || c.componentId === id
    if (matchId) {
      return { ...c, props: { ...c.props, ...newProps } }
    }
    if (c.children && c.children.length > 0) {
      return { ...c, children: updateComponentProps(c.children, id, newProps) }
    }
    return c
  })
}

/**
 * Generate a unique ID based on timestamp
 */
export function generateId(): number {
  return Date.now()
}

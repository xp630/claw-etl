# claw-etl Vue页面编辑器迁移方案

**项目**：claw-etl 低代码平台
**任务**：v1.1 - 页面编辑器迁移（架构分析与方案设计）
**作者**：Architect
**日期**：2026-03-28
**状态**：方案设计

---

## 一、背景与目标

### 1.1 背景

- claw-etl 低代码平台正在进行 Vue 框架改造
- 现有 React 页面编辑器需要迁移到 Vue 版本
- React 代码位置：`/Users/xp630/work/workspace/openclaw/claw-etl/src/pages/editor/`
- Vue 参考实现：`/Users/xp630/work/workspace/openclaw/lowcode-platform/code/src/components/editor/`

### 1.2 目标

1. 将 React 编辑器迁移到 Vue 3 + Composition API
2. 保持功能一致，优化架构设计
3. 提升代码可维护性和扩展性

---

## 二、现有 React 编辑器架构分析

### 2.1 组件结构

| 组件 | 文件 | 职责 |
|------|------|------|
| PageEditor | index.tsx | 主容器，状态管理，协调各组件 |
| ComponentPanel | ComponentPanel.tsx | 组件面板，提供可拖拽组件 |
| DropCanvas | DropCanvas.tsx | 画布，接收拖拽，显示组件列表 |
| ComponentTree | ComponentTree.tsx | 组件层级树状结构 |
| PropertyPanel | PropertyPanel.tsx | 属性配置面板（65KB，最大最复杂） |
| ComponentRenderer | ComponentRenderer.tsx | 组件渲染器 |
| ContainerRenderer | ContainerRenderer.tsx | 容器组件渲染（tabs/card/collapse） |

### 2.2 数据模型

```typescript
interface CanvasComponent {
  id: string;           // 唯一标识
  componentId?: string;  // 组件类型标识
  parentId?: string;    // 父组件ID（树形结构）
  type: string;         // 组件类型
  label: string;        // 组件标签
  props: Record<string, unknown>;  // 组件属性
  children?: CanvasComponent[];  // 子组件
}
```

### 2.3 现有问题

1. **状态管理分散**：所有状态在 PageEditor 组件中通过 useState 管理，组件间通过 props 层层传递
2. **代码耦合严重**：PropertyPanel 65KB，职责过重，包含大量业务逻辑
3. **树形结构复杂**：parentId + childrenMap 双轨存储，增加复杂度
4. **缺少状态管理库**：没有使用 Redux/Zustand 等状态管理库

---

## 三、Vue 版本技术架构设计

### 3.1 技术选型

| 类别 | 推荐方案 | 理由 |
|------|---------|------|
| 框架 | Vue 3.4+ | 最新稳定版，Composition API |
| 语言 | TypeScript 5.x | 类型安全 |
| 状态管理 | **Pinia** | Vue 官方推荐，轻量且支持 DevTools |
| 拖拽 | **@dnd-kit** | Vue 版本（@dnd-kit/core + @dnd-kit/sortable） |
| 路由 | Vue Router 4 | SPA 标准 |
| 构建 | Vite 5 | 快速 HMR，与 Vue 生态完美集成 |

### 3.2 Pinia Store 设计

```typescript
// stores/editor.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CanvasComponent {
  id: string
  componentId?: string
  parentId?: string
  type: string
  label: string
  props: Record<string, unknown>
  children?: CanvasComponent[]
}

export const useEditorStore = defineStore('editor', () => {
  // State
  const pageTitle = ref('未命名页面')
  const pageId = ref<number | null>(null)
  const pageCode = ref('')
  const selectedId = ref<string | null>(null)
  const components = ref<CanvasComponent[]>([])
  const isDirty = ref(false)

  // Getters
  const selectedComponent = computed(() => 
    findComponent(components.value, selectedId.value)
  )
  
  const rootComponents = computed(() => 
    components.value.filter(c => !c.parentId)
  )

  // Actions
  function addComponent(comp: Omit<CanvasComponent, 'id'>) {
    const newComp = { ...comp, id: generateId() }
    components.value.push(newComp)
    selectedId.value = newComp.id
    isDirty.value = true
    return newComp
  }

  function updateComponent(id: string, updates: Partial<CanvasComponent>) {
    updateComponentInTree(components.value, id, updates)
    isDirty.value = true
  }

  function removeComponent(id: string) {
    removeComponentFromTree(components.value, id)
    if (selectedId.value === id) selectedId.value = null
    isDirty.value = true
  }

  function selectComponent(id: string | null) {
    selectedId.value = id
  }

  function setPageConfig(config: { id?: number, name?: string, code?: string }) {
    if (config.id) pageId.value = config.id
    if (config.name) pageTitle.value = config.name
    if (config.code) pageCode.value = config.code
  }

  function loadComponents(comps: CanvasComponent[]) {
    components.value = comps
    isDirty.value = false
  }

  function $reset() {
    pageTitle.value = '未命名页面'
    pageId.value = null
    pageCode.value = ''
    selectedId.value = null
    components.value = []
    isDirty.value = false
  }

  return {
    // State
    pageTitle, pageId, pageCode, selectedId, components, isDirty,
    // Getters
    selectedComponent, rootComponents,
    // Actions
    addComponent, updateComponent, removeComponent, selectComponent,
    setPageConfig, loadComponents, $reset
  }
})
```

### 3.3 组件结构设计

```
src/pages/editor/
├── index.vue              # 主容器（App.vue 风格）
├── components/
│   ├── ComponentPanel.vue    # 组件面板
│   ├── ComponentTree.vue     # 组件层级树
│   ├── DropCanvas.vue       # 拖拽画布
│   ├── PropertyPanel.vue    # 属性配置面板
│   ├── ComponentRenderer.vue # 组件渲染器
│   └── ContainerRenderer.vue # 容器组件渲染
├── composables/
│   ├── useDragDrop.ts       # 拖拽逻辑
│   ├── useComponentTree.ts  # 树形结构操作
│   └── useAutoSave.ts       # 自动保存
├── stores/
│   └── editor.ts           # Pinia Store
└── types/
    └── editor.ts           # 类型定义
```

### 3.4 数据流设计

```
┌─────────────────────────────────────────────────────────┐
│                    Pinia Store                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ pageTitle   │  │ selectedId   │  │ components  │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▲                ▲                 ▲
         │                │                 │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │ Header   │    │ Canvas  │    │Property  │
    │          │    │ Tree    │    │ Panel    │
    └──────────┘    └─────────┘    └──────────┘
```

### 3.5 拖拽实现方案

```typescript
// composables/useDragDrop.ts
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'

export function useEditorDragDrop() {
  // 组件面板拖出
  function usePaletteDrag(item: ComponentItem) {
    return {
      onDragStart: (e: DragEvent) => {
        e.dataTransfer?.setData('application/json', JSON.stringify({
          type: item.type,
          label: item.label,
          fromPalette: true,
          defaultProps: item.defaultProps
        }))
      }
    }
  }

  // 画布内排序
  function useCanvasSortable(id: string) {
    return useSortable({ id })
  }

  // 画布放置区
  function useCanvasDropZone() {
    return useDroppable({ id: 'canvas' })
  }

  return { usePaletteDrag, useCanvasSortable, useCanvasDropZone }
}
```

---

## 四、迁移顺序与依赖关系

### 4.1 迁移阶段

| 阶段 | 任务 | 依赖 | 预计工时 |
|------|------|------|---------|
| **Phase 1** | Pinia Store 搭建 | 无 | 2h |
| **Phase 2** | 类型定义迁移 | Phase 1 | 1h |
| **Phase 3** | ComponentRenderer 迁移 | Phase 1 | 3h |
| **Phase 4** | ComponentPanel 迁移 | Phase 1, 2 | 2h |
| **Phase 5** | DropCanvas 迁移 | Phase 1, 2, 3 | 4h |
| **Phase 6** | PropertyPanel 迁移 | Phase 3 | 6h |
| **Phase 7** | ComponentTree 迁移 | Phase 1, 2 | 2h |
| **Phase 8** | 主容器整合 | Phase 4, 5, 6, 7 | 3h |
| **Phase 9** | 路由和页面入口 | Phase 8 | 1h |
| **Phase 10** | 联调测试 | Phase 9 | 4h |

**总预计工时**：约 28 小时（4 人天）

### 4.2 关键里程碑

- **Day 1**：Phase 1-3 完成，核心渲染通路跑通
- **Day 2**：Phase 4-6 完成，主要 UI 组件完成
- **Day 3**：Phase 7-9 完成，完整页面集成
- **Day 4**：Phase 10 完成，测试上线

---

## 五、与 Vue 参考实现的差异处理

### 5.1 树形 vs 扁平结构

**参考实现（Vue）**：扁平数组，无 parentId
```typescript
canvasComponents: CanvasComponent[]  // 扁平数组
```

**当前实现（React）**：parentId + childrenMap 双轨
```typescript
components: CanvasComponent[]  // 有 parentId
childrenMap: Record<string, string[]>  // tabs 容器专用
```

**迁移策略**：
- 保持 parentId 方式，与现有后端 API 兼容
- childrenMap 作为 children 的别名，优化容器组件处理
- 提供 `flattenComponents()` 和 `buildComponentTree()` 转换函数

### 5.2 容器组件支持

**参考实现**：仅支持扁平列表，无容器嵌套

**当前实现**：支持 tabs/card/collapse 容器嵌套

**迁移策略**：
- 保留现有容器组件逻辑
- 扩展 ComponentRenderer 支持容器渲染
- 提供容器组件的子组件管理界面

### 5.3 组件渲染器差异

**参考实现**：内联 h() 函数渲染
```typescript
const ComponentRenderer = {
  setup(props) {
    return () => {
      switch(type) {
        case 'text': return h('div', ...)
        // 内联所有组件类型
      }
    }
  }
}
```

**当前实现**：独立组件文件 + switch 分发

**迁移策略**：
- Vue 中使用 `<component :is="componentMap[type]">` 动态组件
- 组件映射表注册所有支持的组件类型
- 支持异步组件加载（代码分割）

---

## 六、验收标准

1. **功能完整**：所有 React 版本功能在 Vue 版本中可用
2. **数据兼容**：现有页面配置可正确加载和保存
3. **性能达标**：首屏加载 < 2s，操作响应 < 100ms
4. **代码质量**：TypeScript 类型覆盖率 > 90%，ESLint 0 错误

---

## 七、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 拖拽库选择 | dnd-kit Vue 版本资料少 | 改用 VueDraggable（vue.draggable.next）或 SortableJS |
| 状态管理复杂度 | 容器嵌套状态同步困难 | 使用 Pinia plugin 管理 childrenMap |
| 后端 API 兼容 | parentId 格式变更 | 迁移后立即联调测试 |

---

## 八、建议

1. **采用 VueDraggable** 替代 @dnd-kit（生态更成熟，文档更完善）
2. **PropertyPanel 拆分**：拆分为基础配置、样式配置、事件配置三个 Tab
3. **组件注册表**：建立组件类型注册机制，便于扩展

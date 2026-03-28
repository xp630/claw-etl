# claw-etl Vue页面编辑器迁移技术方案

**项目**：claw-etl 低代码平台
**任务**：v1.1 - 页面编辑器迁移
**作者**：Architect
**日期**：2026-03-28
**状态**：进行中

---

## 一、现状分析

### 1.1 React 版本架构（claw-etl）

**文件结构**：
```
src/pages/editor/
├── index.tsx              # 主页面组件，状态管理
├── ComponentPanel.tsx     # 左侧组件面板
├── ComponentTree.tsx      # 组件层级树
├── DropCanvas.tsx         # 拖拽画布
├── PropertyPanel.tsx      # 属性配置面板（65KB，较大）
├── ComponentRenderer.tsx  # 组件渲染器
├── ContainerRenderer.tsx  # 容器组件渲染器
├── FormRenderer.tsx       # 表单渲染器
├── types.ts               # 类型定义
└── constants.ts           # 常量定义
```

**技术栈**：
- React 19 + TypeScript
- 原生拖拽 API（dataTransfer）
- 状态管理：React useState + useCallback
- UI：无 UI 框架，原生 CSS 变量

**核心数据结构**：
```typescript
interface CanvasComponent {
  id: string;
  componentId?: string;
  parentId?: string;         // 父子关系
  type: string;
  label: string;
  props: Record<string, unknown>;
  children?: CanvasComponent[];  // 嵌套子组件
}
```

**组件类型**：
- 基础组件：text, button, image, link, input, select, date, switch, slider
- 数据组件：table, lineChart, barChart, pieChart
- 布局组件：grid, divider, blank
- 容器组件：card, collapse, tabs（支持嵌套 childrenMap）

---

### 1.2 Vue 版本参考（lowcode-platform）

**文件结构**：
```
code/src/components/editor/
├── ComponentPanel.vue   # 组件面板（4.2KB）
├── DropCanvas.vue       # 拖拽画布（7.5KB）
└── PropertyPanel.vue    # 属性面板（8.3KB）
```

**技术栈**：
- Vue 3 + Composition API + TypeScript
- @dnd-kit 拖拽库
- Pinia 状态管理
- Element Plus UI

**核心特点**：
- 使用 `useEditorStore`（Pinia）管理状态
- 扁平化组件列表（无 children 嵌套）
- 内联 ComponentRenderer（render function）

---

## 二、架构差异对比

| 维度 | React 版本 | Vue 参考版本 |
|------|-----------|-------------|
| 状态管理 | useState/useCallback | Pinia store |
| 拖拽实现 | 原生 dataTransfer | @dnd-kit |
| 组件结构 | 嵌套 children 树形 | 扁平列表 + parentId |
| 容器支持 | childrenMap（tabs/card/collapse） | 仅基础组件 |
| UI 框架 | 无（原生 CSS） | Element Plus |
| 组件渲染 | 独立 ComponentRenderer | 内联 render function |

---

## 三、迁移方案设计

### 3.1 技术选型

| 模块 | 推荐方案 | 备选 |
|------|---------|------|
| 框架 | Vue 3 + Composition API | - |
| 状态管理 | **Pinia**（与参考一致） | Vuex |
| 拖拽库 | **@dnd-kit**（与参考一致） | vue-draggable-plus |
| UI 组件库 | **Element Plus**（与参考一致） | Ant Design Vue |
| 构建工具 | Vite | - |
| 类型 | TypeScript | - |

### 3.2 目录结构设计

```
src/
├── pages/
│   └── editor/
│       ├── index.vue                 # 主页面
│       ├── components/
│       │   ├── ComponentPanel.vue   # 组件面板
│       │   ├── ComponentTree.vue    # 组件层级树
│       │   ├── DropCanvas.vue       # 拖拽画布
│       │   ├── PropertyPanel.vue    # 属性配置面板
│       │   ├── ComponentRenderer.vue # 组件渲染器
│       │   └── ContainerRenderer.vue # 容器组件渲染器
│       ├── stores/
│       │   └── editor.ts            # Pinia store
│       ├── types/
│       │   └── editor.ts             # 类型定义
│       ├── utils/
│       │   └── componentMap.ts      # 组件类型映射
│       └── styles/
│           └── editor.css           # 编辑器样式
```

### 3.3 数据流设计

**状态管理（Pinia Store）**：
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
}

export const useEditorStore = defineStore('editor', () => {
  // State
  const components = ref<CanvasComponent[]>([])
  const selectedId = ref<string | null>(null)
  const pageName = ref('未命名页面')
  const pageCode = ref('')
  const pageId = ref<number | null>(null)

  // Getters
  const selectedComponent = computed(() =>
    components.value.find(c => c.id === selectedId.value) || null
  )
  
  // Actions
  function addComponent(type: string, label: string, defaultProps: Record<string, unknown>) {
    components.value.push({
      id: `comp_${Date.now()}`,
      type,
      label,
      props: defaultProps
    })
  }
  
  function removeComponent(id: string) {
    components.value = components.value.filter(c => c.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }
  
  function updateComponentProps(id: string, props: Record<string, unknown>) {
    const comp = components.value.find(c => c.id === id)
    if (comp) {
      comp.props = { ...comp.props, ...props }
    }
  }
  
  function selectComponent(id: string | null) {
    selectedId.value = id
  }
  
  // ... 更多 action
  
  return {
    components,
    selectedId,
    selectedComponent,
    addComponent,
    removeComponent,
    updateComponentProps,
    selectComponent,
    // ...
  }
})
```

### 3.4 组件解耦方案

**问题**：React 版本中 PropertyPanel.tsx 过大（65KB），包含大量组件特定配置逻辑。

**Vue 重构策略**：
1. **拆分 PropertyPanel.vue**：
   - `PropertyPanel.vue` - 基础框架
   - `props/TextProps.vue` - 文本属性
   - `props/ButtonProps.vue` - 按钮属性
   - `props/FormProps.vue` - 表单属性
   - `props/ChartProps.vue` - 图表属性
   - `props/ContainerProps.vue` - 容器属性

2. **组件映射表**：
```typescript
// utils/propComponents.ts
export const propComponentMap: Record<string, Component> = {
  text: TextProps,
  button: ButtonProps,
  input: FormProps,
  select: FormProps,
  table: TableProps,
  lineChart: ChartProps,
  barChart: ChartProps,
  pieChart: ChartProps,
  card: ContainerProps,
  tabs: ContainerProps,
  collapse: ContainerProps,
}
```

### 3.5 容器组件嵌套方案

**问题**：React 版本支持 tabs/card/collapse 容器的 childrenMap 嵌套，Vue 参考版本是扁平的。

**迁移策略**：
1. **保持 children 树形结构**（与 React 一致）
2. **childrenMap 保留用于 tabs 容器**：
```typescript
interface CanvasComponent {
  id: string
  type: string
  props: Record<string, unknown>
  children?: CanvasComponent[]
  // tabs/card/collapse 容器专用
  childrenMap?: Record<string, string[]>  // tabKey -> childIds
}
```
3. **渲染时解析 childrenMap**：
```vue
<!-- TabsRenderer.vue -->
<template>
  <el-tabs v-model="activeTab">
    <el-tab-pane
      v-for="(childIds, tabKey) in component.props.childrenMap"
      :key="tabKey"
      :label="tabKey"
    >
      <component
        v-for="childId in childIds"
        :key="childId"
        :is="getComponentById(childId)"
      />
    </el-tab-pane>
  </el-tabs>
</template>
```

---

## 四、迁移顺序与依赖

### 4.1 阶段划分

| 阶段 | 任务 | 依赖 | 工时 |
|------|------|------|------|
| **Phase 1** | 项目基础搭建 | - | 1h |
| | 初始化 Vue 3 + Vite 项目 | - | - |
| | 安装依赖（Pinia, @dnd-kit, Element Plus） | - | - |
| | 配置 TypeScript 和路径别名 | - | - |
| | **Pinia Store 基础架构** | - | - |
| **Phase 2** | 基础组件迁移 | Phase 1 | 4h |
| | ComponentPanel.vue | Store 完成后 | - |
| | DropCanvas.vue（基础拖拽） | Store 完成后 | - |
| | ComponentRenderer.vue（基础渲染） | Panel + Canvas | - |
| **Phase 3** | 属性面板重构 | Phase 2 | 3h |
| | PropertyPanel.vue 基础框架 | Renderer 完成后 | - |
| | 拆分各组件属性面板 | 基础框架 | - |
| **Phase 4** | 高级功能 | Phase 3 | 4h |
| | 容器组件（card/collapse/tabs） | 基础组件 | - |
| | 组件嵌套与 childrenMap | 容器组件 | - |
| **Phase 5** | 集成与调试 | Phase 4 | 3h |
| | 与现有系统集成 | - | - |
| | 后端 API 对接 | - | - |
| | 页面保存/加载 | - | - |
| **Phase 6** | 测试与优化 | Phase 5 | 2h |
| | 完整流程测试 | - | - |
| | 性能优化 | - | - |

**预计总工时**：约 17 小时（3 人天）

### 4.2 关键依赖路径

```
Pinia Store → ComponentPanel → DropCanvas → ComponentRenderer
                                            ↓
PropertyPanel → (拆分) → TextProps/ButtonProps/FormProps...
                                            ↓
ContainerRenderer ← (容器组件嵌套)
```

---

## 五、关键技术点

### 5.1 拖拽实现（@dnd-kit）

**参考 lowcode-platform 的实现**：
```typescript
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 拖拽组件
const { attributes, listeners, setNodeRef, transform } = useSortable({
  id: component.id,
})

const style = transform ? {
  transform: CSS.Transform.toString(transform),
} : undefined
```

### 5.2 组件渲染（策略模式）

```typescript
// ComponentRenderer.vue
<script setup lang="ts">
import { computed } from 'vue'
import TextRenderer from './renderers/TextRenderer.vue'
import ButtonRenderer from './renderers/ButtonRenderer.vue'
import InputRenderer from './renderers/InputRenderer.vue'
// ... 其他渲染器

const rendererMap = {
  text: TextRenderer,
  button: ButtonRenderer,
  input: InputRenderer,
  // ...
}

const currentRenderer = computed(() =>
  rendererMap[props.component.type] || null
)
</script>

<template>
  <component :is="currentRenderer" v-if="currentRenderer" :component="component" />
  <div v-else>未知组件: {{ component.type }}</div>
</template>
```

### 5.3 属性更新（双向绑定）

```typescript
// PropertyPanel.vue
const updateProp = (key: string, value: any) => {
  if (selectedComponent.value) {
    store.updateComponentProps(selectedComponent.value.id, { [key]: value })
  }
}
```

---

## 六、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| React 嵌套结构迁移复杂 | childrenMap 可能丢失 | 分阶段测试，每阶段验证数据完整性 |
| PropertyPanel 逻辑复杂 | 65KB 代码难以一次性迁移 | 拆分 + 渐进式迁移 |
| 拖拽交互不一致 | 用户体验差异 | 保留原有交互模式，仅换技术栈 |
| Element Plus 样式冲突 | 与现有系统样式冲突 | 使用 CSS 变量隔离 + scoped |

---

## 七、验收标准

1. **功能完整性**：所有 React 版本的组件类型都能在 Vue 版本渲染
2. **拖拽交互**：组件拖入、排序、嵌套与 React 版本行为一致
3. **属性配置**：所有组件的属性编辑功能正常
4. **数据持久化**：页面保存/加载与后端 API 正常对接
5. **性能**：首屏加载 < 2s，拖拽操作流畅（60fps）

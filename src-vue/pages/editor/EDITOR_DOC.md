# 页面编辑器功能文档

## 一、整体架构

### 1.1 组件结构

```
EditorPage.vue          # 主页面，包含所有状态管理
├── ComponentPanel.vue  # 左侧组件库面板（拖拽组件到画布）
├── DropCanvas.vue      # 画布区域（放置、拖拽、嵌套组件）
├── ComponentTree.vue   # 左侧层级树视图
└── PropertyPanel.vue   # 右侧属性配置面板
```

### 1.2 核心数据类型

```typescript
interface CanvasComponent {
  id: string                    // 唯一标识
  componentId?: string          // 组件类型ID
  parentId?: string             // 父组件ID（用于扁平数据存储）
  type: string                  // 组件类型：text, button, card, tabs, collapse 等
  label: string                 // 组件显示名称
  props: Record<string, any>   // 组件属性
  children?: CanvasComponent[]   // 子组件（嵌套用）
}
```

### 1.3 容器组件类型

- `card` - 卡片容器
- `tabs` - 标签页容器（有 childrenMap 管理每个 tab 的子组件）
- `collapse` - 折叠面板容器

---

## 二、已实现功能

### 2.1 拖拽组件到画布

**功能描述**：从左侧组件面板拖拽组件到画布，画布上松开后组件被添加。

**实现逻辑**：

1. **ComponentPanel.vue** - `onDragStart` 事件
   ```typescript
   // 设置 dataTransfer 数据
   event.dataTransfer.setData('application/json', JSON.stringify({
     fromPalette: true,
     type: comp.type,
     label: comp.label,
     defaultProps: comp.defaultProps || {},
   }))
   ```

2. **DropCanvas.vue** - `onDrop` 事件
   ```typescript
   const data = e.dataTransfer?.getData('application/json')
   // 解析数据后 emit('drop', parsed) 向上传递
   ```

3. **EditorPage.vue** - `handleDrop` 处理
   ```typescript
   function handleDrop(data: { fromPalette: boolean, type?: string, ... } | null) {
     if (data && data.fromPalette) {
       const newComponent: CanvasComponent = { id: generateId(), type: data.type, ... }
       components.value = [...components.value, newComponent]
     }
   }
   ```

**代码改动**：无（已正常工作）

---

### 2.2 组件属性编辑

**功能描述**：选中画布上的组件，弹出属性面板，可编辑组件的各种属性。

**实现逻辑**：

1. **DropCanvas.vue** - 组件点击时
   ```typescript
   emit('select', comp.id)  // 触发选中
   ```

2. **EditorPage.vue** - `selectedComponent` 计算属性
   ```typescript
   const selectedComponent = computed(() => findComponent(components.value, selectedId.value))
   ```

3. **PropertyPanel.vue** - 属性编辑
   - 通过 `hasProp('xxx')` 检查组件是否有某属性
   - 修改时调用 `updateProp(key, value)` → emit `update-props`
   - EditorPage 接收后调用 `updateComponentProps` 更新

**代码改动**：无（已正常工作）

---

### 2.3 组件删除

**功能描述**：删除画布上的组件。

**实现逻辑**：

1. **DropCanvas.vue** - 删除按钮点击
   ```typescript
   emit('delete', comp.id)
   ```

2. **EditorPage.vue** - `handleDelete`
   ```typescript
   function handleDelete(id: string) {
     components.value = removeComponentFromTree(components.value, id)
     if (selectedId.value === id) {
       selectedId.value = null
     }
   }
   ```

3. **PropertyPanel.vue** - 也可删除组件
   ```html
   <button class="prop-button prop-button--danger" @click="handleDeleteComponent">
     删除组件
   </button>
   ```
   ```typescript
   function handleDeleteComponent() {
     if (props.selectedComponent) {
       emit('delete-component', props.selectedComponent.id)
     }
   }
   ```

**代码改动**：无（已正常工作）

---

### 2.4 组件排序（上移/下移）

**功能描述**：根层级组件可以上下移动排序。

**实现逻辑**：

1. **DropCanvas.vue** - 上下移按钮
   ```typescript
   emit('reorder', fromIndex, toIndex)
   ```

2. **EditorPage.vue** - `handleReorder`
   ```typescript
   function handleReorder(fromIndex: number, toIndex: number) {
     const newComponents = [...components.value]
     const [removed] = newComponents.splice(fromIndex, 1)
     newComponents.splice(toIndex, 0, removed)
     components.value = newComponents
   }
   ```

**代码改动**：无（已正常工作）

---

### 2.5 保存页面配置

**功能描述**：将画布上的组件配置保存到后端。

**实现逻辑**：

1. `flattenComponentsWithParentId` - 将树形结构转为扁平数组（带 parentId）
2. 调用 `/page/save` API 保存
3. 保存成功后跳转到列表页

**代码改动**：无（已正常工作）

---

### 2.6 加载页面配置

**功能描述**：编辑已存在的页面时，从后端加载配置并还原组件树。

**实现逻辑**：

1. 调用 `/pageConfig/detail` 获取数据
2. `buildComponentTree` - 将扁平数组还原为树形结构
3. 处理 `childrenMap` 解析（tabs 容器的特殊处理）

**代码改动**：无（已正常工作）

---

## 三、未实现/有问题的功能

### 3.1 移动到容器（待修复）

**功能描述**：将根层级组件移动到容器（card/tabs/collapse）内。

**现状**：代码已写，但可能有问题。

**EditorPage.vue 中的实现**：

```typescript
function handleMoveToContainer(containerId: string, componentId: string, tabIndex?: number) {
  const comp = findComponent(components.value, componentId)
  if (!comp) return
  
  // 1. 如果组件已在某个容器中，先移除
  const parentId = findParentContainerId(components.value, componentId)
  if (parentId) {
    handleRemoveChildFromContainer(parentId, componentId)
  } else {
    components.value = components.value.filter(c => c.id !== componentId)
  }
  
  // 2. 添加到目标容器
  handleAddChildToContainer(containerId, comp, tabIndex)
}
```

**PropertyPanel.vue 中的调用**：

```typescript
function handleMoveToContainerAction(e: Event) {
  const containerId = (e.target as HTMLSelectElement).value
  if (containerId && props.selectedComponent) {
    emit('move-to-container', containerId, props.selectedComponent.id)
    ;(e.target as HTMLSelectElement).value = ''
  }
}
```

**可能的问题**：
- `findComponent` 在组件从根移除后可能找不到
- 需要确认 `handleAddChildToContainer` 是否正确处理

**建议修复方案**：

```typescript
function handleMoveToContainer(containerId: string, componentId: string, tabIndex?: number) {
  // 1. 先找到组件的副本
  const comp = findComponent(components.value, componentId)
  if (!comp) return
  
  // 2. 从当前位置移除（根层级或原有容器）
  const parentId = findParentContainerId(components.value, componentId)
  if (parentId) {
    // 从原有容器移除（会更新 components.value）
    handleRemoveChildFromContainer(parentId, componentId)
  } else {
    // 从根层级移除
    components.value = components.value.filter(c => c.id !== componentId)
  }
  
  // 3. 添加到目标容器（使用 setTimeout 确保状态更新）
  setTimeout(() => {
    handleAddChildToContainer(containerId, comp, tabIndex)
  }, 0)
}
```

---

### 3.2 从容器移出到根层级（待修复）

**功能描述**：将容器内的组件移出到根层级。

**现状**：代码已写。

**EditorPage.vue 中的实现**：

```typescript
function handleMoveChildToRoot(fromContainerId: string, childId: string, insertIndex: number) {
  // 1. 从容器中提取子组件
  // 2. 添加到根层级的 components.value
  // 3. 更新 selectedId
}
```

**PropertyPanel.vue 中的调用**：

```typescript
function handleMoveOutOfContainer() {
  if (props.selectedComponent && parentContainerId.value) {
    emit('move-out-of-container', parentContainerId.value, props.selectedComponent.id)
  }
}
```

**可能的问题**：`handleMoveChildToRoot` 的逻辑复杂，可能有边界情况未处理。

---

### 3.3 childrenMap 渲染（待确认）

**功能描述**：tabs 组件的 `childrenMap` 控制每个 tab 显示哪些子组件。

**现状**：代码在 EditorPage.vue 第 256-261 行有处理，但可能有问题。

```typescript
const getContainerChildren = (comp: CanvasComponent): CanvasComponent[] => {
  if (comp.type === 'tabs') {
    const childrenMap = comp.props.childrenMap as Record<string, string[]> | undefined
    if (childrenMap) {
      const tabIndex = String(comp.props?.activeTab || 0)
      const childIds = childrenMap[tabIndex] || []
      return (comp.children || []).filter(c => childIds.includes(c.id))
    }
    return comp.children || []
  }
  return comp.children || []
}
```

**需要确认**：
1. `childrenMap` 的数据结构是否正确
2. `activeTab` 属性是否被正确维护

---

## 四、待添加功能

### 4.1 组件层级树（ComponentTree）

**功能描述**：左侧面板的"组件层"标签页，显示组件层级树。

**现状**：组件已存在，但功能可能不完整。

**需要实现**：
- 显示所有组件的树形结构
- 点击节点选中对应组件
- 支持拖拽排序

---

### 4.2 组件预览

**功能描述**：保存后点击"预览"按钮，在新窗口打开页面渲染结果。

**现状**：已有 `handlePreview` 函数，但需要确认渲染页面是否实现。

```typescript
function handlePreview() {
  if (isNewPage.value || !pageCode.value) {
    ElMessage.info('请先保存页面后再预览')
    return
  }
  window.open(`/#/render/${pageCode.value}`, '_blank')
}
```

---

### 4.3 快捷键支持

**功能描述**：键盘快捷键操作。

**现状**：已有 `handleKeyDown`，支持 Delete 删除、Escape 关闭弹窗。

**待添加**：
- Ctrl+S 保存
- Ctrl+Z 撤销（需要 undo 历史记录）
- 方向键调整位置

---

## 五、PropertyPanel 事件规范

```typescript
// PropertyPanel 向上传递的事件
const emit = defineEmits<{
  'update-props': [props: Record<string, unknown>]           // 更新属性
  'update-label': [label: string]                            // 更新标签
  'move-to-container': [containerId: string, componentId: string]  // 移动到容器
  'move-out-of-container': [containerId: string, componentId: string] // 从容器移出
  'delete-component': [id: string]                           // 删除组件
  'select-component': [id: string | null]                   // 选中组件
}>()
```

## 六、EditorPage 事件处理函数签名

```typescript
// DropCanvas 传来的事件
handleSelectComponent(id: string)                           // 选中组件
handleReorder(fromIndex: number, toIndex: number)           // 排序
handleDelete(id: string)                                    // 删除
handleDrop(data: {...} | null)                              // 拖放完成
handleAddChildToContainer(containerId: string, child: CanvasComponent, tabIndex?: number)
handleRemoveChildFromContainer(containerId: string, childId: string)
handleMoveChildToRoot(fromContainerId: string, childId: string, insertIndex: number)

// PropertyPanel 传来的事件（与上面共用）
handleMoveToContainer(containerId: string, componentId: string, tabIndex?: number)
handleMoveOutOfContainer(containerId: string, componentId: string)
```

---

## 七、修改记录

| 日期 | 修改内容 | 修改人 |
|------|----------|--------|
| 2026-03-29 | 移除 @drag-start="activeLeftTab = ''" 修复拖拽功能 | Architect |
| 2026-03-29 | PropertyPanel 添加容器操作功能（移动到容器、从容器移出、删除） | Architect |

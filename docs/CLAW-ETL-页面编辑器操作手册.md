# CLAW-ETL 页面编辑器操作手册

> 文档版本：1.0
> 更新日期：2026-03-27
> 适用版本：claw-etl v1.0

---

## 一、整体架构

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ 组件面板    │  │  画布      │  │ 属性面板    │      │
│  │ComponentPanel│  │DropCanvas │  │PropertyPanel│      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│         │                │                │               │
│         └────────────────┼────────────────┘               │
│                          ▼                                │
│                 ┌─────────────────┐                       │
│                 │   编辑器状态     │                       │
│                 │  (useEditor)    │                       │
│                 └─────────────────┘                       │
├─────────────────────────────────────────────────────────────┤
│                        后端 API                            │
│  /pageConfig/save  │  /pageConfig/detail  │  /pageConfig/list │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心模块

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| 编辑器入口 | `src/pages/editor/index.tsx` | 编辑器主页面，状态管理 |
| 组件面板 | `src/pages/editor/ComponentPanel.tsx` | 组件分类展示，拖拽起点 |
| 画布 | `src/pages/editor/DropCanvas.tsx` | 拖拽目标，组件渲染 |
| 组件渲染器 | `src/pages/editor/ComponentRenderer.tsx` | 根据类型渲染不同组件 |
| 容器渲染器 | `src/pages/editor/ContainerRenderer.tsx` | 容器组件特殊处理 |
| 属性面板 | `src/pages/editor/PropertyPanel.tsx` | 属性配置面板 |
| 组件树 | `src/pages/editor/ComponentTree.tsx` | 组件层级树状展示 |

### 1.3 技术栈

- **框架**：React 19 + TypeScript
- **布局**：react-grid-layout（画布布局）
- **图表**：ECharts
- **状态管理**：React hooks (useState, useCallback, useRef)
- **拖拽**：HTML5 Drag and Drop API
- **后端通信**：axios

---

## 二、数据结构

### 2.1 核心类型定义

**文件**：`src/pages/editor/types.ts`

```typescript
// 画布中的组件
interface CanvasComponent {
  id: string;              // 唯一标识（自动生成）
  componentId?: string;    // 组件类型标识
  parentId?: string;        // 父组件 ID（用于层级关系）
  type: string;            // 组件类型
  label: string;           // 组件标签
  props: Record<string, unknown>;  // 组件属性
  children?: CanvasComponent[];   // 子组件（容器组件使用）
}

// 组件目录项
interface ComponentItem {
  type: string;           // 组件类型标识
  label: string;         // 显示名称
  icon: string;           // 图标名称
  defaultProps?: Record<string, unknown>;  // 默认属性
}

// 组件分类
interface ComponentCategory {
  name: string;          // 分类名称
  components: ComponentItem[];  // 该分类下的组件
}
```

### 2.2 组件类型总览

**文件**：`src/pages/editor/constants.ts`

| 分类 | 组件类型 | 类型标识 | 说明 |
|------|----------|----------|------|
| 基础组件 | 文本 | `text` | 纯文本展示 |
| 基础组件 | 按钮 | `button` | 可点击按钮 |
| 基础组件 | 图片 | `image` | 图片展示 |
| 基础组件 | 链接 | `link` | 超链接 |
| 表单组件 | 输入框 | `input` | 单行文本输入 |
| 表单组件 | 下拉框 | `select` | 下拉选择 |
| 表单组件 | 日期选择 | `date` | 日期控件 |
| 表单组件 | 开关 | `switch` | 开关切换 |
| 表单组件 | 滑动条 | `slider` | 滑动数值选择 |
| 数据组件 | 表格 | `table` | 数据表格 |
| 数据组件 | 表单 | `form` | 数据表单 |
| 数据组件 | 折线图 | `lineChart` | 折线图表 |
| 数据组件 | 柱状图 | `barChart` | 柱状图表 |
| 数据组件 | 饼图 | `pieChart` | 饼状图表 |
| 布局组件 | 栅格 | `grid` | 响应式栅格布局 |
| 布局组件 | 分割线 | `divider` | 水平/垂直分割线 |
| 布局组件 | 空白 | `blank` | 占位空白区域 |
| **容器组件** | **卡片** | **`card`** | 带标题的卡片容器 |
| **容器组件** | **标签页** | **`tabs`** | 多标签页切换 |
| **容器组件** | **折叠面板** | **`collapse`** | 可折叠内容区 |

### 2.3 组件属性示例

```typescript
// 表格组件属性
{
  type: 'table',
  props: {
    apiId: number,           // 主API ID
    queryApiId: number,      // 查询API ID
    createApiId: number,     // 新增API ID
    updateApiId: number,     // 更新API ID
    deleteApiId: number,     // 删除API ID
    detailApiId: number,      // 详情API ID
    columns: ColumnConfig[],  // 列配置
    data: any[],             // 静态数据（Mock用）
    bordered: boolean,        // 显示边框
    striped: boolean,        // 斑马纹
    pagination: boolean,     // 分页
    pageSize: number,        // 每页条数
    showSearch: boolean,     // 显示搜索
    showAdd: boolean,        // 显示新增
    showExport: boolean,     // 显示导出
  }
}

// 卡片组件属性
{
  type: 'card',
  props: {
    title: string,          // 卡片标题
    bordered: boolean,        // 显示边框
    children?: CanvasComponent[],  // 子组件
  }
}

// 标签页组件属性
{
  type: 'tabs',
  props: {
    tabs: string[],         // 标签名称数组
    activeTab: number,      // 当前激活标签索引
    childrenMap: Record<string, string[]>,  // 每个tab下的子组件ID列表
  }
}
```

---

## 三、拖拽逻辑详解

### 3.1 拖拽类型

编辑器支持三种拖拽操作：

| 拖拽类型 | 描述 | 源位置 | 目标位置 |
|----------|------|--------|----------|
| **新增组件** | 从面板拖入画布 | ComponentPanel | DropCanvas |
| **排序** | 在画布内调整顺序 | DropCanvas (根级) | DropCanvas (根级) |
| **嵌套** | 移入/移出容器 | 画布内任意位置 | 容器组件内 |

### 3.2 新增组件拖拽

**流程**：

```
ComponentPanel ──DragStart──▶ DropCanvas ──DragOver──▶ onDrop
     │                            │
     │   dragType: 'new'          │
     │   sourceId: null          │
     ▼                            ▼
生成唯一ID                   根据drop位置判断:
                              - 落在根级 → 添加到根components
                              - 落在容器内 → 调用onAddChildToContainer
```

**关键代码逻辑**：

```typescript
// DropCanvas.tsx
const handleDrop = (e: React.DragEvent) => {
  const dragType = dragState.current.dragType;
  
  if (dragType === 'new') {
    // 新增组件
    const componentData = e.dataTransfer.getData('component');
    const newComponent = JSON.parse(componentData);
    newComponent.id = generateId(); // 生成唯一ID
    
    if (isContainerType(dropTargetType)) {
      // 添加到容器
      onAddChildToContainer(containerId, newComponent);
    } else {
      // 添加到根级
      onAddToRoot(newComponent);
    }
  }
};
```

### 3.3 画布内排序

**流程**：

```
从根级组件列表拖出 ──▶ 在组件之间移动 ──▶ onReorder(fromIndex, toIndex)
```

**排序逻辑**：

```typescript
// Flatten所有组件（包括嵌套的）用于排序追踪
const flattenComponents = (comps: CanvasComponent[]): Array<{
  comp: CanvasComponent,
  parentId: string | null,
  index: number
}> => {
  const result = [];
  comps.forEach((comp, index) => {
    result.push({ comp, parentId: null, index });
    if (comp.children) {
      result.push(...flattenComponents(comp.children, comp.id));
    }
  });
  return result;
};

// 排序时计算新的位置
const handleReorder = (fromIndex: number, toIndex: number) => {
  const flattened = flattenComponents(components);
  const [moved] = flattened.splice(fromIndex, 1);
  flattened.splice(toIndex, 0, moved);
  // 重建树结构
  rebuildTree(flattened);
};
```

### 3.4 嵌套操作（容器相关）

#### 3.4.1 添加到容器

**支持的容器组件**：
- `card` - 卡片
- `tabs` - 标签页
- `collapse` - 折叠面板

**tabs 的特殊处理**：
- `tabs` 组件使用 `childrenMap` 而非 `children` 存储子组件
- `childrenMap` 是一个对象，key 是 tab 索引，value 是该 tab 下的子组件 ID 数组

```typescript
// tabs 组件的 childrenMap 结构
{
  "0": ["comp_xxx1", "comp_xxx2"],  // 第一个标签页下的组件
  "1": ["comp_xxx3"],              // 第二个标签页下的组件
  "2": []                          // 第三个标签页（空）
}
```

**添加子组件到 tabs**：

```typescript
const handleAddChild = (tabIndex: string) => {
  // 1. 从 allComponents 中找到被拖入的组件
  const component = findComponentById(allComponents, dragComponentId);
  
  // 2. 更新 childrenMap
  const newChildrenMap = { ...childrenMap };
  newChildrenMap[tabIndex] = [
    ...(newChildrenMap[tabIndex] || []),
    component.id
  ];
  
  // 3. 如果组件原来在其他位置，先移除
  removeFromOriginalLocation(component.id);
  
  // 4. 更新组件props
  onUpdateProps({ childrenMap: newChildrenMap });
};
```

#### 3.4.2 从容器移除

**移出到根级**：

```typescript
const handleMoveChildToRoot = (containerId: string, childId: string, toIndex: number) => {
  // 1. 从容器的 childrenMap 中移除
  const container = findComponentById(components, containerId);
  const newChildrenMap = { ...container.props.childrenMap };
  for (const key in newChildrenMap) {
    newChildrenMap[key] = newChildrenMap[key].filter(id => id !== childId);
  }
  
  // 2. 更新容器props
  onUpdateProps(containerId, { childrenMap: newChildrenMap });
  
  // 3. 将组件添加到根级
  onMoveToRoot(childId, toIndex);
};
```

### 3.5 拖拽状态管理

**DragState 结构**：

```typescript
const dragState = useRef({
  dragType: 'new' | 'reorder' | 'nested',  // 拖拽类型
  sourceId: string | null,                  // 被拖拽组件ID
  sourceContainerId: string | null,         // 源容器ID（嵌套拖拽时）
  sourceIndex: number,                      // 源索引
});
```

---

## 四、容器组件特殊处理

### 4.1 容器组件判断

```typescript
const isContainerType = (type: string) => 
  type === 'card' || type === 'tabs' || type === 'collapse';
```

### 4.2 卡片（card）

**渲染逻辑**：

```typescript
// ComponentRenderer.tsx
if (type === 'card') {
  return (
    <Card 
      title={props.title} 
      bordered={props.bordered}
    >
      {/* children 直接从 component.children 获取 */}
      {component.children?.map(child => (
        <ComponentRenderer key={child.id} component={child} />
      ))}
    </Card>
  );
}
```

### 4.3 标签页（tabs）

**渲染逻辑**：

```typescript
if (type === 'tabs') {
  const tabIndex = String(props.activeTab || 0);
  const childrenMap = props.childrenMap as Record<string, string[]>;
  
  // 从 childrenMap 获取当前tab的子组件ID列表
  const childIds = childrenMap?.[tabIndex] || [];
  
  // 从 allComponents 中查找对应的组件
  const childComponents = childIds
    .map(id => findById(id))
    .filter(Boolean);
  
  return (
    <Tabs activeKey={tabIndex} onChange={...}>
      {props.tabs.map((tab, i) => (
        <Tabs.Tab key={String(i)} tab={tab}>
          {childComponents.map(child => (
            <ComponentRenderer key={child.id} component={child} />
          ))}
        </Tabs.Tab>
      ))}
    </Tabs>
  );
}
```

### 4.4 折叠面板（collapse）

**渲染逻辑**：

```typescript
if (type === 'collapse') {
  const panels = props.panels as Array<{title: string, content: string}>;
  
  return (
    <Collapse>
      {panels.map((panel, i) => (
        <Collapse.Panel key={i} header={panel.title}>
          {/* 子组件从 childrenMap 或 children 获取 */}
          {getChildComponents(i).map(child => (
            <ComponentRenderer key={child.id} component={child} />
          ))}
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
```

---

## 五、保存和加载机制

### 5.1 API 接口

**文件**：`src/lib/api.ts`

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取列表 | POST | `/pageConfig/list` | 分页获取页面配置列表 |
| 获取详情 | POST | `/pageConfig/detail` | 获取单个页面配置 |
| 保存配置 | POST | `/pageConfig/save` | 保存页面配置 |
| 删除配置 | POST | `/pageConfig/delete` | 删除页面配置 |

### 5.2 保存时机

| 时机 | 触发条件 | 说明 |
|------|----------|------|
| 自动保存 | 新页面添加第一个组件时 | 避免数据丢失 |
| 自动保存 | 拖拽排序完成时 | 实时保存布局 |
| 手动保存 | 点击保存按钮 | 用户主动触发 |

### 5.3 保存数据结构

```typescript
// savePageConfig 发送的数据结构
interface PageConfigData {
  id?: number;                    // 页面ID（更新时需要）
  name: string;                   // 页面名称
  status?: number;                // 状态
  components: CanvasComponent[];  // 组件树（完整）
}
```

### 5.4 加载流程

```typescript
// 编辑器入口 index.tsx
const loadPage = async () => {
  // 1. 获取页面详情
  const data = await getPageConfig(pageId);
  
  // 2. 将扁平数据重建为树结构
  const loaded = buildComponentTree(data.components);
  
  // 3. 设置到状态
  setComponents(loaded);
};

// 重建树结构
const buildComponentTree = (flatComponents: Record<string, any>[]): CanvasComponent[] => {
  // 1. 先创建所有组件的引用
  const compMap = new Map<string, CanvasComponent>();
  flatComponents.forEach(c => {
    compMap.set(c.id, { ...c, children: [] });
  });
  
  // 2. 构建父子关系
  flatComponents.forEach(c => {
    if (c.parentId) {
      const parent = compMap.get(c.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(compMap.get(c.id));
      }
    }
  });
  
  // 3. 返回根级组件
  return flatComponents
    .filter(c => !c.parentId)
    .map(c => compMap.get(c.id));
};
```

---

## 六、表格组件 API 绑定

### 6.1 表格配置属性

```typescript
interface TableConfig {
  // API 配置
  apiId?: number;           // 主API（关联数据源）
  queryApiId?: number;       // 查询API
  createApiId?: number;      // 新增API
  updateApiId?: number;      // 更新API
  deleteApiId?: number;      // 删除API
  detailApiId?: number;      // 详情API
  
  // 列配置
  columns: ColumnConfig[];
  
  // 静态数据（Mock/离线使用）
  data?: any[];
  
  // 功能开关
  showSearch?: boolean;       // 显示搜索
  showAdd?: boolean;        // 显示新增
  showEdit?: boolean;        // 显示编辑
  showDelete?: boolean;      // 显示删除
  showExport?: boolean;      // 显示导出
  showPagination?: boolean;  // 显示分页
  
  // 样式
  bordered?: boolean;        // 边框
  striped?: boolean;         // 斑马纹
  pagination?: boolean;       // 分页
  pageSize?: number;         // 每页条数
}
```

### 6.2 列配置（ColumnConfig）

```typescript
interface ColumnConfig {
  key: string;              // 字段名
  label: string;           // 显示标题
  width?: number;          // 列宽
  visible?: boolean;       // 是否显示
  sortable?: boolean;       // 是否可排序
  align?: 'left' | 'center' | 'right';  // 对齐方式
  fixed?: 'left' | 'right';              // 固定列
  ellipsis?: boolean;       // 超出省略
  tooltip?: boolean;        // 显示tooltip
  required?: boolean;       // 必填
  placeholder?: string;     // 占位文本
  queryCondition?: boolean; // 作为查询条件
  dataDictionary?: string;   // 数据字典
  dateFormat?: string;      // 日期格式
  fixedValue?: string;      // 固定值
  customFunction?: string;  // 自定义函数
}
```

### 6.3 数据绑定流程

```
表格组件渲染
    │
    ▼
检查 data 属性
    │
    ├── 有 data → 直接使用静态数据渲染
    │
    └── 无 data → 调用 API
              │
              ▼
         检查 apiId/queryApiId
              │
              ▼
         调用 DataBridge.fetchTableData(apiId, queryParams)
              │
              ▼
         映射到 columns 配置的字段
              │
              ▼
         渲染表格
```

### 6.4 DataBridge 数据桥接

**文件**：`src/lib/DataBridge.ts`

```typescript
// 数据桥接器 - 统一处理表格和表单的数据获取
class DataBridge {
  // 获取表格数据
  async fetchTableData(config: TableConfig, params?: any): Promise<any> {
    // 1. 构建查询参数
    const queryParams = this.buildQueryParams(config, params);
    
    // 2. 调用API
    const api = config.queryApiId || config.apiId;
    const response = await api.post('/query', queryParams);
    
    // 3. 映射字段到列配置
    return this.mapToColumns(response.data, config.columns);
  }
  
  // 构建查询参数
  private buildQueryParams(config: TableConfig, params?: any): any {
    // 根据 columns 中的 queryCondition 字段筛选查询条件
    const conditions = config.columns
      .filter(col => col.queryCondition)
      .map(col => ({ field: col.key, value: params?.[col.key] }));
    return { conditions, ...params };
  }
  
  // 字段映射
  private mapToColumns(data: any[], columns: ColumnConfig[]): any[] {
    return data.map(row => {
      const mapped = {};
      columns.forEach(col => {
        mapped[col.key] = row[col.key];
        // 处理日期格式化
        if (col.dateFormat && row[col.key]) {
          mapped[col.key] = this.formatDate(row[col.key], col.dateFormat);
        }
      });
      return mapped;
    });
  }
}
```

---

## 七、组件分类说明

### 7.1 基础组件

| 组件 | 说明 | 主要属性 |
|------|------|----------|
| 文本 (text) | 静态文本展示 | `content` - 文本内容 |
| 按钮 (button) | 可点击按钮 | `text` - 按钮文字, `buttonType` - 按钮类型 |
| 图片 (image) | 图片展示 | `src` - 图片地址, `alt` - 描述 |
| 链接 (link) | 超链接 | `text` - 链接文本, `url` - 链接地址 |

### 7.2 表单组件

| 组件 | 说明 | 主要属性 |
|------|------|----------|
| 输入框 (input) | 单行文本输入 | `placeholder`, `label` |
| 下拉框 (select) | 下拉选择 | `options` - 选项数组 |
| 日期选择 (date) | 日期控件 | `placeholder`, `format` |
| 开关 (switch) | 开关切换 | `value`, `label` |
| 滑动条 (slider) | 滑动数值 | `min`, `max`, `value` |

### 7.3 数据组件

| 组件 | 说明 | 主要属性 |
|------|------|----------|
| 表格 (table) | 数据展示表格 | `columns`, `apiId`, `data` |
| 表单 (form) | 数据编辑表单 | `columns`, `apiId`, `datasourceId` |
| 折线图 (lineChart) | 折线图表 | `data`, `title` |
| 柱状图 (barChart) | 柱状图表 | `data`, `title` |
| 饼图 (pieChart) | 饼状图表 | `data`, `title` |

### 7.4 布局组件

| 组件 | 说明 | 主要属性 |
|------|------|----------|
| 栅格 (grid) | 响应式栅格 | `cols` - 列数, `gap` - 间距 |
| 分割线 (divider) | 分割线 | `direction` |
| 空白 (blank) | 占位区域 | `height` |

### 7.5 容器组件（重要）

| 组件 | 说明 | childrenMap/children |
|------|------|---------------------|
| 卡片 (card) | 带标题卡片 | `children` - 直接子组件 |
| 标签页 (tabs) | 标签页切换 | `childrenMap` - 按tab索引存储 |
| 折叠面板 (collapse) | 可折叠面板 | `childrenMap` - 按panel索引存储 |

---

## 八、操作流程

### 8.1 新建页面

1. 进入页面列表（`/pages`）
2. 点击「新建页面」
3. 输入页面名称
4. 自动跳转到编辑器

### 8.2 添加组件

**方式一：拖拽**
1. 从左侧组件面板拖动组件
2. 拖入画布目标位置
3. 松开完成添加

**方式二：点击**
1. 点击组件面板中的组件
2. 自动添加到画布末尾

### 8.3 配置属性

1. 点击画布中的组件选中
2. 右侧属性面板显示该组件属性
3. 修改属性值
4. 自动保存或手动保存

### 8.4 调整布局

1. 拖动组件到新位置
2. 支持在根级和容器间拖拽
3. tabs/collapse 等容器支持内部排序

### 8.5 保存页面

- **自动保存**：添加组件、拖拽排序时自动触发
- **手动保存**：点击顶部保存按钮

---

## 九、常见问题

### 9.1 表格数据不显示
- 检查 `apiId` 或 `queryApiId` 是否配置
- 检查后端 API 是否正常返回数据
- 检查 `columns` 的 `key` 字段与返回数据字段是否匹配

### 9.2 标签页内容空白
- 检查 `childrenMap` 是否正确配置
- 检查 `allComponents` 中是否存在对应的组件ID
- 确认组件没有被重复添加到其他位置

### 9.3 拖拽无效
- 检查浏览器控制台是否有报错
- 确认使用的是支持 HTML5 Drag and Drop 的浏览器

### 9.4 属性修改不生效
- 检查属性名是否拼写正确
- 确认属性类型是否正确（如 number vs string）

---

## 十、文件清单

| 文件 | 说明 |
|------|------|
| `src/pages/editor/index.tsx` | 编辑器主入口 |
| `src/pages/editor/types.ts` | TypeScript 类型定义 |
| `src/pages/editor/constants.ts` | 组件分类和默认属性 |
| `src/pages/editor/ComponentPanel.tsx` | 左侧组件面板 |
| `src/pages/editor/DropCanvas.tsx` | 拖拽画布 |
| `src/pages/editor/ComponentRenderer.tsx` | 组件渲染器 |
| `src/pages/editor/ContainerRenderer.tsx` | 容器组件渲染 |
| `src/pages/editor/PropertyPanel.tsx` | 属性配置面板 |
| `src/pages/editor/ComponentTree.tsx` | 组件树形结构 |
| `src/lib/DataBridge.ts` | 数据桥接器 |
| `src/lib/api.ts` | API 接口封装 |

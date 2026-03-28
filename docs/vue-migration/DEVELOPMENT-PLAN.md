# Vue 版本开发计划

## 优先级排序（按中大要求）

| 优先级 | 模块 | 工作量 | 负责 |
|--------|------|--------|------|
| P0 | 菜单管理 | 高 | Dev |
| P1 | 用户管理 | 中 | Dev |
| P2 | 数据源管理 | 中 | Dev |
| P3 | 页面编辑列表 | 中 | Dev |
| P4 | 数据字典 | 低 | Dev |
| P5 | 系统参数 | 低 | Dev |

## 菜单管理功能详解

### 现有 React 参考
- `src/pages/MenuList.tsx` - 菜单列表
- `src/pages/MenuForm.tsx` - 菜单表单（新增/编辑）
- `src/types/index.ts` - SysMenu 类型

### 需要迁移的 API
```typescript
// lib/api.ts 需要补充
getMenuTree(): Promise<SysMenu[]>     // GET /sysMenu/tree
getMenu(id): Promise<SysMenu | null> // GET /sysMenu/{id}
saveMenu(menu): Promise<SysMenu | null> // POST /sysMenu/save
deleteMenu(id): Promise<void>         // DELETE /sysMenu/{id}
```

### Vue 组件清单

| 组件 | 说明 | 参考 |
|------|------|------|
| MenuList.vue | 菜单列表（含树形结构） | MenuList.tsx |
| MenuForm.vue | 菜单新增/编辑弹窗 | MenuForm.tsx |

### 菜单数据结构
```typescript
interface SysMenu {
  id?: number
  parentId?: number
  name: string           // 菜单名称
  path?: string          // 路由路径
  icon?: string          // 图标
  orderNum?: number      // 排序
  type?: 'menu' | 'button'
  menuFrom?: 'static' | 'dynamic'
  visible?: number       // 0-隐藏, 1-显示
  children?: SysMenu[]   // 子菜单
}
```

## 用户管理功能详解

### API
```typescript
getUserList(params): Promise<{list, total}>  // POST /sysUser/list
saveUser(user): Promise<SysUser | null>     // POST /sysUser/save
deleteUser(id): Promise<void>               // DELETE /sysUser/{id}
getAllRoles(): Promise<SysRole[]>            // GET /sysRole/all
```

### Vue 组件清单
| 组件 | 说明 | 参考 |
|------|------|------|
| UserList.vue | 用户列表 | UserList.tsx |
| UserForm.vue | 用户表单 | UserForm.tsx |

## 数据源管理

### API
```typescript
getDataSourceList(params): Promise<{list, total}>
saveDataSource(ds): Promise<DataSource | null>
deleteDataSource(id): Promise<void>
testConnection(ds): Promise<{success, message}>
```

### Vue 组件清单
| 组件 | 说明 | 参考 |
|------|------|------|
| DatasourceList.vue | 数据源列表（已有占位） | DataSourceList.tsx |
| DatasourceForm.vue | 数据源表单 | DataSourceForm.tsx |

## 页面编辑列表

### API
```typescript
// 已存在于 src-vue/lib/api.ts
getPageConfigList(params): Promise<{list, total}>
getPageConfig(id): Promise<PageConfig | null>
savePageConfig(data): Promise<PageConfig | null>
deletePageConfig(id): Promise<void>
```

### Vue 组件清单
| 组件 | 说明 | 参考 |
|------|------|------|
| PageList.vue | 页面列表（已有占位） | PageList.tsx |
| PageEditor.vue | 页面编辑器 | EditorPage.vue（已有） |

## 数据字典

### API
```typescript
// 已存在于 src-vue/lib/api.ts
getAllDictItems(): Promise<Record<string, DictItem[]>>
getDictList(params): Promise<{list, total}>
saveDict(dict): Promise<Dict | null>
deleteDict(id): Promise<void>
getDictItems(dictId): Promise<DictItem[]>
saveDictItem(item): Promise<DictItem | null>
```

### Vue 组件清单
| 组件 | 说明 | 参考 |
|------|------|------|
| DictList.vue | 字典列表 | DictList.tsx |
| DictForm.vue | 字典表单 | DictForm.tsx |

## 系统参数

### API
```typescript
getSystemConfigList(params): Promise<{list, total}>
saveSystemConfig(config): Promise<SystemConfig | null>
deleteSystemConfig(id): Promise<void>
```

## 开发顺序建议

```
Week 1:
├── P0: 菜单管理（MenuList + MenuForm）
│   ├── 补充 API（getMenuTree, saveMenu, deleteMenu）
│   ├── MenuList.vue（树形表格）
│   └── MenuForm.vue（弹窗表单）
│
├── P1: 用户管理（UserList + UserForm）
│   ├── 补充 API（getUserList, saveUser, deleteUser）
│   ├── UserList.vue（表格 + 分页）
│   └── UserForm.vue（弹窗表单）

Week 2:
├── P2: 数据源管理
│   ├── 补充 API（getDataSourceList, saveDataSource, testConnection）
│   ├── DatasourceList.vue
│   └── DatasourceForm.vue（包含连接测试）
│
├── P3: 页面编辑列表
│   ├── PageList.vue（从占位升级为完整列表）
│   └── 集成 PageEditor.vue
│
├── P4: 数据字典
│   ├── 补充 API（getDictList, saveDict）
│   ├── DictList.vue
│   └── DictForm.vue

└── P5: 系统参数
    ├── SystemConfigList.vue
    └── SystemConfigForm.vue
```

## 架构支持（Architect 负责）

1. **API 模块补全** - 补充各模块的 API 方法
2. **类型定义** - 确认各模块的 TypeScript 类型
3. **Layout 菜单对接** - 动态渲染侧边栏菜单
4. **权限控制** - 基于角色的菜单显示控制

## Dev 具体任务

请 Dev 按以下顺序执行：

1. **先做 P0 菜单管理** - 最核心，其他模块可能依赖菜单结构
2. 完成一个模块就提交一次，不要憋太大
3. 每完成一个模块，同步到群里

开始吧！💪

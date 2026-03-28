# Vue 版本完整架构设计

## 一、整体架构

```
src-vue/
├── main.ts                    # 入口
├── App.vue                    # 根组件
├── router/
│   └── index.ts               # 路由配置（含路由守卫）
├── stores/
│   ├── user.ts                # 用户状态（Token、登录状态）
│   ├── menu.ts                # 菜单状态
│   └── editor.ts              # 编辑器状态（已有）
├── views/
│   ├── Login.vue              # 登录页
│   ├── Home.vue               # 首页
│   └── MainLayout.vue         # 主布局（侧边栏+内容）
├── components/
│   ├── layout/
│   │   ├── Sidebar.vue       # 侧边栏
│   │   ├── Header.vue         # 顶部栏
│   │   └── Layout.vue         # 布局容器
│   └── common/                # 通用组件
└── pages/                     # 业务页面
    ├── viewer/                # PageViewer（已完成）
    └── editor/               # 编辑器（Dev 完成）
```

## 二、模块分工

### 2.1 登录模块（Architect 设计，Dev 实现）

**登录流程：**
```
用户输入账号密码 → 调用 /api/auth/login → 获取 Token → 存储到 Pinia + localStorage → 路由守卫放行
```

**关键点：**
- Token 存储：`localStorage.setItem('token', token)`
- Pinia store 存储用户信息
- 路由守卫：未登录跳转 `/login`

```typescript
// stores/user.ts
interface UserState {
  token: string | null
  userInfo: { id: number; username: string; ... } | null
}
```

### 2.2 Layout 模块（Dev 实现）

**结构：**
```
MainLayout
├── Sidebar（侧边栏）
│   ├── Logo
│   ├── Menu（动态菜单）
│   └── Collapse toggle
└── MainContent
    ├── Header（顶部栏）
    │   ├── Breadcrumb
    │   ├── User dropdown
    │   └── Notifications
    └── <router-view>（页面内容）
```

**菜单数据结构：**
```typescript
interface MenuItem {
  id: number
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
}
```

### 2.3 动态路由（Dev 实现）

**方案：**
1. 用户登录后，调用 `/api/menu/tree` 获取菜单
2. 根据菜单动态生成路由配置
3. 使用 `vue-router` 的 `addRoute` 动态添加

```typescript
// 路由守卫
router.beforeEach(async (to, from, next) => {
  if (to.path === '/login') return next()
  
  const userStore = useUserStore()
  if (!userStore.token) return next('/login')
  
  if (!userStore.menus.length) {
    await userStore.fetchMenus()  // 获取菜单树
    // 动态添加路由...
  }
  
  next()
})
```

### 2.4 API 模块

**现有：** `src-vue/lib/api.ts`（已创建）

**需补充：**
- 登录 API：`POST /api/auth/login`
- 菜单 API：`GET /api/menu/tree`
- 用户信息：`GET /api/user/info`

## 三、开发顺序

### Phase 1: 登录 + 基础 Layout
- [ ] `stores/user.ts`（用户状态）
- [ ] `views/Login.vue`（登录页）
- [ ] `components/layout/Sidebar.vue`（侧边栏）
- [ ] `components/layout/Layout.vue`（主布局）
- [ ] 路由守卫 + 动态路由

### Phase 2: 菜单 + 页面集成
- [ ] 菜单 API 对接
- [ ] 现有页面接入 Layout
- [ ] PageViewer 集成到菜单

### Phase 3: 完善
- [ ] 权限控制
- [ ] 退出登录
- [ ] Token 刷新

## 四、关键文件参考

**React 版本参考：**
- 登录：`src/pages/Login.tsx`
- Layout：`src/components/Layout.tsx`
- Token 处理：查看 `src/lib/api.ts` 的请求拦截器

**Vue 现有文件：**
- `src-vue/stores/editor.ts`（参考 Pinia 用法）
- `src-vue/router/index.ts`（参考路由配置）
- `src-vue/pages/viewer/`（已完成 PageViewer）

## 五、API 约定

| 功能 | Method | Path | 说明 |
|------|--------|------|------|
| 登录 | POST | /api/auth/login | 返回 token |
| 获取用户信息 | GET | /api/user/info | |
| 获取菜单树 | GET | /api/menu/tree | |
| 退出 | POST | /api/auth/logout | |

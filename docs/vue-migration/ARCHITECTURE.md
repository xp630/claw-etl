# Vue 版本完整架构设计

## 一、系统架构

```
src-vue/
├── main.ts                    # Vue 入口
├── App.vue                    # 根组件
├── router/
│   └── index.ts              # 路由配置 + 路由守卫
├── stores/
│   ├── editor.ts             # 编辑器状态（已存在）
│   ├── auth.ts               # 【待创建】认证状态
│   └── menu.ts               # 【待创建】菜单状态
├── lib/
│   ├── api.ts                # API 模块（已存在）
│   ├── auth.ts               # 【待创建】认证相关 API
│   └── router.ts             # 【待创建】动态路由生成
├── views/
│   ├── Login.vue              # 【待创建】登录页
│   ├── Layout.vue             # 【待创建】主布局
│   ├── Home.vue              # 【待创建】首页
│   ├── editor/               # 编辑器（已存在）
│   └── viewer/               # 页面预览（已存在）
└── components/               # 公共组件
```

## 二、认证模块设计

### 2.1 Token 管理

```typescript
// stores/auth.ts
interface AuthState {
  token: string | null
  user: UserInfo | null
  permissions: string[]
  isLoggedIn: boolean
}

// Token 存储策略：
// 1. Memory: Pinia store（当前会话）
// 2. Storage: localStorage（持久化，key: 'auth_token'）
```

### 2.2 登录流程

```
1. Login.vue 提交工号/密码
2. 调用 POST /api/login
3. 成功后：
   - 保存 token 到 localStorage
   - 获取用户信息
   - 获取菜单树
   - 生成动态路由
   - 跳转到首页
```

### 2.3 路由守卫

```typescript
// router/index.ts
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 白名单：登录页、公开路由
  if (to.meta.public) {
    return next()
  }
  
  // 检查登录状态
  if (!authStore.isLoggedIn) {
    // 检查 localStorage 是否有 token
    const token = localStorage.getItem('auth_token')
    if (token) {
      // 恢复会话
      await authStore.restoreSession()
      return next()
    }
    return next('/login')
  }
  
  // 检查权限
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    return next('/403')
  }
  
  next()
})
```

## 三、Layout 模块设计

### 3.1 主布局结构

```vue
<!-- Layout.vue -->
<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapsed ? '64px' : '200px'">
      <div class="logo">
        <img src="@/assets/logo.png" />
        <span v-if="!isCollapsed">低代码平台</span>
      </div>
      <SideMenu :menus="menuStore.menus" />
    </el-aside>
    
    <el-container>
      <!-- 顶部 -->
      <el-header>
        <Header @toggle-sidebar="isCollapsed = !isCollapsed" />
      </el-header>
      
      <!-- 主内容 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
```

### 3.2 菜单树结构

```typescript
interface MenuItem {
  id: number
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
  component?: string  // 路由组件名
}
```

## 四、动态路由设计

### 4.1 路由生成

```typescript
// 基于菜单树生成路由
function generateRoutes(menus: MenuItem[]) {
  const routes: RouteRecordRaw[] = []
  
  menus.forEach(menu => {
    if (menu.children && menu.children.length > 0) {
      // 父菜单作为容器路由
      routes.push({
        path: menu.path,
        component: Layout,
        children: generateRoutes(menu.children)
      })
    } else {
      // 叶子节点
      routes.push({
        path: menu.path,
        name: menu.name,
        component: () => import(`@/views/${menu.component}.vue`),
        meta: { title: menu.name, permission: menu.id }
      })
    }
  })
  
  return routes
}
```

## 五、页面模块清单

| 页面 | 组件 | 状态 | 负责 |
|------|------|------|------|
| 登录页 | Login.vue | 待创建 | Architect |
| 主布局 | Layout.vue | 待创建 | Dev |
| 首页 | Home.vue | 待创建 | Dev |
| 用户管理 | UserList.vue | 待创建 | Dev |
| 菜单管理 | MenuList.vue | 待创建 | Dev |
| 角色管理 | RoleList.vue | 待创建 | Dev |
| 页面管理 | PageList.vue | 待创建 | Dev |
| API管理 | ApiList.vue | 待创建 | Dev |
| 数据源 | DataSourceList.vue | 待创建 | Dev |
| 字典管理 | DictList.vue | 待创建 | Dev |
| 页面编辑器 | EditorPage.vue | 已存在 | Dev |
| 页面预览 | PageViewer.vue | 已存在 | Architect |

## 六、开发顺序

### Phase A：认证基础
1. stores/auth.ts - 认证状态管理
2. lib/auth.ts - 认证 API
3. views/Login.vue - 登录页
4. router/index.ts - 路由守卫

### Phase B：Layout
5. views/Layout.vue - 主布局组件
6. components/Sidebar.vue - 侧边栏
7. components/Header.vue - 顶部导航

### Phase C：菜单
8. stores/menu.ts - 菜单状态
9. 动态路由生成
10. 基础页面（Home、UserList 等）

## 七、API 接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/login | POST | 登录 |
| /api/logout | POST | 登出 |
| /api/user/info | GET | 获取用户信息 |
| /api/menu/tree | GET | 获取菜单树 |
| /api/page/list | POST | 页面列表 |
| /api/dict/all-items | GET | 所有字典项 |

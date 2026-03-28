import { createRouter, createWebHashHistory, type NavigationGuardNext, type RouteRecordRaw } from 'vue-router'
import EditorPage from '../pages/editor/EditorPage.vue'
import ApiList from '../pages/ApiList.vue'
import PageViewer from '../pages/viewer/PageViewer.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import Home from '../pages/Home.vue'
import PageList from '../pages/PageList.vue'
import MenuList from '../pages/system/MenuList.vue'
import DatasourceList from '../pages/DatasourceList.vue'
import DatasourceForm from '../pages/DatasourceForm.vue'
import UserList from '../pages/users/UserList.vue'
import UserForm from '../pages/users/UserForm.vue'
import RoleList from '../pages/roles/RoleList.vue'
import RoleForm from '../pages/roles/RoleForm.vue'
import DictList from '../pages/dict/DictList.vue'
import SystemConfigList from '../pages/SystemConfigList.vue'
import DictForm from '../pages/dict/DictForm.vue'
import TaskList from '../pages/tasks/TaskList.vue'
import ApiList from '../pages/apis/ApiList.vue'
import TaskForm from '../pages/tasks/TaskForm.vue'
import MainLayout from '../components/layout/MainLayout.vue'
import FeatureList from '../pages/features/FeatureList.vue'
import { useAuthStore } from '@/stores/auth'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { public: true }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/editor'
      },
      {
        path: '/editor',
        name: 'Editor',
        component: EditorPage,
        meta: { title: '页面编辑器' }
      },
      {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: { title: '首页' }
      },
      {
        path: '/pages',
        name: 'PageList',
        component: PageList,
        meta: { title: '页面配置' }
      },
      {
        path: '/apis',
        name: 'ApiList',
        component: ApiList,
        meta: { title: 'API 管理' }
      },
      {
        path: '/menus',
        name: 'MenuList',
        component: MenuList,
        meta: { title: '菜单管理' }
      },
      {
        path: '/datasources',
        name: 'DatasourceList',
        component: DatasourceList,
        meta: { title: '数据源管理' }
      },
      {
        path: '/datasources/:id',
        name: 'DatasourceEdit',
        component: DatasourceForm,
        meta: { title: '编辑数据源' }
      },
      {
        path: '/datasources/new',
        name: 'DatasourceCreate',
        component: DatasourceForm,
        meta: { title: '新增数据源' }
      },
      {
        path: '/tasks',
        name: 'TaskList',
        component: TaskList,
        meta: { title: '任务管理' }
      },
      {
        path: '/apis',
        name: 'ApiList',
        component: ApiList,
        meta: { title: 'API管理' }
      },
      {
        path: '/features',
        name: 'FeatureList',
        component: FeatureList,
        meta: { title: '功能管理' }
      },
      {
        path: '/tasks/new',
        name: 'TaskCreate',
        component: TaskForm,
        meta: { title: '新增任务' }
      },
      {
        path: '/tasks/:id',
        name: 'TaskEdit',
        component: TaskForm,
        meta: { title: '编辑任务' }
      },
      {
        path: '/users',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户管理' }
      },
      {
        path: '/users/new',
        name: 'UserCreate',
        component: UserForm,
        meta: { title: '新增用户' }
      },
      {
        path: '/users/:id',
        name: 'UserEdit',
        component: UserForm,
        meta: { title: '编辑用户' }
      },
      {
        path: '/roles',
        name: 'RoleList',
        component: RoleList,
        meta: { title: '角色管理' }
      },
      {
        path: '/roles/new',
        name: 'RoleCreate',
        component: RoleForm,
        meta: { title: '新增角色' }
      },
      {
        path: '/roles/:id',
        name: 'RoleEdit',
        component: RoleForm,
        meta: { title: '编辑角色' }
      },
      {
        path: '/dict',
        name: 'DictList',
        component: DictList,
        meta: { title: '数据字典' }
      },
      {
        path: '/dict/new',
        name: 'DictCreate',
        component: DictForm,
        meta: { title: '新增字典' }
      },
      {
        path: '/dict/:id',
        name: 'DictEdit',
        component: DictForm,
        meta: { title: '编辑字典' }
      },
      {
        path: '/system-config',
        name: 'SystemConfigList',
        component: SystemConfigList,
        meta: { title: '系统参数' }
      }
    ]
  },
  {
    path: '/render/:code',
    name: 'PageViewer',
    component: PageViewer,
    meta: { public: true, title: '页面预览' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next: NavigationGuardNext) => {
  const authStore = useAuthStore()

  // 公开页面直接访问
  if (to.meta.public) {
    next()
    return
  }

  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 有 token 就视为已登录（token 可能是 username fallback）
    if (authStore.token) {
      next()
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    return
  }

  // 已登录访问登录页，跳转首页
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Editor' })
    return
  }

  next()
})

export default router

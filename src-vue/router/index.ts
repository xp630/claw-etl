import { createRouter, createWebHashHistory, type NavigationGuardNext, type RouteRecordRaw } from 'vue-router'
import EditorPage from '../pages/editor/EditorPage.vue'
import PageViewer from '../pages/viewer/PageViewer.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import HomePage from '../pages/Home.vue'
import MainLayout from '../components/layout/MainLayout.vue'
import { useAuthStore } from '../stores/auth'

// 路由配置
const routes: RouteRecordRaw[] = [
  // 公开路由
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { public: true }
  },
  {
    path: '/render/:code',
    name: 'PageViewer',
    component: PageViewer,
    meta: { public: true }
  },

  // 需要布局的路由
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/home'
      },
      {
        path: 'home',
        name: 'Home',
        component: HomePage
      },
      {
        path: 'editor',
        name: 'Editor',
        component: EditorPage
      },
      {
        path: 'datasource',
        name: 'Datasource',
        component: () => import('../pages/DatasourceList.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../pages/UserList.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../pages/Settings.vue')
      }
    ]
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
    if (to.name === 'Login' && authStore.isLoggedIn) {
      // 已登录访问登录页，跳转到首页
      next({ name: 'Home' })
    } else {
      next()
    }
    return
  }

  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    if (authStore.token) {
      // 有 token，尝试获取用户信息
      authStore.fetchUserInfo().then(() => {
        if (authStore.isLoggedIn) {
          next()
        } else {
          next({ name: 'Login', query: { redirect: to.fullPath } })
        }
      }).catch(() => {
        next({ name: 'Login', query: { redirect: to.fullPath } })
      })
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    return
  }

  next()
})

export default router

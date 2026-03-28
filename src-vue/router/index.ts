import { createRouter, createWebHashHistory, type NavigationGuardNext, type RouteRecordRaw } from 'vue-router'
import EditorPage from '../pages/editor/EditorPage.vue'
import PageViewer from '../pages/viewer/PageViewer.vue'
import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/HomePage.vue'
import MainLayout from '../components/layout/MainLayout.vue'
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
        component: HomePage,
        meta: { title: '首页' }
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
    if (authStore.token) {
      // 有 token，尝试获取用户信息
      authStore.fetchCurrentUser().then(() => {
        if (authStore.isAuthenticated) {
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

  // 已登录访问登录页，跳转首页
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Editor' })
    return
  }

  next()
})

export default router

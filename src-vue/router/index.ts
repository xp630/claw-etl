import { createRouter, createWebHashHistory, type NavigationGuardNext, type RouteRecordRaw } from 'vue-router'
import EditorPage from '../pages/editor/EditorPage.vue'
import PageViewer from '../pages/viewer/PageViewer.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import { useAuthStore } from '../stores/auth'

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
    redirect: '/editor'
  },
  {
    path: '/editor',
    name: 'Editor',
    component: EditorPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/render/:code',
    name: 'PageViewer',
    component: PageViewer,
    meta: { public: true }  // PageViewer 公开访问
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 导航守卫
router.beforeEach((to, from, next: NavigationGuardNext) => {
  const authStore = useAuthStore()
  
  // 如果页面需要登录且未认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 检查本地是否有 token（可能已过期，需要尝试获取用户信息）
    if (authStore.token) {
      // 尝试获取用户信息，成功则继续，失败则跳转登录
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
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    // 已登录访问登录页，跳转到编辑器
    next({ name: 'Editor' })
  } else {
    next()
  }
})

export default router

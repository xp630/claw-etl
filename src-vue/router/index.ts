import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from '../pages/editor/EditorPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/editor'
  },
  {
    path: '/editor',
    name: 'Editor',
    component: EditorPage
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

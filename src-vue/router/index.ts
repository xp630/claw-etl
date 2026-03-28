import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from '../pages/editor/EditorPage.vue'
import PageViewer from '../pages/viewer/PageViewer.vue'

const routes = [
  {
    path: '/',
    redirect: '/editor'
  },
  {
    path: '/editor',
    name: 'Editor',
    component: EditorPage
  },
  {
    path: '/render/:code',
    name: 'PageViewer',
    component: PageViewer
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

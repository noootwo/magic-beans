import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Workspace from '@/pages/Workspace.vue'
import Editor from '@/pages/Editor.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/workspace' },
  { path: '/workspace', component: Workspace },
  { path: '/editor/:id', component: Editor },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
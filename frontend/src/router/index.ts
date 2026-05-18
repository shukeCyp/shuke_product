import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('../views/ConfigManage.vue')
    },
    {
      path: '/vault',
      name: 'vault',
      component: () => import('../views/VaultBrowser.vue')
    },
    {
      path: '/vault/:videoId',
      name: 'video-detail',
      component: () => import('../views/VideoDetail.vue')
    },
    {
      path: '/hooks',
      name: 'hooks',
      component: () => import('../views/HookLibrary.vue')
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectList.vue')
    },
    {
      path: '/projects/:projectId',
      name: 'project-detail',
      component: () => import('../views/ProjectDetail.vue')
    }
  ]
})

export default router

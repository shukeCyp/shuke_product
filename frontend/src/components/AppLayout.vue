<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const menuItems = [
  { path: '/', title: '仪表盘', icon: 'DataAnalysis' },
  { path: '/vault', title: '视频分析库', icon: 'VideoCamera' },
  { path: '/hooks', title: '钩子库', icon: 'Connection' },
  { path: '/projects', title: '项目', icon: 'FolderOpened' },
  { path: '/config', title: '配置管理', icon: 'Setting' }
]

const activeMenu = computed(() => {
  if (route.path.startsWith('/vault')) return '/vault'
  if (route.path.startsWith('/projects')) return '/projects'
  return route.path
})

function onMenuSelect(path: string) {
  router.push(path)
}
</script>

<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background: #1d1e2c; border-right: none">
      <div class="logo-area">
        <span class="logo-icon">S</span>
        <span class="logo-text">Shuke Product</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#1d1e2c"
        text-color="#a0a4b8"
        active-text-color="#fff"
        style="border-right: none"
        @select="onMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main style="background: #f5f6fa; padding: 24px; overflow-y: auto">
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 8px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  font-size: 18px;
}
.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
</style>

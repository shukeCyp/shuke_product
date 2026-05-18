<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchProjects } from '../api'
import type { ProjectItem } from '../types'

const router = useRouter()
const projects = ref<ProjectItem[]>([])
const loading = ref(true)
const searchText = ref('')

onMounted(async () => {
  try {
    projects.value = await fetchProjects()
  } finally {
    loading.value = false
  }
})

const filteredProjects = computed(() => {
  if (!searchText.value) return projects.value
  const s = searchText.value.toLowerCase()
  return projects.value.filter(p => p.slug.toLowerCase().includes(s))
})

import { computed } from 'vue'

function formatTime(ts: string) {
  if (!ts) return ''
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/)
  if (!m) return ts
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
}

function statusType(status: string) {
  if (status === 'completed') return 'success'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'completed') return '已完成'
  return '进行中'
}

function viewProject(id: string) {
  router.push(`/projects/${id}`)
}
</script>

<template>
  <div v-loading="loading">
    <h2 style="margin: 0 0 20px; font-size: 20px; color: #303133">项目列表</h2>

    <el-input
      v-model="searchText"
      placeholder="搜索项目..."
      clearable
      style="margin-bottom: 16px; width: 360px"
    />

    <el-row :gutter="16">
      <el-col v-for="project in filteredProjects" :key="project.id" :span="8" style="margin-bottom: 16px">
        <el-card shadow="hover" style="border-radius: 10px; cursor: pointer" @click="viewProject(project.id)">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: 600; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                {{ project.slug }}
              </span>
              <el-tag :type="statusType(project.status)" size="small">
                {{ statusLabel(project.status) }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="时间">{{ formatTime(project.timestamp) }}</el-descriptions-item>
            <el-descriptions-item label="媒体文件">{{ project.mediaCount }} 个</el-descriptions-item>
            <el-descriptions-item label="脚本">
              <el-tag v-if="project.hasScript" type="success" size="small">有</el-tag>
              <el-tag v-else type="info" size="small">无</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="ID">{{ project.id }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="project.mediaFiles.length" style="margin-top: 8px">
            <el-tag
              v-for="f in project.mediaFiles.slice(0, 6)"
              :key="f"
              size="small"
              type="info"
              style="margin: 2px; max-width: 100%; overflow: hidden; text-overflow: ellipsis"
            >
              {{ f }}
            </el-tag>
            <span v-if="project.mediaFiles.length > 6" style="font-size: 12px; color: #909399">
              +{{ project.mediaFiles.length - 6 }} 更多
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && filteredProjects.length === 0" description="暂无项目" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchProjects, getMediaUrl } from '../api'
import type { ProjectItem } from '../types'

const router = useRouter()
const projects = ref<ProjectItem[]>([])
const loading = ref(true)
const searchText = ref('')
const sseSource = ref<EventSource | null>(null)

async function loadProjects() {
  try {
    projects.value = await fetchProjects()
  } catch (e) {
    // ignore
  }
}

onMounted(async () => {
  loading.value = true
  await loadProjects()
  loading.value = false

  // SSE for real-time updates from Claude Code
  sseSource.value = new EventSource('/api/events')
  sseSource.value.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.type === 'project_changed') {
        loadProjects()
      }
    } catch {}
  }
})

onUnmounted(() => {
  sseSource.value?.close()
})

const filteredProjects = computed(() => {
  if (!searchText.value) return projects.value
  const s = searchText.value.toLowerCase()
  return projects.value.filter(p => p.slug.toLowerCase().includes(s))
})

function formatTime(ts: string) {
  if (!ts) return ''
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/)
  if (!m) return ts
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`
}

function statusLabel(status: string) {
  if (status === 'completed') return '已完成'
  return '进行中'
}

function thumbnailSrc(project: ProjectItem): string | undefined {
  if (!project.mediaFiles?.length) return undefined
  const firstImg = project.mediaFiles.find(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    || project.mediaFiles[0]
  return getMediaUrl(project.id, firstImg)
}

function viewProject(id: string) {
  router.push(`/projects/${id}`)
}
</script>

<template>
  <div>
    <div class="page-header-bar">
      <div>
        <h2 class="page-title">项目</h2>
        <p class="page-desc">Claude Code 同步 &middot; 实时更新</p>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchText"
          placeholder="搜索项目..."
          clearable
          style="width: 260px"
          size="large"
        />
        <el-tag effect="plain" type="info" size="large" round>
          {{ projects.length }} 个项目
        </el-tag>
      </div>
    </div>

    <div v-if="filteredProjects.length === 0 && !loading" class="empty-state">
      <el-icon :size="64" color="#c0c4cc"><FolderOpened /></el-icon>
      <p>暂无项目</p>
      <p class="sub">在 Claude Code 中运行 product-image-video-storyboard 生成第一个项目</p>
    </div>

    <div v-else class="project-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        @click="viewProject(project.id)"
      >
        <div class="card-media">
          <template v-if="thumbnailSrc(project)">
            <img :src="thumbnailSrc(project)" :alt="project.slug" />
          </template>
          <template v-else>
            <div class="no-thumb">
              <el-icon :size="40" color="#c0c4cc"><Picture /></el-icon>
            </div>
          </template>
          <div class="card-overlay">
            <el-button type="primary" size="small" round>查看详情</el-button>
          </div>
        </div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">{{ project.slug.replace(/_/g, ' ') }}</h3>
            <el-tag
              :type="project.status === 'completed' ? 'success' : 'warning'"
              effect="light"
              size="small"
              round
            >
              {{ statusLabel(project.status) }}
            </el-tag>
          </div>
          <p class="card-time">{{ formatTime(project.timestamp) }}</p>
          <div class="card-meta">
            <span class="meta-item">
              <el-icon :size="14"><Document /></el-icon>
              {{ project.hasScript ? '有脚本' : '无脚本' }}
            </span>
            <span class="meta-item">
              <el-icon :size="14"><Film /></el-icon>
              {{ project.mediaCount }} 个媒体
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
}
.page-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
}
.empty-state p {
  margin: 8px 0;
  font-size: 15px;
}
.empty-state .sub {
  font-size: 13px;
  color: #c0c4cc;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.project-card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.10);
}
.project-card:hover .card-overlay {
  opacity: 1;
}

.card-media {
  position: relative;
  width: 100%;
  height: 180px;
  background: #f0f2f5;
  overflow: hidden;
}
.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f6fa 0%, #e8eaf0 100%);
}
.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.card-body {
  padding: 16px;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  text-transform: capitalize;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-time {
  margin: 6px 0 10px;
  font-size: 12px;
  color: #a0a4b8;
}
.card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchProjectDetail, fetchClaudePrompts, getMediaUrl } from '../api'
import type { ProjectDetail } from '../types'

const route = useRoute()
const router = useRouter()
const project = ref<ProjectDetail | null>(null)
const loading = ref(true)
const activeTab = ref('media')
const claudePrompts = ref<Record<string, string> | null>(null)

onMounted(async () => {
  try {
    const id = route.params.projectId as string
    const [detail, prompts] = await Promise.all([
      fetchProjectDetail(id),
      fetchClaudePrompts(id)
    ])
    project.value = detail
    claudePrompts.value = prompts
  } finally {
    loading.value = false
  }
})

// Parse storyboard table from markdown
interface StoryboardRow {
  shot: string
  duration_plan: string
  duration_gen: string
  visual: string
  voiceover: string
  image_prompt: string
  video_prompt: string
  edit_note: string
}

const storyboardRows = computed<StoryboardRow[]>(() => {
  if (!project.value?.script) return []
  const rows: StoryboardRow[] = []
  const lines = project.value.script.split('\n')
  let inTable = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('|') && trimmed.includes('镜头') && trimmed.includes('规划时长')) {
      inTable = true
      continue
    }
    if (trimmed.startsWith('|') && trimmed.includes('---')) continue
    if (inTable && trimmed.startsWith('|') && !trimmed.startsWith('| 镜头')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 8) {
        rows.push({
          shot: cells[0],
          duration_plan: cells[1],
          duration_gen: cells[2],
          visual: cells[3],
          voiceover: cells[4],
          image_prompt: cells[5],
          video_prompt: cells[6],
          edit_note: cells[7]
        })
      }
    } else if (inTable && !trimmed.startsWith('|') && trimmed !== '') {
      inTable = false
    }
  }
  return rows
})

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板，粘贴到 Claude Code 即可使用')
  })
}
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="router.push('/projects')" style="margin-bottom: 20px">
      <template #content>
        <span class="detail-title">{{ (route.params.projectId as string).replace(/^\d+_\d+_/, '') }}</span>
      </template>
      <template #extra>
        <el-dropdown v-if="claudePrompts" trigger="click">
          <el-button type="primary" size="small" round>
            <el-icon><Promotion /></el-icon>
            在 Claude Code 中继续
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="copyToClipboard(claudePrompts!.continue_project)">
                <el-icon><VideoCamera /></el-icon> 继续生成视频
              </el-dropdown-item>
              <el-dropdown-item @click="copyToClipboard(claudePrompts!.new_variant)">
                <el-icon><Connection /></el-icon> 换 Hook 风格重做
              </el-dropdown-item>
              <el-dropdown-item @click="copyToClipboard(claudePrompts!.analyze_only)">
                <el-icon><Document /></el-icon> 仅重新分析+脚本
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-page-header>

    <template v-if="project">
      <!-- Overview Banner -->
      <div class="overview-banner">
        <div class="banner-item">
          <span class="banner-label">媒体文件</span>
          <span class="banner-value">{{ project.mediaFiles.length }}</span>
        </div>
        <div class="banner-divider" />
        <div class="banner-item">
          <span class="banner-label">参考图</span>
          <span class="banner-value">{{ project.refImages.length }}</span>
        </div>
        <div class="banner-divider" />
        <div class="banner-item">
          <span class="banner-label">分镜镜头</span>
          <span class="banner-value">{{ storyboardRows.length }}</span>
        </div>
        <div class="banner-divider" />
        <div class="banner-item">
          <span class="banner-label">脚本</span>
          <span class="banner-value">{{ project.script ? '有' : '无' }}</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="媒体文件" name="media">
          <!-- Reference Images -->
          <div v-if="project.refImages.length" style="margin-bottom: 20px">
            <h3 class="section-title">参考图</h3>
            <div class="ref-gallery">
              <div v-for="img in project.refImages" :key="img" class="ref-item">
                <el-image
                  :src="getMediaUrl(route.params.projectId as string, img)"
                  :preview-src-list="[getMediaUrl(route.params.projectId as string, img)]"
                  fit="cover"
                  class="ref-image"
                />
                <p class="ref-name">{{ img }}</p>
              </div>
            </div>
          </div>

          <!-- Generated Media -->
          <h3 class="section-title">生成媒体</h3>
          <div v-if="project.mediaFiles.length" class="media-gallery">
            <div v-for="file in project.mediaFiles" :key="file" class="media-card">
              <template v-if="/\.(mp4|webm|mov)$/i.test(file)">
                <video :src="getMediaUrl(route.params.projectId as string, file)" controls class="media-video" />
              </template>
              <template v-else>
                <el-image
                  :src="getMediaUrl(route.params.projectId as string, file)"
                  :preview-src-list="[getMediaUrl(route.params.projectId as string, file)]"
                  fit="cover"
                  class="media-image"
                />
              </template>
              <p class="media-filename">{{ file }}</p>
            </div>
          </div>
          <div v-else class="empty-section">暂无媒体文件</div>
        </el-tab-pane>

        <el-tab-pane label="分镜脚本" name="script">
          <!-- Storyboard Table -->
          <div v-if="storyboardRows.length" class="storyboard-wrap">
            <div class="storyboard-hint">
              <el-icon><InfoFilled /></el-icon>
              总 {{ storyboardRows.length }} 个镜头
            </div>
            <el-table :data="storyboardRows" border stripe style="width: 100%" :max-height="600">
              <el-table-column prop="shot" label="镜头" width="70" align="center" fixed="left" />
              <el-table-column label="时长" width="90" align="center">
                <template #default="{ row }">
                  <span style="font-size: 12px">{{ row.duration_plan }}/{{ row.duration_gen }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="visual" label="画面" min-width="180">
                <template #default="{ row }">
                  <div class="cell-text">{{ row.visual }}</div>
                </template>
              </el-table-column>
              <el-table-column prop="voiceover" label="口播/字幕" min-width="180">
                <template #default="{ row }">
                  <div class="cell-text">{{ row.voiceover }}</div>
                </template>
              </el-table-column>
              <el-table-column label="首帧图提示词" width="150">
                <template #default="{ row }">
                  <el-popover placement="left" :width="400" trigger="click">
                    <template #reference>
                      <el-button size="small" text type="primary">查看提示词</el-button>
                    </template>
                    <pre class="prompt-pre">{{ row.image_prompt }}</pre>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column label="视频提示词" width="150">
                <template #default="{ row }">
                  <el-popover placement="left" :width="400" trigger="click">
                    <template #reference>
                      <el-button size="small" text type="success">查看提示词</el-button>
                    </template>
                    <pre class="prompt-pre">{{ row.video_prompt }}</pre>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column prop="edit_note" label="剪辑备注" width="160">
                <template #default="{ row }">
                  <div class="cell-text edit-note">{{ row.edit_note }}</div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="empty-section">分镜脚本解析中或无数据</div>

          <!-- Raw Script -->
          <el-collapse v-if="project.script" style="margin-top: 16px">
            <el-collapse-item title="查看原始 Markdown">
              <div class="raw-markdown" v-html="project.script.replace(/\n/g, '<br>')" />
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>

        <el-tab-pane label="产品分析" name="analysis">
          <div v-if="project.analysis" class="content-panel">
            <div class="raw-markdown" v-html="project.analysis.replace(/\n/g, '<br>')" />
          </div>
          <div v-else class="empty-section">暂无分析</div>
        </el-tab-pane>

        <el-tab-pane label="提示词" name="prompts">
          <div v-if="project.foundation" style="margin-bottom: 20px">
            <h3 class="section-title">基础参考提示词</h3>
            <div class="content-panel">
              <div class="raw-markdown" v-html="project.foundation.replace(/\n/g, '<br>')" />
            </div>
          </div>
          <div v-if="Object.keys(project.prompts).length">
            <h3 class="section-title">结构化提示词 (prompts.json)</h3>
            <pre class="json-block">{{ JSON.stringify(project.prompts, null, 2) }}</pre>
          </div>
          <div v-if="!project.foundation && !Object.keys(project.prompts).length" class="empty-section">暂无提示词</div>
        </el-tab-pane>

        <el-tab-pane label="项目信息" name="info">
          <div v-if="Object.keys(project.refs).length">
            <h3 class="section-title">项目元数据 (references.json)</h3>
            <pre class="json-block">{{ JSON.stringify(project.refs, null, 2) }}</pre>
          </div>
          <div v-else class="empty-section">暂无元数据</div>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style scoped>
.detail-title {
  font-size: 17px;
  font-weight: 700;
  text-transform: capitalize;
}

/* Overview Banner */
.overview-banner {
  display: flex;
  align-items: center;
  gap: 0;
  background: #fff;
  border-radius: 14px;
  padding: 20px 28px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.banner-item {
  flex: 1;
  text-align: center;
}
.banner-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.banner-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}
.banner-divider {
  width: 1px;
  height: 40px;
  background: #ebeef5;
}

/* Section */
.section-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

/* Ref Gallery */
.ref-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.ref-item {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}
.ref-image {
  width: 100%;
  height: 160px;
}
.ref-name {
  margin: 0;
  padding: 8px 10px;
  font-size: 11px;
  color: #909399;
  text-align: center;
}

/* Media Gallery */
.media-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.media-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.2s;
}
.media-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
}
.media-video,
.media-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.media-filename {
  margin: 0;
  padding: 8px 12px;
  font-size: 11px;
  color: #909399;
  text-align: center;
  background: #fafafa;
}

/* Storyboard */
.storyboard-wrap {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.storyboard-hint {
  padding: 10px 16px;
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cell-text {
  font-size: 12px;
  line-height: 1.6;
  max-height: 80px;
  overflow-y: auto;
}
.edit-note {
  color: #e6a23c;
}
.prompt-pre {
  white-space: pre-wrap;
  font-size: 11px;
  line-height: 1.6;
  max-height: 360px;
  overflow-y: auto;
  word-break: break-all;
}

/* Content Panel */
.content-panel {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #ebeef5;
  max-height: 600px;
  overflow-y: auto;
}
.raw-markdown {
  font-size: 14px;
  line-height: 1.9;
  color: #303133;
}
.json-block {
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 20px;
  font-size: 12px;
  line-height: 1.7;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'SF Mono', 'Menlo', monospace;
}

/* Empty */
.empty-section {
  text-align: center;
  padding: 60px 20px;
  color: #c0c4cc;
  font-size: 14px;
}

/* Detail Tabs */
.detail-tabs {
  background: #fff;
  border-radius: 14px;
  padding: 4px 20px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
</style>

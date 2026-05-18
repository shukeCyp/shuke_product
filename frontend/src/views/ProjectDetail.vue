<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProjectDetail, getMediaUrl } from '../api'
import type { ProjectDetail } from '../types'
import MediaGallery from '../components/MediaGallery.vue'

const route = useRoute()
const router = useRouter()
const project = ref<ProjectDetail | null>(null)
const loading = ref(true)
const activeTab = ref('media')

onMounted(async () => {
  try {
    project.value = await fetchProjectDetail(route.params.projectId as string)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="router.push('/projects')" style="margin-bottom: 20px">
      <template #content>
        <span style="font-size: 16px; font-weight: 600">{{ route.params.projectId }}</span>
      </template>
    </el-page-header>

    <template v-if="project">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="媒体文件" name="media">
          <el-card shadow="hover" header="生成的媒体" style="border-radius: 10px">
            <MediaGallery :files="project.mediaFiles" :project-id="route.params.projectId as string" />
          </el-card>
          <el-card v-if="project.refImages.length" shadow="hover" header="参考图" style="border-radius: 10px; margin-top: 16px">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px">
              <div v-for="img in project.refImages" :key="img">
                <el-image
                  :src="getMediaUrl(route.params.projectId as string, img)"
                  :preview-src-list="[getMediaUrl(route.params.projectId as string, img)]"
                  fit="cover"
                  style="width: 100%; border-radius: 6px"
                />
                <p style="text-align: center; font-size: 12px; color: #909399; margin: 4px 0">{{ img }}</p>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="分镜脚本" name="script">
          <el-card shadow="hover" header="script.md" style="border-radius: 10px">
            <div
              v-if="project.script"
              style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; max-height: 70vh; overflow-y: auto"
              v-html="project.script.replace(/\n/g, '<br>')"
            />
            <el-empty v-else description="暂无脚本" />
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="产品分析" name="analysis">
          <el-card shadow="hover" header="product_analysis.md" style="border-radius: 10px">
            <div
              v-if="project.analysis"
              style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; max-height: 70vh; overflow-y: auto"
              v-html="project.analysis.replace(/\n/g, '<br>')"
            />
            <el-empty v-else description="暂无分析" />
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="参考提示词" name="prompts">
          <el-card shadow="hover" header="00_foundation_prompts.md" style="border-radius: 10px; margin-bottom: 16px">
            <div
              v-if="project.foundation"
              style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; max-height: 70vh; overflow-y: auto"
              v-html="project.foundation.replace(/\n/g, '<br>')"
            />
            <el-empty v-else description="暂无" />
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="项目信息" name="info">
          <el-card shadow="hover" header="references.json" style="border-radius: 10px">
            <pre
              v-if="Object.keys(project.refs).length"
              style="white-space: pre-wrap; font-size: 13px; background: #f5f6fa; padding: 16px; border-radius: 6px; max-height: 70vh; overflow-y: auto"
            >{{ JSON.stringify(project.refs, null, 2) }}</pre>
            <el-empty v-else description="暂无" />
          </el-card>
          <el-card shadow="hover" header="prompts.json" style="border-radius: 10px; margin-top: 16px">
            <pre
              v-if="Object.keys(project.prompts).length"
              style="white-space: pre-wrap; font-size: 13px; background: #f5f6fa; padding: 16px; border-radius: 6px; max-height: 70vh; overflow-y: auto"
            >{{ JSON.stringify(project.prompts, null, 2) }}</pre>
            <el-empty v-else description="暂无" />
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

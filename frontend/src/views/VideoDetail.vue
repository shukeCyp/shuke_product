<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchVideoDetail } from '../api'
import type { VideoAnalysis } from '../types'
import ScoreRadar from '../components/ScoreRadar.vue'
import TagCloud from '../components/TagCloud.vue'

const route = useRoute()
const router = useRouter()
const video = ref<VideoAnalysis | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    video.value = await fetchVideoDetail(route.params.videoId as string)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading">
    <el-page-header @back="router.push('/vault')" style="margin-bottom: 20px">
      <template #content>
        <span style="font-size: 16px; font-weight: 600">视频详情</span>
      </template>
    </el-page-header>

    <template v-if="video">
      <!-- Overview Card -->
      <el-row :gutter="16" style="margin-bottom: 16px">
        <el-col :span="16">
          <el-card shadow="hover" header="基本信息" style="border-radius: 10px">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="视频ID">{{ video.video_id }}</el-descriptions-item>
              <el-descriptions-item label="品类">{{ video.product?.category || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="产品名">{{ video.product?.name || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="置信度">{{ (video.product?.confidence || 0) * 100 }}%</el-descriptions-item>
              <el-descriptions-item label="时长">{{ video.source?.duration_seconds }}秒</el-descriptions-item>
              <el-descriptions-item label="分析模型">{{ video.source?.model }}</el-descriptions-item>
              <el-descriptions-item label="分析日期">{{ video.source?.created_at }}</el-descriptions-item>
              <el-descriptions-item label="总分">
                <el-tag :type="(video.scores?.total || 0) >= 8 ? 'success' : (video.scores?.total || 0) >= 6 ? 'warning' : 'danger'" effect="dark">
                  {{ video.scores?.total }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" header="评分雷达图" style="border-radius: 10px">
            <ScoreRadar v-if="video.scores" :scores="video.scores" />
          </el-card>
        </el-col>
      </el-row>

      <!-- Tags -->
      <el-row :gutter="16" style="margin-bottom: 16px">
        <el-col :span="8">
          <el-card shadow="hover" header="视频类型标签" style="border-radius: 10px">
            <TagCloud :tags="video.tags?.video_type_tags" type="success" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" header="钩子标签" style="border-radius: 10px">
            <TagCloud :tags="video.tags?.hook_tags" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" header="受众标签" style="border-radius: 10px">
            <TagCloud :tags="video.tags?.audience_tags" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-bottom: 16px">
        <el-col :span="8">
          <el-card shadow="hover" header="证明标签" style="border-radius: 10px">
            <TagCloud :tags="video.tags?.proof_tags" type="warning" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" header="风险标签" style="border-radius: 10px">
            <TagCloud :tags="video.tags?.risk_tags" type="danger" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" header="平台标签" style="border-radius: 10px">
            <TagCloud :tags="video.tags?.platform_tags" />
          </el-card>
        </el-col>
      </el-row>

      <!-- Hook & CTA -->
      <el-row :gutter="16" style="margin-bottom: 16px">
        <el-col :span="12">
          <el-card shadow="hover" header="钩子信息" style="border-radius: 10px">
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="类型">{{ video.hook?.type || '无' }}</el-descriptions-item>
              <el-descriptions-item label="前3秒">{{ video.hook?.first_3s_text || '无' }}</el-descriptions-item>
              <el-descriptions-item label="机制">{{ video.hook?.mechanism || '无' }}</el-descriptions-item>
              <el-descriptions-item label="留存评分">{{ video.hook?.retention_score || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" header="CTA & 卖点" style="border-radius: 10px">
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="CTA文本">{{ video.cta?.text || '无' }}</el-descriptions-item>
              <el-descriptions-item label="CTA清晰度">{{ video.cta?.clarity || '-' }}</el-descriptions-item>
            </el-descriptions>
            <div style="margin-top: 12px">
              <p style="font-size: 13px; color: #909399; margin-bottom: 4px">卖点：</p>
              <div v-if="video.selling_points?.length">
                <el-tag v-for="sp in video.selling_points" :key="sp" size="small" type="success" style="margin: 2px">{{ sp }}</el-tag>
              </div>
              <span v-else style="color: #c0c4cc; font-size: 13px">无</span>
            </div>
            <div style="margin-top: 12px">
              <p style="font-size: 13px; color: #909399; margin-bottom: 4px">证明点：</p>
              <div v-if="video.proof_points?.length">
                <el-tag v-for="pp in video.proof_points" :key="pp" size="small" type="warning" style="margin: 2px">{{ pp }}</el-tag>
              </div>
              <span v-else style="color: #c0c4cc; font-size: 13px">无</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Remake Info -->
      <el-card v-if="video.remake?.angle" shadow="hover" header="改造建议" style="border-radius: 10px; margin-bottom: 16px">
        <p style="white-space: pre-wrap; margin: 0 0 12px">{{ video.remake.angle }}</p>
        <div v-if="video.remake.script_outline?.length">
          <p style="font-weight: 600; margin: 8px 0 4px">脚本大纲：</p>
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(item, i) in video.remake.script_outline" :key="i">{{ item }}</li>
          </ul>
        </div>
        <div v-if="video.remake.shot_list?.length">
          <p style="font-weight: 600; margin: 8px 0 4px">分镜列表：</p>
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(item, i) in video.remake.shot_list" :key="i">{{ item }}</li>
          </ul>
        </div>
        <div v-if="video.remake.ai_image_prompts?.length">
          <p style="font-weight: 600; margin: 8px 0 4px">AI 图片提示词：</p>
          <el-collapse>
            <el-collapse-item v-for="(prompt, i) in video.remake.ai_image_prompts" :key="'img'+i" :title="`第 ${i+1} 组`">
              <pre style="white-space: pre-wrap; font-size: 12px; background: #f5f6fa; padding: 8px; border-radius: 4px">{{ prompt }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>

      <!-- Full Analysis MD -->
      <el-card v-if="video.analysis_md" shadow="hover" header="完整分析" style="border-radius: 10px; margin-bottom: 16px">
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; max-height: 600px; overflow-y: auto">
          {{ video.analysis_md }}
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchHooks } from '../api'
import type { HookItem } from '../types'
import TagCloud from '../components/TagCloud.vue'

const hooksData = ref<{ version: string; hooks: HookItem[] } | null>(null)
const loading = ref(true)
const searchText = ref('')
const filterType = ref('')
const filterRisk = ref('')

onMounted(async () => {
  try {
    hooksData.value = await fetchHooks()
  } finally {
    loading.value = false
  }
})

const filteredHooks = computed(() => {
  let list = hooksData.value?.hooks || []
  if (searchText.value) {
    const s = searchText.value.toLowerCase()
    list = list.filter(h =>
      h.name.toLowerCase().includes(s) ||
      h.search_text?.toLowerCase().includes(s) ||
      h.pattern?.toLowerCase().includes(s)
    )
  }
  if (filterType.value) {
    list = list.filter(h => h.hook_type === filterType.value)
  }
  if (filterRisk.value) {
    list = list.filter(h => h.risk_level === filterRisk.value)
  }
  return list
})

const allTypes = computed(() => [...new Set((hooksData.value?.hooks || []).map(h => h.hook_type).filter(Boolean))])

function riskColor(level: string) {
  if (level === 'low') return '#67c23a'
  if (level === 'medium') return '#e6a23c'
  return '#f56c6c'
}

function riskLabel(level: string) {
  if (level === 'low') return '低风险'
  if (level === 'medium') return '中风险'
  return '高风险'
}
</script>

<template>
  <div v-loading="loading">
    <h2 style="margin: 0 0 20px; font-size: 20px; color: #303133">
      钩子库
      <el-tag v-if="hooksData" size="small" type="info" style="margin-left: 8px">v{{ hooksData.version }}</el-tag>
    </h2>

    <el-row :gutter="12" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-input v-model="searchText" placeholder="搜索钩子..." clearable />
      </el-col>
      <el-col :span="4">
        <el-select v-model="filterType" placeholder="钩子类型" clearable>
          <el-option v-for="t in allTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-select v-model="filterRisk" placeholder="风险级别" clearable>
          <el-option label="低风险" value="low" />
          <el-option label="中风险" value="medium" />
          <el-option label="高风险" value="high" />
        </el-select>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col v-for="hook in filteredHooks" :key="hook.hook_id" :span="12" style="margin-bottom: 16px">
        <el-card shadow="hover" style="border-radius: 10px; height: 100%">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: 600">{{ hook.name }}</span>
              <el-tag
                :color="riskColor(hook.risk_level)"
                effect="dark"
                size="small"
                style="color: #fff"
              >
                {{ riskLabel(hook.risk_level) }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="类型">{{ hook.hook_type }}</el-descriptions-item>
            <el-descriptions-item label="副类型">
              <TagCloud :tags="hook.secondary_types || []" type="info" />
            </el-descriptions-item>
            <el-descriptions-item label="模式" :span="2">{{ hook.pattern }}</el-descriptions-item>
            <el-descriptions-item v-if="hook.opening_script" label="开场脚本" :span="2">
              {{ hook.opening_script }}
            </el-descriptions-item>
            <el-descriptions-item label="前3秒视觉" :span="2">
              {{ hook.first_3s?.visual || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="前3秒口播" :span="2">
              {{ hook.first_3s?.speech_or_text || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="适用品类" :span="2">
              <el-tag v-for="bf in hook.best_for" :key="bf" size="small" type="success" style="margin: 2px">{{ bf }}</el-tag>
              <span v-if="!hook.best_for?.length" style="color: #c0c4cc">通用</span>
            </el-descriptions-item>
            <el-descriptions-item v-if="hook.score?.overall" label="综合评分">
              {{ hook.score.overall }}
            </el-descriptions-item>
            <el-descriptions-item v-if="hook.score?.retention" label="留存力">
              {{ hook.score.retention }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="hook.why_it_stops_scroll?.length" style="margin-top: 12px">
            <p style="font-size: 13px; color: #909399; margin-bottom: 4px">停留原因：</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px">
              <li v-for="reason in hook.why_it_stops_scroll" :key="reason">{{ reason }}</li>
            </ul>
          </div>

          <div v-if="hook.example_lines?.length" style="margin-top: 12px">
            <p style="font-size: 13px; color: #909399; margin-bottom: 4px">话术示例：</p>
            <el-tag v-for="(line, i) in hook.example_lines" :key="i" size="small" style="margin: 2px; max-width: 100%; white-space: normal; height: auto">
              {{ line }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

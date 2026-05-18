<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import StatsCard from '../components/StatsCard.vue'
import { fetchStats } from '../api'
import type { DashboardStats } from '../types'

use([BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    stats.value = await fetchStats()
  } finally {
    loading.value = false
  }
})

function scoreBarOption(s: DashboardStats) {
  const data = s.scoreDistribution
  return {
    tooltip: {},
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: Object.keys(data) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: Object.values(data),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }
}

function categoryPieOption(s: DashboardStats) {
  const entries = Object.entries(s.categories).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: entries.map(([name, value]) => ({ name, value })),
      label: { show: false }
    }]
  }
}

function hookTypePieOption(s: DashboardStats) {
  const entries = Object.entries(s.hookTypes).filter(([k]) => k).sort((a, b) => b[1] - a[1]).slice(0, 8)
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: entries.map(([name, value]) => ({ name, value })),
      label: { show: false }
    }]
  }
}
</script>

<template>
  <div v-loading="loading">
    <h2 style="margin: 0 0 20px; font-size: 20px; color: #303133">仪表盘</h2>
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <StatsCard title="视频分析总数" :value="stats?.totalVideos || 0" icon="VideoCamera" />
      </el-col>
      <el-col :span="6">
        <StatsCard title="钩子库" :value="stats?.totalHooks || 0" icon="Connection" />
      </el-col>
      <el-col :span="6">
        <StatsCard title="项目数" :value="stats?.totalProjects || 0" icon="FolderOpened" />
      </el-col>
      <el-col :span="6">
        <StatsCard title="平均评分" :value="stats?.avgScore || 0" icon="TrendCharts" />
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card shadow="hover" header="评分分布" style="border-radius: 10px">
          <VChart v-if="stats" :option="scoreBarOption(stats)" style="height: 250px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" header="品类分布 (Top 10)" style="border-radius: 10px">
          <VChart v-if="stats" :option="categoryPieOption(stats)" style="height: 250px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover" header="钩子类型分布" style="border-radius: 10px">
          <VChart v-if="stats" :option="hookTypePieOption(stats)" style="height: 250px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" header="快捷入口" style="border-radius: 10px">
          <div style="display: flex; flex-direction: column; gap: 12px; padding: 12px 0">
            <el-button type="primary" @click="$router.push('/vault')" style="height: 48px">
              <el-icon><Search /></el-icon> 浏览视频分析库 ({{ stats?.totalVideos || 0 }} 条)
            </el-button>
            <el-button @click="$router.push('/hooks')" style="height: 48px">
              <el-icon><Connection /></el-icon> 查看钩子库 ({{ stats?.totalHooks || 0 }} 个)
            </el-button>
            <el-button type="success" @click="$router.push('/projects')" style="height: 48px">
              <el-icon><FolderOpened /></el-icon> 查看项目 ({{ stats?.totalProjects || 0 }} 个)
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, RadarComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([RadarChart, TitleComponent, TooltipComponent, LegendComponent, RadarComponent, CanvasRenderer])

const props = defineProps<{
  scores: {
    retention: number
    clarity: number
    trust: number
    product_display: number
    purchase_impulse: number
  }
}>()

const option = computed(() => ({
  tooltip: {},
  radar: {
    indicator: [
      { name: '留存力', max: 10 },
      { name: '清晰度', max: 10 },
      { name: '信任度', max: 10 },
      { name: '产品展示', max: 10 },
      { name: '购买冲动', max: 10 }
    ],
    radius: '65%',
    center: ['50%', '55%']
  },
  series: [{
    type: 'radar',
    data: [{
      value: [
        props.scores.retention,
        props.scores.clarity,
        props.scores.trust,
        props.scores.product_display,
        props.scores.purchase_impulse
      ],
      name: '评分',
      areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
      lineStyle: { color: '#667eea', width: 2 },
      itemStyle: { color: '#667eea' }
    }]
  }]
}))
</script>

<template>
  <VChart :option="option" style="height: 300px" autoresize />
</template>

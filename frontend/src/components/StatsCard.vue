<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  trend?: string
}>()
</script>

<template>
  <el-card shadow="hover" class="stats-card">
    <div class="stats-inner">
      <div class="stats-info">
        <p class="stats-title">{{ title }}</p>
        <p class="stats-value">{{ value }}</p>
        <p v-if="trend" class="stats-trend">{{ trend }}</p>
      </div>
      <div class="stats-icon">
        <el-icon :size="28"><component :is="icon" /></el-icon>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.stats-card {
  border-radius: 10px;
}
.stats-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stats-title {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.stats-value {
  margin: 6px 0 2px;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}
.stats-trend {
  margin: 0;
  font-size: 12px;
  color: #67c23a;
}
.stats-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2ff;
  border-radius: 12px;
  color: #667eea;
}
</style>

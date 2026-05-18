<script setup lang="ts">
defineProps<{
  tags: string[]
  type?: '' | 'success' | 'warning' | 'danger' | 'info'
}>()
</script>

<template>
  <div class="tag-cloud">
    <el-tag
      v-for="tag in tags"
      :key="tag"
      :type="type || 'info'"
      size="small"
      style="margin: 2px"
    >
      {{ tag }}
    </el-tag>
    <span v-if="!tags || tags.length === 0" style="color: #c0c4cc; font-size: 13px">无</span>
  </div>
</template>

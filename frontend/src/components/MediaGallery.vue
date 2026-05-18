<script setup lang="ts">
defineProps<{
  files: string[]
  projectId: string
}>()

function getMediaUrl(projectId: string, file: string) {
  return `/api/projects/${projectId}/media/${encodeURIComponent(file)}`
}

function isVideo(file: string) {
  return file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
}

function isImage(file: string) {
  return file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp')
}
</script>

<template>
  <div class="media-gallery">
    <div v-if="!files || files.length === 0" style="color: #c0c4cc; padding: 20px; text-align: center">
      暂无媒体文件
    </div>
    <div v-for="file in files" :key="file" class="media-item">
      <template v-if="isVideo(file)">
        <video :src="getMediaUrl(projectId, file)" controls style="width: 100%; border-radius: 6px" />
      </template>
      <template v-else-if="isImage(file)">
        <el-image
          :src="getMediaUrl(projectId, file)"
          :preview-src-list="[getMediaUrl(projectId, file)]"
          fit="cover"
          style="width: 100%; border-radius: 6px"
        />
      </template>
      <p class="media-name">{{ file }}</p>
    </div>
  </div>
</template>

<style scoped>
.media-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.media-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.media-name {
  margin: 0;
  padding: 8px 12px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}
</style>

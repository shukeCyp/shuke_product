<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchVaultVideos, fetchFilters } from '../api'
import type { VideoAnalysis } from '../types'
import TagCloud from '../components/TagCloud.vue'

const router = useRouter()
const videos = ref<VideoAnalysis[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)

const search = ref('')
const filterCategory = ref('')
const filterHookType = ref('')
const filterRiskLevel = ref('')
const filterPlatform = ref('')
const filterHookTag = ref('')
const filterVideoType = ref('')
const sortBy = ref('total')
const sortOrder = ref('desc')

const filterOptions = ref<Record<string, string[]>>({})

onMounted(async () => {
  filterOptions.value = await fetchFilters()
  loadVideos()
})

watch([page, sortBy, sortOrder], () => loadVideos())

function loadVideos() {
  loading.value = true
  const params: Record<string, string | number> = {
    page: page.value,
    pageSize: pageSize.value,
    search: search.value,
    sort: sortBy.value,
    order: sortOrder.value
  }
  if (filterCategory.value) params.category = filterCategory.value
  if (filterHookType.value) params.hook_type = filterHookType.value
  if (filterRiskLevel.value) params.risk_level = filterRiskLevel.value
  if (filterPlatform.value) params.platform = filterPlatform.value
  if (filterHookTag.value) params.hook_tag = filterHookTag.value
  if (filterVideoType.value) params.video_type = filterVideoType.value

  fetchVaultVideos(params).then(res => {
    videos.value = res.data
    total.value = res.total
  }).finally(() => {
    loading.value = false
  })
}

function onSearch() {
  page.value = 1
  loadVideos()
}

function onFilterChange() {
  page.value = 1
  loadVideos()
}

function viewDetail(videoId: string) {
  router.push(`/vault/${videoId}`)
}

function scoreType(score: number) {
  if (score >= 8) return 'success'
  if (score >= 6) return 'warning'
  return 'danger'
}
</script>

<template>
  <div>
    <h2 style="margin: 0 0 20px; font-size: 20px; color: #303133">视频分析库</h2>

    <!-- Search & Filters -->
    <el-card shadow="hover" style="border-radius: 10px; margin-bottom: 16px">
      <el-row :gutter="12" align="middle">
        <el-col :span="6">
          <el-input v-model="search" placeholder="搜索产品、品类..." clearable @clear="onSearch" @keyup.enter="onSearch">
            <template #append>
              <el-button @click="onSearch"><el-icon><Search /></el-icon></el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterCategory" placeholder="品类" clearable @change="onFilterChange">
            <el-option v-for="c in filterOptions.categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filterHookTag" placeholder="钩子" clearable @change="onFilterChange">
            <el-option v-for="h in filterOptions.hookTags" :key="h" :label="h" :value="h" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filterVideoType" placeholder="视频类型" clearable @change="onFilterChange">
            <el-option v-for="v in filterOptions.videoTypes" :key="v" :label="v" :value="v" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filterRiskLevel" placeholder="风险" clearable @change="onFilterChange">
            <el-option v-for="r in filterOptions.riskTags" :key="r" :label="r" :value="r" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filterPlatform" placeholder="平台" clearable @change="onFilterChange">
            <el-option v-for="p in filterOptions.platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-col>
        <el-col :span="2">
          <el-select v-model="sortBy" placeholder="排序">
            <el-option label="总分" value="total" />
            <el-option label="留存" value="retention" />
            <el-option label="信任" value="trust" />
            <el-option label="日期" value="date" />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- Table -->
    <el-card shadow="hover" style="border-radius: 10px">
      <el-table :data="videos" v-loading="loading" stripe @row-click="(row: VideoAnalysis) => viewDetail(row.video_id)" style="cursor: pointer">
        <el-table-column prop="product.category" label="品类" width="120" />
        <el-table-column prop="product.name" label="产品名" width="140">
          <template #default="{ row }">
            <span v-if="row.product?.name && row.product.name !== '未知'">{{ row.product.name }}</span>
            <span v-else style="color: #c0c4cc">未知</span>
          </template>
        </el-table-column>
        <el-table-column label="钩子类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.hook?.type" size="small">{{ row.hook.type }}</el-tag>
            <span v-else style="color: #c0c4cc">未知</span>
          </template>
        </el-table-column>
        <el-table-column label="钩子标签" min-width="240">
          <template #default="{ row }">
            <TagCloud :tags="row.tags?.hook_tags" />
          </template>
        </el-table-column>
        <el-table-column label="视频类型" min-width="240">
          <template #default="{ row }">
            <TagCloud :tags="row.tags?.video_type_tags" type="success" />
          </template>
        </el-table-column>
        <el-table-column label="风险" width="180">
          <template #default="{ row }">
            <TagCloud :tags="row.tags?.risk_tags" type="danger" />
          </template>
        </el-table-column>
        <el-table-column prop="scores.total" label="总分" width="80" sortable>
          <template #default="{ row }">
            <el-tag :type="scoreType(row.scores?.total || 0)" effect="dark" size="small">
              {{ row.scores?.total || '-' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div style="display: flex; justify-content: center; margin-top: 16px">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>
  </div>
</template>

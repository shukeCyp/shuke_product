<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchConfig, fetchConfigRaw, updateConfig } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const config = ref<Record<string, unknown>>({})
const rawYaml = ref('')
const loading = ref(true)
const showKeys = ref(false)
const rawEditing = ref(false)

onMounted(async () => {
  await loadConfig()
})

async function loadConfig() {
  loading.value = true
  try {
    const [cfg, raw] = await Promise.all([fetchConfig(), fetchConfigRaw()])
    config.value = cfg
    rawYaml.value = raw.raw
  } finally {
    loading.value = false
  }
}

async function toggleShowKeys() {
  if (!showKeys.value) {
    ElMessageBox.confirm('API Key 是敏感信息，确定要显示吗？', '警告', {
      confirmButtonText: '确定显示',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      loadRawConfig()
      showKeys.value = true
    }).catch(() => {})
  } else {
    const cfg = await fetchConfig()
    config.value = cfg
    showKeys.value = false
    rawEditing.value = false
  }
}

async function loadRawConfig() {
  const raw = await fetchConfigRaw()
  rawYaml.value = raw.raw
}

function startEdit() {
  rawEditing.value = true
}

function cancelEdit() {
  rawEditing.value = false
  loadRawConfig()
}

async function saveEdit() {
  try {
    await updateConfig(rawYaml.value)
    ElMessage.success('配置已保存')
    rawEditing.value = false
    await loadConfig()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '保存失败')
  }
}

function configKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).filter(k => typeof obj[k] === 'object' && obj[k] !== null)
}
</script>

<template>
  <div v-loading="loading">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2 style="margin: 0; font-size: 20px; color: #303133">配置管理</h2>
      <div>
        <el-button @click="toggleShowKeys" :type="showKeys ? 'warning' : 'info'" size="small">
          <el-icon><View /></el-icon>
          {{ showKeys ? '隐藏 Key' : '显示 Key' }}
        </el-button>
        <el-button v-if="showKeys && !rawEditing" @click="startEdit" type="primary" size="small" style="margin-left: 8px">
          <el-icon><Edit /></el-icon> 编辑
        </el-button>
        <el-button v-if="rawEditing" @click="cancelEdit" size="small" style="margin-left: 8px">取消</el-button>
        <el-button v-if="rawEditing" @click="saveEdit" type="success" size="small" style="margin-left: 8px">
          <el-icon><Check /></el-icon> 保存
        </el-button>
      </div>
    </div>

    <!-- YAML Editor -->
    <el-card v-if="rawEditing" shadow="hover" header="编辑 media_services.yaml" style="border-radius: 10px; margin-bottom: 16px">
      <el-input
        v-model="rawYaml"
        type="textarea"
        :rows="25"
        style="font-family: monospace; font-size: 13px"
      />
    </el-card>

    <!-- Service Cards -->
    <el-row :gutter="16">
      <el-col v-for="key in configKeys(config)" :key="key" :span="12" style="margin-bottom: 16px">
        <el-card shadow="hover" :header="key" style="border-radius: 10px">
          <el-descriptions :column="1" size="small" border>
            <template v-for="(val, subKey) in config[key] as Record<string, unknown>" :key="String(subKey)">
              <el-descriptions-item
                v-if="typeof val !== 'object' || val === null"
                :label="String(subKey)"
              >
                <template v-if="String(subKey).includes('key') || String(subKey).includes('Key')">
                  <code>{{ val || '(未设置)' }}</code>
                </template>
                <template v-else>
                  {{ val }}
                </template>
              </el-descriptions-item>
            </template>
          </el-descriptions>
          <template v-if="config[key] && typeof config[key] === 'object'">
            <div v-for="(innerVal, innerKey) in config[key] as Record<string, unknown>" :key="String(innerKey)">
              <template v-if="typeof innerVal === 'object' && innerVal !== null && !String(innerKey).includes('key')">
                <p style="font-size: 13px; font-weight: 600; margin: 12px 0 4px; color: #606266">{{ innerKey }}</p>
                <el-descriptions :column="1" size="small" border>
                  <el-descriptions-item
                    v-for="(v, k) in innerVal as Record<string, unknown>"
                    :key="String(k)"
                    :label="String(k)"
                  >
                    <template v-if="String(k).includes('key') || String(k).includes('Key')">
                      <code>{{ v || '(未设置)' }}</code>
                    </template>
                    <template v-else>
                      {{ v }}
                    </template>
                  </el-descriptions-item>
                </el-descriptions>
              </template>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

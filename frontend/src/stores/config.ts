import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  const config = ref<Record<string, unknown>>({})
  const rawYaml = ref('')
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const { fetchConfig, fetchConfigRaw } = await import('../api')
      config.value = await fetchConfig()
      const { raw } = await fetchConfigRaw()
      rawYaml.value = raw
    } finally {
      loading.value = false
    }
  }

  async function save(raw: string) {
    const { updateConfig } = await import('../api')
    await updateConfig(raw)
    rawYaml.value = raw
  }

  return { config, rawYaml, loading, load, save }
})

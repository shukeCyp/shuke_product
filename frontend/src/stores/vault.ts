import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVaultStore = defineStore('vault', () => {
  const filters = ref<Record<string, string[]>>({})
  const loading = ref(false)

  async function loadFilters() {
    const { fetchFilters } = await import('../api')
    filters.value = await fetchFilters()
  }

  return { filters, loading, loadFilters }
})

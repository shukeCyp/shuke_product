import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectItem } from '../types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<ProjectItem[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const { fetchProjects } = await import('../api')
      projects.value = await fetchProjects()
    } finally {
      loading.value = false
    }
  }

  return { projects, loading, load }
})

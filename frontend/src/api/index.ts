import axios from 'axios'
import type { DashboardStats, VideoAnalysis, HookItem, ProjectItem, ProjectDetail } from '../types'

const api = axios.create({ baseURL: '/api' })

// Stats
export const fetchStats = () => api.get<DashboardStats>('/stats').then(r => r.data)

// Config
export const fetchConfig = () => api.get('/config').then(r => r.data)
export const fetchConfigRaw = () => api.get<{ raw: string }>('/config/raw').then(r => r.data)
export const updateConfig = (raw: string) => api.put('/config', { raw }).then(r => r.data)

// Vault
export const fetchVaultVideos = (params: Record<string, string | number>) =>
  api.get<{ data: VideoAnalysis[]; total: number; page: number; pageSize: number }>('/vault/videos', { params }).then(r => r.data)

export const fetchVideoDetail = (id: string) =>
  api.get<VideoAnalysis>(`/vault/videos/${id}`).then(r => r.data)

export const fetchFilters = () =>
  api.get('/vault/filters').then(r => r.data)

export const fetchTagsDistribution = () =>
  api.get('/vault/tags-distribution').then(r => r.data)

// Hooks
export const fetchHooks = () =>
  api.get<{ version: string; hooks: HookItem[] }>('/vault/hooks').then(r => r.data)

export const fetchHookDetail = (id: string) =>
  api.get<HookItem>(`/vault/hooks/${id}`).then(r => r.data)

// Projects
export const fetchProjects = () =>
  api.get<ProjectItem[]>('/projects').then(r => r.data)

export const fetchProjectDetail = (id: string) =>
  api.get<ProjectDetail>(`/projects/${id}`).then(r => r.data)

export const getMediaUrl = (projectId: string, file: string) =>
  `/api/projects/${projectId}/media/${encodeURIComponent(file)}`

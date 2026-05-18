export interface VideoAnalysis {
  video_id: string
  source: {
    video_path: string
    analysis_path: string
    model: string
    duration_seconds: number
    created_at: string
  }
  product: {
    name: string
    category: string
    sub_category: string
    price_position: string
    target_audience: string[]
    confidence: number
  }
  tags: {
    product_tags: string[]
    video_type_tags: string[]
    hook_tags: string[]
    proof_tags: string[]
    audience_tags: string[]
    risk_tags: string[]
    platform_tags: string[]
  }
  hook: {
    type: string
    first_3s_text: string
    mechanism: string
    retention_score: number
  }
  selling_points: string[]
  proof_points: string[]
  cta: {
    text: string
    clarity: string
  }
  scores: {
    retention: number
    clarity: number
    trust: number
    product_display: number
    purchase_impulse: number
    total: number
  }
  remake: {
    angle: string
    script_outline: string[]
    shot_list: string[]
    voiceover: string
    subtitles: string[]
    ai_image_prompts: string[]
    ai_video_prompts: string[]
  }
  search_text: string
  analysis_md?: string
}

export interface HookItem {
  hook_id: string
  name: string
  status?: string
  source?: object
  hook_type: string
  secondary_types?: string[]
  pattern: string
  opening_script?: string
  first_3s: {
    visual?: string
    speech_or_text?: string
    emotion?: string
  }
  why_it_stops_scroll?: string[]
  best_for: string[]
  avoid_for?: string[]
  risk_level: 'low' | 'medium' | 'high'
  risk_notes?: string[]
  safer_variants?: string[]
  remake_formula?: string[]
  example_lines?: string[]
  score?: {
    retention?: number
    conversion_fit?: number
    trust?: number
    platform_safety?: number
    overall?: number
  }
  search_text: string
}

export interface ProjectItem {
  id: string
  slug: string
  timestamp: string
  hasScript: boolean
  refs: Record<string, unknown>
  mediaCount: number
  mediaFiles: string[]
  status: string
}

export interface ProjectDetail {
  id: string
  refs: Record<string, unknown>
  script: string
  prompts: Record<string, unknown>
  analysis: string
  foundation: string
  mediaFiles: string[]
  refImages: string[]
}

export interface DashboardStats {
  totalVideos: number
  totalHooks: number
  totalProjects: number
  avgScore: number
  categories: Record<string, number>
  hookTypes: Record<string, number>
  videoTypes: Record<string, number>
  riskTags: Record<string, number>
  scoreDistribution: Record<string, number>
}

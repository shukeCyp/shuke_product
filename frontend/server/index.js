import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'
import os from 'os'
import { createReadStream } from 'fs'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Resolve paths relative to project root
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const SKILLS_DIR = path.join(PROJECT_ROOT, 'skills', 'shuke-product')
const CONFIG_PATH = path.join(SKILLS_DIR, 'config', 'media_services.yaml')
const CONFIG_EXAMPLE_PATH = path.join(SKILLS_DIR, 'config', 'media_services.example.yaml')
const VAULT_DIR = path.join(SKILLS_DIR, 'vault')
const INDEX_PATH = path.join(VAULT_DIR, 'index', 'videos.jsonl')
const TAGS_DIR = path.join(VAULT_DIR, 'tags')
const ANALYSES_DIR = path.join(VAULT_DIR, 'analyses')
const HOOKS_PATH = path.join(VAULT_DIR, 'hooks', 'hooks.json')
const PRODUCT_DIR = path.join(os.homedir(), 'Downloads', 'product')

// Helper: read YAML config
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8')
      const parsed = yaml.load(content)
      // Mask API keys for safe display
      return maskApiKeys(parsed)
    } else if (fs.existsSync(CONFIG_EXAMPLE_PATH)) {
      const content = fs.readFileSync(CONFIG_EXAMPLE_PATH, 'utf-8')
      return yaml.load(content)
    }
    return null
  } catch (e) {
    console.error('Error reading config:', e.message)
    return null
  }
}

function readConfigRaw() {
  if (fs.existsSync(CONFIG_PATH)) {
    return fs.readFileSync(CONFIG_PATH, 'utf-8')
  } else if (fs.existsSync(CONFIG_EXAMPLE_PATH)) {
    return fs.readFileSync(CONFIG_EXAMPLE_PATH, 'utf-8')
  }
  return ''
}

function maskApiKeys(config) {
  if (!config) return config
  const masked = JSON.parse(JSON.stringify(config))
  const keysToMask = ['api_key', 'api_key_image', 'api_key_video']
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      if (keysToMask.includes(key) && typeof obj[key] === 'string' && obj[key].length > 4) {
        obj[key] = obj[key].substring(0, 4) + '***' + obj[key].substring(obj[key].length - 4)
      } else if (typeof obj[key] === 'object') {
        walk(obj[key])
      }
    }
  }
  walk(masked)
  return masked
}

// Helper: load video index from JSONL
async function loadVideoIndex(filter = {}, search = '') {
  const videos = []
  if (!fs.existsSync(INDEX_PATH)) return videos

  const rl = readline.createInterface({
    input: createReadStream(INDEX_PATH),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      // Load corresponding tag file for richer data
      const tagFile = path.join(TAGS_DIR, `${entry.video_id}.json`)
      if (fs.existsSync(tagFile)) {
        const tagData = JSON.parse(fs.readFileSync(tagFile, 'utf-8'))
        Object.assign(entry, tagData)
      }

      // Apply filters
      if (filter.category && entry.product?.category !== filter.category) continue
      if (filter.hook_type && entry.hook?.type !== filter.hook_type) continue
      if (filter.risk_level && !entry.tags?.risk_tags?.includes(filter.risk_level)) continue
      if (filter.platform && !entry.tags?.platform_tags?.includes(filter.platform)) continue
      if (filter.score_min && entry.scores?.total < parseFloat(filter.score_min)) continue
      if (filter.score_max && entry.scores?.total > parseFloat(filter.score_max)) continue
      if (filter.hook_tag && !entry.tags?.hook_tags?.includes(filter.hook_tag)) continue
      if (filter.video_type && !entry.tags?.video_type_tags?.includes(filter.video_type)) continue

      // Apply search
      if (search) {
        const searchLower = search.toLowerCase()
        const searchText = entry.search_text?.toLowerCase() || ''
        const productName = entry.product?.name?.toLowerCase() || ''
        const category = entry.product?.category?.toLowerCase() || ''
        if (!searchText.includes(searchLower) &&
            !productName.includes(searchLower) &&
            !category.includes(searchLower)) continue
      }

      videos.push(entry)
    } catch (e) {
      // skip malformed lines
    }
  }
  return videos
}

// Helper: list product projects
function listProjects() {
  const projects = []
  if (!fs.existsSync(PRODUCT_DIR)) return projects

  const projectsJsonPath = path.join(PRODUCT_DIR, 'projects.json')
  let projectsIndex = {}
  if (fs.existsSync(projectsJsonPath)) {
    try {
      projectsIndex = JSON.parse(fs.readFileSync(projectsJsonPath, 'utf-8'))
    } catch (e) { /* ignore */ }
  }

  const entries = fs.readdirSync(PRODUCT_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const projectDir = path.join(PRODUCT_DIR, entry.name)
    const refsPath = path.join(projectDir, 'references.json')
    const scriptPath = path.join(projectDir, 'script.md')
    const mediaDir = path.join(projectDir, 'generated_media')

    let refs = {}
    if (fs.existsSync(refsPath)) {
      try { refs = JSON.parse(fs.readFileSync(refsPath, 'utf-8')) } catch (e) { /* ignore */ }
    }

    let mediaCount = 0
    const mediaFiles = []
    if (fs.existsSync(mediaDir)) {
      const files = fs.readdirSync(mediaDir)
      mediaFiles.push(...files)
      mediaCount = files.length
    }

    // Parse timestamp and slug from folder name
    const match = entry.name.match(/^(\d{8})_(\d{6})_(.+)$/)
    const timestamp = match ? `${match[1]}_${match[2]}` : ''
    const slug = match ? match[3] : entry.name

    projects.push({
      id: entry.name,
      slug,
      timestamp,
      hasScript: fs.existsSync(scriptPath),
      refs,
      mediaCount,
      mediaFiles,
      status: refs.status || (mediaCount > 0 ? 'completed' : 'in_progress')
    })
  }

  // Sort by timestamp descending
  projects.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return projects
}

// ============ API Routes ============

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const allVideos = await loadVideoIndex()
    const hooks = fs.existsSync(HOOKS_PATH)
      ? JSON.parse(fs.readFileSync(HOOKS_PATH, 'utf-8'))
      : { hooks: [] }
    const projects = listProjects()

    const scores = allVideos.map(v => v.scores?.total || 0).filter(s => s > 0)
    const avgScore = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : 0

    // Category distribution
    const categories = {}
    const hookTypes = {}
    const videoTypes = {}
    const riskTags = {}
    for (const v of allVideos) {
      const cat = v.product?.category || '未知'
      categories[cat] = (categories[cat] || 0) + 1
      const ht = v.hook?.type || '未知'
      hookTypes[ht] = (hookTypes[ht] || 0) + 1
      for (const vt of v.tags?.video_type_tags || []) {
        videoTypes[vt] = (videoTypes[vt] || 0) + 1
      }
      for (const rt of v.tags?.risk_tags || []) {
        riskTags[rt] = (riskTags[rt] || 0) + 1
      }
    }

    // Score distribution
    const scoreDistribution = { '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 }
    for (const s of scores) {
      if (s < 2) scoreDistribution['0-2']++
      else if (s < 4) scoreDistribution['2-4']++
      else if (s < 6) scoreDistribution['4-6']++
      else if (s < 8) scoreDistribution['6-8']++
      else scoreDistribution['8-10']++
    }

    res.json({
      totalVideos: allVideos.length,
      totalHooks: hooks.hooks?.length || 0,
      totalProjects: projects.length,
      avgScore: parseFloat(avgScore),
      categories,
      hookTypes,
      videoTypes,
      riskTags,
      scoreDistribution
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Config
app.get('/api/config', (req, res) => {
  try {
    const masked = readConfig()
    res.json(masked || {})
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/config/raw', (req, res) => {
  try {
    const raw = readConfigRaw()
    res.json({ raw })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/config', (req, res) => {
  try {
    const newContent = req.body.raw
    if (!newContent || typeof newContent !== 'string') {
      return res.status(400).json({ error: 'raw content required' })
    }
    // Validate YAML
    yaml.load(newContent)
    fs.writeFileSync(CONFIG_PATH, newContent, 'utf-8')
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Vault videos
app.get('/api/vault/videos', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search = '', sort = 'total', order = 'desc', ...filters } = req.query
    let videos = await loadVideoIndex(filters, search)

    // Sort
    videos.sort((a, b) => {
      let valA, valB
      switch (sort) {
        case 'total': valA = a.scores?.total || 0; valB = b.scores?.total || 0; break
        case 'retention': valA = a.scores?.retention || 0; valB = b.scores?.retention || 0; break
        case 'trust': valA = a.scores?.trust || 0; valB = b.scores?.trust || 0; break
        case 'date': valA = a.source?.created_at || ''; valB = b.source?.created_at || ''; break
        default: valA = a.scores?.total || 0; valB = b.scores?.total || 0
      }
      return order === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
    })

    const total = videos.length
    const start = (parseInt(page) - 1) * parseInt(pageSize)
    const paged = videos.slice(start, start + parseInt(pageSize))

    res.json({ data: paged, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/vault/videos/:id', async (req, res) => {
  try {
    const tagFile = path.join(TAGS_DIR, `${req.params.id}.json`)
    const analysisDir = path.join(ANALYSES_DIR, req.params.id)
    const analysisFile = path.join(analysisDir, 'analysis.md')

    if (!fs.existsSync(tagFile)) {
      return res.status(404).json({ error: 'Video not found' })
    }

    const tagData = JSON.parse(fs.readFileSync(tagFile, 'utf-8'))
    let analysisMd = ''
    if (fs.existsSync(analysisFile)) {
      analysisMd = fs.readFileSync(analysisFile, 'utf-8')
    }

    res.json({ ...tagData, analysis_md: analysisMd })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Filter options
app.get('/api/vault/filters', async (req, res) => {
  try {
    const allVideos = await loadVideoIndex()
    const categories = new Set()
    const hookTypesSet = new Set()
    const hookTags = new Set()
    const videoTypes = new Set()
    const riskTags = new Set()
    const platforms = new Set()

    for (const v of allVideos) {
      if (v.product?.category) categories.add(v.product.category)
      if (v.hook?.type) hookTypesSet.add(v.hook.type)
      for (const t of v.tags?.hook_tags || []) hookTags.add(t)
      for (const t of v.tags?.video_type_tags || []) videoTypes.add(t)
      for (const t of v.tags?.risk_tags || []) riskTags.add(t)
      for (const t of v.tags?.platform_tags || []) platforms.add(t)
    }

    res.json({
      categories: [...categories].sort(),
      hookTypes: [...hookTypesSet].sort(),
      hookTags: [...hookTags].sort(),
      videoTypes: [...videoTypes].sort(),
      riskTags: [...riskTags].sort(),
      platforms: [...platforms].sort()
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Tag distribution for charts
app.get('/api/vault/tags-distribution', async (req, res) => {
  try {
    const allVideos = await loadVideoIndex()
    const videoTypeDistribution = {}
    const hookTagDistribution = {}
    const proofTagDistribution = {}
    const audienceDistribution = {}

    for (const v of allVideos) {
      for (const t of v.tags?.video_type_tags || []) {
        videoTypeDistribution[t] = (videoTypeDistribution[t] || 0) + 1
      }
      for (const t of v.tags?.hook_tags || []) {
        hookTagDistribution[t] = (hookTagDistribution[t] || 0) + 1
      }
      for (const t of v.tags?.proof_tags || []) {
        proofTagDistribution[t] = (proofTagDistribution[t] || 0) + 1
      }
      for (const t of v.tags?.audience_tags || []) {
        audienceDistribution[t] = (audienceDistribution[t] || 0) + 1
      }
    }

    res.json({
      videoTypeDistribution,
      hookTagDistribution,
      proofTagDistribution,
      audienceDistribution
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Hooks
app.get('/api/vault/hooks', (req, res) => {
  try {
    if (!fs.existsSync(HOOKS_PATH)) return res.json({ hooks: [] })
    const data = JSON.parse(fs.readFileSync(HOOKS_PATH, 'utf-8'))
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/vault/hooks/:id', (req, res) => {
  try {
    if (!fs.existsSync(HOOKS_PATH)) return res.status(404).json({ error: 'Not found' })
    const data = JSON.parse(fs.readFileSync(HOOKS_PATH, 'utf-8'))
    const hook = data.hooks?.find(h => h.hook_id === req.params.id)
    if (!hook) return res.status(404).json({ error: 'Hook not found' })
    res.json(hook)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = listProjects()
    res.json(projects)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/projects/:id', (req, res) => {
  try {
    const projectDir = path.join(PRODUCT_DIR, req.params.id)
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const refsPath = path.join(projectDir, 'references.json')
    const scriptPath = path.join(projectDir, 'script.md')
    const promptsPath = path.join(projectDir, 'prompts.json')
    const analysisPath = path.join(projectDir, 'product_analysis.md')
    const foundationPath = path.join(projectDir, '00_foundation_prompts.md')

    let refs = {}
    let script = ''
    let prompts = {}
    let analysis = ''
    let foundation = ''

    if (fs.existsSync(refsPath)) {
      try { refs = JSON.parse(fs.readFileSync(refsPath, 'utf-8')) } catch (e) { /* ignore */ }
    }
    if (fs.existsSync(scriptPath)) script = fs.readFileSync(scriptPath, 'utf-8')
    if (fs.existsSync(promptsPath)) {
      try { prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8')) } catch (e) { /* ignore */ }
    }
    if (fs.existsSync(analysisPath)) analysis = fs.readFileSync(analysisPath, 'utf-8')
    if (fs.existsSync(foundationPath)) foundation = fs.readFileSync(foundationPath, 'utf-8')

    const mediaDir = path.join(projectDir, 'generated_media')
    const mediaFiles = []
    if (fs.existsSync(mediaDir)) {
      mediaFiles.push(...fs.readdirSync(mediaDir))
    }

    const refsDir = path.join(projectDir, 'references')
    const refImages = []
    if (fs.existsSync(refsDir)) {
      refImages.push(...fs.readdirSync(refsDir))
    }

    res.json({
      id: req.params.id,
      refs,
      script,
      prompts,
      analysis,
      foundation,
      mediaFiles,
      refImages
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Serve media files
app.get('/api/projects/:id/media/:file', (req, res) => {
  const projectDir = path.join(PRODUCT_DIR, req.params.id)
  const mediaPath = path.join(projectDir, 'generated_media', req.params.file)
  if (fs.existsSync(mediaPath)) {
    res.sendFile(mediaPath)
  } else {
    // Try references dir
    const refPath = path.join(projectDir, 'references', req.params.file)
    if (fs.existsSync(refPath)) {
      res.sendFile(refPath)
    } else {
      res.status(404).json({ error: 'File not found' })
    }
  }
})

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})

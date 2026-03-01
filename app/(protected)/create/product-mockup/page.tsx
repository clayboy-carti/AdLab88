'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PhotoPicker from '@/components/create/PhotoPicker'
import {
  ImagePlus, ChevronDown, Monitor, Maximize2,
  CheckCircle, X, Film, FlaskConical,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const SCENE_PRESETS = [
  {
    name: 'Studio Product Shoot',
    description: 'The scene is a controlled studio environment with a seamless backdrop, professional softbox lighting, high dynamic range detail, sharp focus, minimal shadows, and a commercial product photography style.',
  },
  {
    name: 'White Infinity (White Abyss)',
    description: 'The subject exists in a pure white infinite void with no visible floor line, soft ambient lighting, a subtle grounding shadow beneath the subject, and a hyper-clean futuristic minimal aesthetic.',
  },
  {
    name: 'Black Void Luxury',
    description: 'The scene is a deep matte black environment with dramatic directional lighting, strong contrast, subtle rim lighting outlining the subject, and a high-end luxury commercial style.',
  },
  {
    name: 'Lifestyle – Natural Home',
    description: 'The subject is placed in a realistic lived-in home environment with natural window light, warm tones, depth of field, and an authentic lifestyle photography feel.',
  },
  {
    name: 'Outdoor Golden Hour',
    description: 'The scene is outdoors during golden hour with warm sunlight, soft lens flare, long shadows, cinematic color grading, and shallow depth of field.',
  },
  {
    name: 'Modern Minimal Interior',
    description: 'The subject is placed in a modern architectural interior with neutral tones, clean lines, soft indirect lighting, and a contemporary design aesthetic.',
  },
  {
    name: 'Industrial Warehouse',
    description: 'The scene is a large industrial warehouse with concrete floors, exposed beams, moody directional lighting, a gritty atmosphere, and dramatic shadows.',
  },
  {
    name: 'Street Editorial',
    description: 'The subject is captured in an urban street setting with natural light, real-world imperfections, shallow depth of field, and an editorial fashion photography vibe.',
  },
  {
    name: 'Cinematic Film Still',
    description: 'The scene is composed like a movie frame with cinematic lighting, intentional framing, cinematic color grading, dynamic composition, and subtle film grain texture.',
  },
  {
    name: 'Nature Minimal',
    description: 'The subject is placed in a minimal natural setting such as sand, stone, grass, or water with soft natural light and a calm grounded atmosphere.',
  },
  {
    name: 'Luxury Marble Pedestal',
    description: 'The subject is elevated on a marble or stone pedestal in a refined environment with soft studio lighting and a luxury cosmetic brand aesthetic.',
  },
  {
    name: 'Abstract Gradient Space',
    description: 'The background is a smooth abstract gradient with soft diffused lighting, minimal shadows, and a modern digital branding aesthetic.',
  },
  {
    name: 'High Fashion Runway',
    description: 'The subject is positioned in a high-end fashion runway environment with dramatic spotlighting, a dark background, and editorial photography styling.',
  },
  {
    name: 'Kitchen Counter Reality',
    description: 'The subject is placed naturally on a realistic kitchen counter with daylight illumination, subtle environmental details, and authentic candid product placement.',
  },
  {
    name: 'Glass Reflection Studio',
    description: 'The subject sits on a glossy reflective surface with a mirror-like floor reflection, professional studio lighting, and a premium commercial photography style.',
  },
  {
    name: 'Desert Landscape',
    description: 'The subject is positioned in an open desert landscape with bright sunlight, textured sand, an expansive horizon, and cinematic depth.',
  },
  {
    name: 'Moody Rain Scene',
    description: 'The environment includes light rainfall, wet reflective surfaces, cool tones, cinematic contrast, and atmospheric depth.',
  },
  {
    name: 'Soft Pastel Brand Space',
    description: 'The subject is placed in a soft pastel-toned environment with diffused lighting, clean surfaces, minimal shadows, and a modern brand photography aesthetic.',
  },
]

const PHOTO_SHOOT_SHOTS = [
  {
    label: 'Front Shot',
    directive: 'Straight-on, eye-level framing. 50mm lens perspective, f/8 deep focus, centered composition.',
  },
  {
    label: 'Three-Quarter',
    directive: '45-degree angle from front, slightly elevated. 50mm lens, f/5.6 aperture, slight depth separation between subject and background.',
  },
  {
    label: 'Overhead / Flat Lay',
    directive: 'Directly overhead, looking straight down. 35mm lens, f/11 deep focus, flat lay composition.',
  },
  {
    label: 'Close-Up Detail',
    directive: 'Tight macro close-up of the product. 100mm lens, f/2.8 shallow depth of field, soft bokeh background.',
  },
  {
    label: 'Environmental Wide',
    directive: 'Wide-angle view that shows the full scene and surrounding environment. 24mm lens, f/11 deep focus, expansive composition.',
  },
  {
    label: 'Low Angle Hero',
    directive: 'Camera at ground level pointing upward toward the subject. 35mm lens, f/4, dramatic upward perspective against the scene environment.',
  },
]

// Gemini 3 Pro Image Preview — full supported set (from API docs)
// 3:4 outputs 896×1200 (0.747) which is fractionally below Instagram's 0.75 floor.
// Use 4:5 (928×1152 = 0.806) for Instagram feed portrait with Gemini.
const GEMINI_ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1 — Square (Instagram)',          tooltip: 'Instagram Feed · Facebook · LinkedIn' },
  { value: '4:5',  label: '4:5 — Feed Portrait (Instagram)',   tooltip: 'Instagram Feed Portrait · Facebook' },
  { value: '4:3',  label: '4:3 — Standard',                   tooltip: 'Facebook · LinkedIn · Pinterest' },
  { value: '3:4',  label: '3:4 — Portrait',                   tooltip: 'Pinterest · Facebook · Print' },
  { value: '16:9', label: '16:9 — Landscape (Instagram)',      tooltip: 'YouTube · Twitter/X · LinkedIn · Facebook' },
  { value: '9:16', label: '9:16 — Story / Reel (Instagram)',   tooltip: 'Instagram Stories & Reels · TikTok · YouTube Shorts' },
  { value: '3:2',  label: '3:2 — Wide',                       tooltip: 'Twitter/X · Blog headers' },
  { value: '2:3',  label: '2:3 — Narrow',                     tooltip: 'Pinterest · Print' },
  { value: '5:4',  label: '5:4',                              tooltip: 'Facebook · Print' },
  { value: '21:9', label: '21:9 — Cinematic',                  tooltip: 'YouTube banners · Desktop headers' },
]

// Seedream 4 — valid enum values from Replicate API (no 4:5 or 5:4 support)
const SEEDREAM_ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1 — Square (Instagram)',        tooltip: 'Instagram Feed · Facebook · LinkedIn' },
  { value: '4:3',  label: '4:3 — Standard',                 tooltip: 'Facebook · LinkedIn · Pinterest' },
  { value: '3:4',  label: '3:4 — Portrait',                 tooltip: 'Pinterest · Facebook · Print' },
  { value: '16:9', label: '16:9 — Landscape (Instagram)',    tooltip: 'YouTube · Twitter/X · LinkedIn · Facebook' },
  { value: '9:16', label: '9:16 — Story / Reel (Instagram)', tooltip: 'Instagram Stories & Reels · TikTok · YouTube Shorts' },
  { value: '3:2',  label: '3:2 — Wide',                     tooltip: 'Twitter/X · Blog headers' },
  { value: '2:3',  label: '2:3 — Narrow',                   tooltip: 'Pinterest · Print' },
  { value: '21:9', label: '21:9 — Cinematic',                tooltip: 'YouTube banners · Desktop headers' },
]

interface GeneratedAd {
  id: string
  positioning_angle: string
  hook: string
  caption: string
  cta: string
  image_prompt: string
  framework_applied: string
  target_platform: string
  generatedImageUrl: string
  created_at: string
}

type ShootSlot = {
  shot: typeof PHOTO_SHOOT_SHOTS[number]
  ad: { id: string; generatedImageUrl: string } | null
  error: string | null
  loading: boolean
}

// ── Studio illustration for empty state ──────────────────────────────────────
function StudioIllustration() {
  return (
    <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Floor line */}
      <rect x="20" y="97" width="140" height="1.5" rx="1" fill="rgba(31,58,50,0.07)" />

      {/* Softbox light stand — right */}
      <line x1="148" y1="52" x2="148" y2="98" stroke="rgba(31,58,50,0.18)" strokeWidth="2" strokeLinecap="round" />
      <line x1="141" y1="98" x2="155" y2="98" stroke="rgba(31,58,50,0.18)" strokeWidth="2" strokeLinecap="round" />
      <rect x="133" y="32" width="30" height="22" rx="5" fill="rgba(31,58,50,0.05)" stroke="rgba(31,58,50,0.14)" strokeWidth="1.5" />
      <rect x="137" y="36" width="22" height="14" rx="3" fill="rgba(255,255,255,0.65)" />

      {/* Product pedestal */}
      <rect x="72" y="78" width="36" height="20" rx="3" fill="rgba(31,58,50,0.06)" stroke="rgba(31,58,50,0.09)" strokeWidth="1" />
      {/* Product box */}
      <rect x="78" y="54" width="24" height="26" rx="4" fill="rgba(31,58,50,0.05)" stroke="rgba(31,58,50,0.12)" strokeWidth="1.5" />
      {/* Highlight */}
      <rect x="81" y="57" width="8" height="8" rx="2" fill="rgba(255,255,255,0.55)" />

      {/* Camera + tripod — left */}
      <line x1="36" y1="64" x2="36" y2="98" stroke="rgba(31,58,50,0.18)" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="90" x2="26" y2="98" stroke="rgba(31,58,50,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="36" y1="90" x2="46" y2="98" stroke="rgba(31,58,50,0.14)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="24" y="49" width="24" height="16" rx="3" fill="rgba(31,58,50,0.09)" stroke="rgba(31,58,50,0.17)" strokeWidth="1.5" />
      <circle cx="36" cy="57" r="5" fill="rgba(31,58,50,0.06)" stroke="rgba(31,58,50,0.2)" strokeWidth="1.5" />
      <circle cx="36" cy="57" r="2.5" fill="rgba(31,58,50,0.14)" />
      <rect x="40" y="47" width="5" height="3" rx="1" fill="rgba(31,58,50,0.14)" />

      {/* Plant — background right */}
      <line x1="122" y1="82" x2="122" y2="98" stroke="rgba(31,58,50,0.18)" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="118" cy="74" rx="6" ry="9" fill="rgba(143,169,155,0.28)" stroke="rgba(31,58,50,0.10)" strokeWidth="1" />
      <ellipse cx="126" cy="71" rx="5" ry="8" fill="rgba(143,169,155,0.22)" stroke="rgba(31,58,50,0.08)" strokeWidth="1" />

      {/* Light rays */}
      <line x1="133" y1="43" x2="108" y2="62" stroke="rgba(31,58,50,0.04)" strokeWidth="1.5" />
      <line x1="133" y1="48" x2="106" y2="68" stroke="rgba(31,58,50,0.03)" strokeWidth="1.5" />
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductMockupPage() {
  const [sceneText, setSceneText] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [imageModel, setImageModel] = useState<'gemini' | 'seedream'>('gemini')
  const [imageQuality, setImageQuality] = useState<'1K' | '2K'>('1K')
  const [aspectRatio, setAspectRatio] = useState('1:1')

  const aspectRatioOptions = imageModel === 'seedream' ? SEEDREAM_ASPECT_RATIOS : GEMINI_ASPECT_RATIOS

  useEffect(() => {
    const valid = (imageModel === 'seedream' ? SEEDREAM_ASPECT_RATIOS : GEMINI_ASPECT_RATIOS)
    if (!valid.find((r) => r.value === aspectRatio)) {
      setAspectRatio('1:1')
    }
  }, [imageModel])

  const [generating, setGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<string>('')
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [imageTitle, setImageTitle] = useState('')
  const [showPhoto, setShowPhoto] = useState(false)
  const [selectedRefs, setSelectedRefs] = useState<{ id: string; url: string }[]>([])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [photoShootMode, setPhotoShootMode] = useState(false)
  const [photoShootGenerating, setPhotoShootGenerating] = useState(false)
  const [shootResults, setShootResults] = useState<ShootSlot[]>([])
  const [shootFolderName, setShootFolderName] = useState<string | null>(null)
  const [selectedShootAdId, setSelectedShootAdId] = useState<string | null>(null)
  const [selectedShootLabel, setSelectedShootLabel] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setGeneratedAd(null)
    setGenerationStage('Loading brand profile...')

    const t1 = setTimeout(() => setGenerationStage('Analyzing product reference...'), 2000)
    const t2 = setTimeout(() => setGenerationStage('Building scene prompt...'), 6000)
    const modelLabel = imageModel === 'seedream' ? 'Seedream 4' : 'Gemini'
    const t3 = setTimeout(() => setGenerationStage(`Placing product in scene with ${modelLabel}...`), 10000)
    const t4 = setTimeout(() => setGenerationStage('Saving to your library...'), 35000)
    const clearAll = () => [t1, t2, t3, t4].forEach(clearTimeout)

    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_context: sceneText.trim() || undefined,
          image_quality: imageQuality,
          aspect_ratio: aspectRatio,
          creativity: 2,
          post_type: 'product_mockup',
          image_model: imageModel,
          title: imageTitle.trim(),
          reference_image_ids: selectedRefs.length > 0 ? selectedRefs.map((r) => r.id) : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')

      clearAll()
      setGeneratedAd(data.ad)
      setGenerationStage('Complete!')
    } catch (err: any) {
      clearAll()
      setError(err.message || 'Failed to generate mockup')
      setGenerationStage('')
    } finally {
      setGenerating(false)
    }
  }

  const handlePhotoShoot = async () => {
    setPhotoShootGenerating(true)
    setError(null)
    setShootResults(PHOTO_SHOOT_SHOTS.map((shot) => ({ shot, ad: null, error: null, loading: true })))
    setSelectedShootAdId(null)
    setSelectedShootLabel(null)

    let folderId: string
    const folderName = `${imageTitle.trim()} — Photo Shoot`
    try {
      const folderRes = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName }),
      })
      const folderData = await folderRes.json()
      if (!folderRes.ok) throw new Error(folderData.error || 'Failed to create campaign folder')
      folderId = folderData.folder.id
      setShootFolderName(folderName)
    } catch (err: any) {
      setPhotoShootGenerating(false)
      setShootResults([])
      setError(err.message || 'Failed to create campaign folder')
      return
    }

    const basePayload = {
      image_quality: imageQuality,
      aspect_ratio: aspectRatio,
      creativity: 2,
      post_type: 'product_mockup',
      image_model: imageModel,
      reference_image_ids: selectedRefs.length > 0 ? selectedRefs.map((r) => r.id) : undefined,
      folder_id: folderId,
    }

    const promises = PHOTO_SHOOT_SHOTS.map(async (shot, idx) => {
      try {
        const context = sceneText.trim()
          ? `${sceneText.trim()}\n\nCAMERA ANGLE: ${shot.directive}`
          : `CAMERA ANGLE: ${shot.directive}`

        const res = await fetch('/api/generate-ad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            user_context: context,
            title: `${imageTitle.trim()} — ${shot.label}`,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Generation failed')

        setShootResults((prev) => {
          const next = [...prev]
          next[idx] = { shot, ad: { id: data.ad.id, generatedImageUrl: data.ad.generatedImageUrl }, error: null, loading: false }
          return next
        })
      } catch (err: any) {
        setShootResults((prev) => {
          const next = [...prev]
          next[idx] = { shot, ad: null, error: err.message || 'Failed', loading: false }
          return next
        })
      }
    })

    await Promise.allSettled(promises)
    setPhotoShootGenerating(false)
  }

  const shootDone = shootResults.length > 0 && shootResults.every((s) => !s.loading)
  const shootComplete = shootResults.filter((s) => !s.loading).length

  // ── Dot-grid background used in empty/loading states
  const dotGrid = {
    backgroundImage: 'radial-gradient(circle, rgba(31,58,50,0.07) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/create"
          className="inline-flex items-center gap-1 text-xs font-mono text-graphite/40 uppercase tracking-widest hover:text-rust transition-colors mb-3"
        >
          ← The Lab Bench
        </Link>
        <h1 className="text-3xl font-mono font-semibold text-graphite">Product Mockup</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT COLUMN — Controls Card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-5 pb-4 border-b border-forest/10">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={15} className="text-forest/50" strokeWidth={1.8} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite/60">Mockup Setup</span>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-paper rounded-xl">
              <button
                onClick={() => {
                  setPhotoShootMode(false)
                  setShootResults([])
                  setSelectedShootAdId(null)
                  setSelectedShootLabel(null)
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${
                  !photoShootMode ? 'bg-rust text-white shadow-sm' : 'text-graphite/45 hover:text-graphite'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => {
                  setPhotoShootMode(true)
                  setGeneratedAd(null)
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all ${
                  photoShootMode ? 'bg-rust text-white shadow-sm' : 'text-graphite/45 hover:text-graphite'
                }`}
              >
                Photo Shoot · 6×
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex flex-col gap-4">

            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                Title <span className="text-rust">*</span>
              </label>
              <input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="e.g. Studio Launch Shot"
                maxLength={80}
                className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-3 text-sm font-mono focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              />
            </div>

            {/* Scene description */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">Scene</label>
              <textarea
                value={sceneText}
                onChange={(e) => {
                  setSceneText(e.target.value)
                  setSelectedPreset('')
                }}
                placeholder="Describe the scene… marble countertop · golden hour · white studio void"
                rows={2}
                maxLength={300}
                className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-3 text-sm font-mono resize-none focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              />
              <div className="text-right">
                <span className="text-[11px] font-mono text-graphite/25">{sceneText.length} / 300</span>
              </div>
            </div>

            {/* Photo & Preset row */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPhoto(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono transition-all whitespace-nowrap ${
                  selectedRefs.length > 0
                    ? 'border-rust/50 text-rust bg-rust/5'
                    : 'border-forest/20 text-graphite/50 hover:border-forest/40 hover:text-graphite'
                }`}
              >
                <ImagePlus size={14} strokeWidth={1.8} />
                Photo{selectedRefs.length > 0 ? ` (${selectedRefs.length})` : ''}
              </button>
              <div className="relative">
                <select
                  value={selectedPreset}
                  onChange={(e) => {
                    const val = e.target.value
                    setSelectedPreset(val)
                    if (val) {
                      const preset = SCENE_PRESETS.find((p) => p.name === val)
                      if (preset) setSceneText(preset.description)
                    }
                  }}
                  className="appearance-none rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-2.5 pr-8 text-xs font-mono text-graphite/50 focus:outline-none focus:border-forest/50 cursor-pointer"
                >
                  <option value="">Select Preset…</option>
                  {SCENE_PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/30 pointer-events-none" />
              </div>
            </div>

            {/* Active references */}
            {selectedRefs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedRefs.map((ref) => (
                  <div key={ref.id} className="relative group">
                    <img src={ref.url} alt="Reference" className="w-12 h-12 object-cover rounded-lg border border-forest/15" />
                    <button
                      onClick={() => setSelectedRefs((prev) => prev.filter((r) => r.id !== ref.id))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rust text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-forest/10" />

            {/* Aspect Ratio chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">Aspect Ratio</label>
              <div className="flex flex-wrap gap-1.5">
                {aspectRatioOptions.map((r) => (
                  <div key={r.value} className="relative group">
                    <button
                      onClick={() => setAspectRatio(r.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                        aspectRatio === r.value
                          ? 'bg-sage border-forest/30 text-forest font-semibold'
                          : 'border-forest/15 text-graphite/50 hover:border-forest/35 hover:text-graphite'
                      }`}
                    >
                      {r.value}
                    </button>
                    {r.tooltip && (
                      <div className="pointer-events-none absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-graphite text-paper text-[10px] font-mono whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {r.tooltip}
                        <div className="absolute top-full left-3 border-4 border-transparent border-t-graphite" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution + Model row */}
            <div className="flex gap-6 items-start">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">Resolution</label>
                <div className="flex gap-1.5">
                  {(['1K', '2K'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setImageQuality(q)}
                      className={`px-5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                        imageQuality === q
                          ? 'bg-sage border-forest/30 text-forest font-semibold'
                          : 'border-forest/15 text-graphite/50 hover:border-forest/35'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">Model</label>
                <div className="relative">
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value as 'gemini' | 'seedream')}
                    className="appearance-none rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-1.5 pr-8 text-sm font-mono text-graphite focus:outline-none focus:border-forest/50 cursor-pointer"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="seedream">Seedream 4</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/30 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Generate CTA */}
            <button
              onClick={photoShootMode ? handlePhotoShoot : handleGenerate}
              disabled={generating || photoShootGenerating || !imageTitle.trim()}
              className="w-full bg-rust text-white rounded-xl py-4 font-mono font-semibold text-sm tracking-wide hover:bg-[#9a4429] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {photoShootMode
                ? (photoShootGenerating ? 'Generating Photo Shoot…' : 'Generate Photo Shoot — 6 Images')
                : (generating ? 'Generating Mockup…' : 'Generate Mockup')}
            </button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[11px] font-mono uppercase text-red-500 mb-1">Error</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT COLUMN — Preview Canvas ────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col"
          style={{ minHeight: '640px' }}
        >

          {/* Canvas header */}
          <div className="px-6 py-4 border-b border-forest/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Monitor size={15} className="text-forest/35" strokeWidth={1.8} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite/40">
                {photoShootMode ? 'Photo Shoot' : 'Mockup Preview'}
              </span>
            </div>
            <span className="text-[11px] font-mono bg-sage/20 text-forest/60 px-3 py-1 rounded-full border border-sage/30">
              {imageModel === 'seedream' ? 'Seedream 4' : 'Gemini'} · Ready
            </span>
          </div>

          {/* Canvas body */}
          <div className="flex-1 relative overflow-auto">

            {/* ── SINGLE MOCKUP ─────────────────────────────────────────────── */}
            {!photoShootMode && (
              <>
                {/* Empty state */}
                {!generating && !generatedAd && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5" style={dotGrid}>
                    <StudioIllustration />
                    <div className="text-center">
                      <p className="text-sm font-mono text-graphite/40">Your mockup will appear here</p>
                      <p className="text-[11px] font-mono text-graphite/25 mt-1">upload a photo · describe the scene · generate</p>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8" style={dotGrid}>
                    <div className="bg-white rounded-2xl border border-forest/15 shadow-sm p-6 w-full max-w-xs flex flex-col items-center gap-5">
                      {/* Video loading animation */}
                      <div className="rounded-xl overflow-hidden border border-forest/15 w-full aspect-video bg-paper">
                        <video
                          src="/Generate_labLoading.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-full">
                        <p className="text-sm font-mono text-graphite/60 leading-tight mb-3">{generationStage}</p>
                        <div className="space-y-2.5">
                          <p className="text-xs font-mono text-graphite/40">✓ Brand profile loaded</p>
                          <p className="text-xs font-mono text-rust animate-pulse">→ Building scene prompt…</p>
                          <p className="text-xs font-mono text-graphite/20">→ Generating with {imageModel === 'seedream' ? 'Seedream 4' : 'Gemini'}…</p>
                          <p className="text-xs font-mono text-graphite/20">→ Saving to library…</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result */}
                {!generating && generatedAd && (
                  <div className="p-5 space-y-4">
                    {generatedAd.generatedImageUrl && (
                      <div className="relative group rounded-xl overflow-hidden border border-forest/15">
                        <img src={generatedAd.generatedImageUrl} alt="Product mockup" className="w-full h-auto" />
                        <button
                          onClick={() => setPreviewUrl(generatedAd.generatedImageUrl)}
                          className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-forest/20 rounded-lg px-3 py-1.5 text-xs font-mono text-graphite opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Maximize2 size={11} /> Expand
                        </button>
                      </div>
                    )}

                    {/* Saved banner */}
                    <div className="flex items-center justify-between rounded-xl bg-sage/15 border border-sage/25 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-forest" strokeWidth={2} />
                        <span className="text-xs font-mono text-forest uppercase tracking-wide">Saved to Library</span>
                      </div>
                      <a href="/library" className="text-xs font-mono text-rust hover:underline">View Library →</a>
                    </div>

                    {/* Animate button */}
                    <Link
                      href={`/create/animate?adId=${generatedAd.id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-forest/20 bg-forest/5 py-3 text-sm font-mono text-forest/70 hover:bg-forest hover:text-white hover:border-forest transition-all"
                    >
                      <Film size={14} strokeWidth={1.8} />
                      Animate This Image
                    </Link>

                    <button
                      onClick={() => {
                        setGeneratedAd(null)
                        setError(null)
                        setImageTitle('')
                        setSelectedRefs([])
                        setShowPhoto(false)
                      }}
                      className="w-full rounded-xl border border-forest/20 py-3 text-sm font-mono text-graphite/50 hover:text-graphite hover:border-forest/40 transition-colors"
                    >
                      Generate Another Mockup
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── PHOTO SHOOT ───────────────────────────────────────────────── */}
            {photoShootMode && (
              <>
                {/* Empty state */}
                {shootResults.length === 0 && !photoShootGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5" style={dotGrid}>
                    <StudioIllustration />
                    <div className="text-center">
                      <p className="text-sm font-mono text-graphite/40">6 angles will generate simultaneously</p>
                      <p className="text-[11px] font-mono text-graphite/25 mt-1">Front · Three-Quarter · Overhead · Close-Up · Wide · Low Angle</p>
                    </div>
                  </div>
                )}

                {/* Loading overlay — shown before any results arrive */}
                {photoShootGenerating && shootResults.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8" style={dotGrid}>
                    <div className="bg-white rounded-2xl border border-forest/15 shadow-sm p-6 w-full max-w-xs flex flex-col items-center gap-5">
                      <div className="rounded-xl overflow-hidden border border-forest/15 w-full aspect-video bg-paper">
                        <video
                          src="/Generate_labLoading.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-full">
                        <p className="text-sm font-mono text-graphite/60 leading-tight mb-1">Generating 6 angles…</p>
                        <p className="text-xs font-mono text-graphite/30">Results will appear as each shot completes.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                {shootResults.length > 0 && (
                  <div className="p-5 space-y-4">

                    {/* Status banner */}
                    {photoShootGenerating ? (
                      <div className="flex items-center gap-3 rounded-xl bg-paper border border-forest/15 px-4 py-3">
                        <div className="w-4 h-4 border-2 border-rust border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <span className="text-xs font-mono text-graphite/50">Generating… {shootComplete} / 6 complete</span>
                      </div>
                    ) : shootDone ? (
                      <div className="flex items-center justify-between rounded-xl bg-sage/15 border border-sage/25 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-forest" strokeWidth={2} />
                          <span className="text-xs font-mono text-forest uppercase tracking-wide">
                            Complete{shootFolderName ? ` — "${shootFolderName}"` : ''}
                          </span>
                        </div>
                        <a href="/library" className="text-xs font-mono text-rust hover:underline">View Library →</a>
                      </div>
                    ) : null}

                    {/* 3×2 grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {shootResults.map((slot, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          {slot.loading ? (
                            <div className="aspect-square rounded-xl border border-forest/15 overflow-hidden">
                              <video
                                src="/Generate_labLoading.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : slot.error ? (
                            <div className="aspect-square rounded-xl border border-red-200 bg-red-50 flex items-center justify-center p-2">
                              <p className="text-[10px] font-mono text-red-400 text-center leading-snug">{slot.error}</p>
                            </div>
                          ) : slot.ad ? (
                            <div className="relative group">
                              <button
                                onClick={() => {
                                  if (selectedShootAdId === slot.ad!.id) {
                                    setSelectedShootAdId(null)
                                    setSelectedShootLabel(null)
                                  } else {
                                    setSelectedShootAdId(slot.ad!.id)
                                    setSelectedShootLabel(slot.shot.label)
                                  }
                                }}
                                className={`aspect-square rounded-xl overflow-hidden border-2 w-full block transition-all ${
                                  selectedShootAdId === slot.ad.id
                                    ? 'border-rust ring-2 ring-rust/20'
                                    : 'border-transparent hover:border-forest/25'
                                }`}
                              >
                                <img src={slot.ad.generatedImageUrl} alt={slot.shot.label} className="w-full h-full object-cover" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setPreviewUrl(slot.ad!.generatedImageUrl) }}
                                className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Expand"
                              >
                                <Maximize2 size={11} />
                              </button>
                            </div>
                          ) : null}
                          <p className="text-[10px] font-mono text-graphite/35 uppercase tracking-wider text-center truncate">
                            {slot.shot.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Animate selected shot */}
                    {selectedShootAdId && (
                      <Link
                        href={`/create/animate?adId=${selectedShootAdId}`}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-forest/20 bg-forest/5 py-3 text-sm font-mono text-forest/70 hover:bg-forest hover:text-white hover:border-forest transition-all"
                      >
                        <Film size={14} strokeWidth={1.8} />
                        Animate — {selectedShootLabel}
                      </Link>
                    )}

                    {shootDone && (
                      <button
                        onClick={() => {
                          setShootResults([])
                          setShootFolderName(null)
                          setSelectedShootAdId(null)
                          setSelectedShootLabel(null)
                          setImageTitle('')
                          setSelectedRefs([])
                        }}
                        className="w-full rounded-xl border border-forest/20 py-3 text-sm font-mono text-graphite/50 hover:text-graphite hover:border-forest/40 transition-colors"
                      >
                        Generate Another Photo Shoot
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status bar */}
          <div className="px-6 py-3 border-t border-forest/10 flex-shrink-0">
            <span className="text-[11px] font-mono text-graphite/25 uppercase tracking-widest">
              {aspectRatio} · {imageQuality} · {imageModel === 'seedream' ? 'Seedream 4' : 'Gemini'} · {photoShootMode ? 'Photo Shoot' : 'Single'}
            </span>
          </div>
        </div>

      </div>

      {/* Image preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-paper border-b border-forest/10 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-graphite/40">Preview</span>
              <button onClick={() => setPreviewUrl(null)} className="text-graphite/40 hover:text-graphite transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[80vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Reference image library modal */}
      <PhotoPicker
        isOpen={showPhoto}
        onClose={() => setShowPhoto(false)}
        onSelect={(id, url) => {
          setSelectedRefs((prev) => {
            if (prev.some((r) => r.id === id)) return prev
            return [...prev, { id, url }]
          })
        }}
      />
    </div>
  )
}

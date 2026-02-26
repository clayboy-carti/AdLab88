'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReferenceImageUpload from '@/components/create/ReferenceImageUpload'

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

export default function ProductMockupPage() {
  const [sceneText, setSceneText] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [imageModel, setImageModel] = useState<'gemini' | 'seedream'>('gemini')
  const [imageQuality, setImageQuality] = useState<'1K' | '2K'>('1K')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [generating, setGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<string>('')
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [imageTitle, setImageTitle] = useState('')
  const [showPhoto, setShowPhoto] = useState(false)

  // Video generation state
  const [videoTitle, setVideoTitle] = useState('')
  const [motionPrompt, setMotionPrompt] = useState('')
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<{ id: string; videoUrl: string } | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

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

  const handleGenerateVideo = async () => {
    if (!generatedAd) return
    setGeneratingVideo(true)
    setVideoError(null)
    setGeneratedVideo(null)

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: generatedAd.id,
          motion_prompt: motionPrompt.trim() || undefined,
          aspect_ratio: aspectRatio,
          title: videoTitle.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Video generation failed')

      setGeneratedVideo({ id: data.video.id, videoUrl: data.video.videoUrl })
    } catch (err: any) {
      setVideoError(err.message || 'Failed to generate video')
    } finally {
      setGeneratingVideo(false)
    }
  }

  return (
    <div className="w-full p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <Link
            href="/create"
            className="font-mono text-xs text-gray-400 uppercase tracking-widest hover:text-rust transition-colors"
          >
            ← The Lab Bench
          </Link>
          <h1 className="text-3xl font-mono header-accent mt-1">Product Mockup</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* ── Compact compose card ── */}
          <div className="border border-outline bg-white flex flex-col">

            {/* Title row */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-outline">
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 shrink-0">Title</span>
              <input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="e.g. Studio Launch Shot"
                maxLength={80}
                className="flex-1 text-sm font-mono bg-transparent focus:outline-none placeholder:text-gray-300 min-w-0"
              />
              {!imageTitle.trim() && (
                <span className="font-mono text-[10px] text-rust uppercase tracking-widest shrink-0">Required</span>
              )}
            </div>

            {/* Scene textarea */}
            <div className="px-4 pt-3 pb-2">
              <textarea
                value={sceneText}
                onChange={(e) => {
                  setSceneText(e.target.value)
                  setSelectedPreset('')
                }}
                placeholder="Describe the scene… e.g. marble countertop · golden hour outdoor · white studio void"
                rows={5}
                maxLength={300}
                className="w-full text-sm font-mono bg-transparent resize-none focus:outline-none placeholder:text-gray-300"
              />
              <div className="text-right mt-1">
                <span className="font-mono text-[10px] text-gray-300">{sceneText.length} / 300</span>
              </div>
            </div>

            {/* Photo drawer */}
            {showPhoto && (
              <div className="border-t border-outline px-4 py-3">
                <ReferenceImageUpload />
              </div>
            )}

            {/* Toolbar */}
            <div className="border-t border-outline flex items-stretch divide-x divide-outline">

              {/* Photo toggle */}
              <button
                onClick={() => setShowPhoto((v) => !v)}
                title="Product photo"
                className={`flex items-center gap-1.5 px-3 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors hover:bg-gray-50 ${showPhoto ? 'text-rust' : 'text-gray-500'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Photo</span>
              </button>

              {/* Scene preset */}
              <div className="flex items-center px-3 py-2.5 flex-1 min-w-0">
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
                  className="w-full font-mono text-xs text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer uppercase truncate"
                >
                  <option value="">PRESET</option>
                  {SCENE_PRESETS.map((preset) => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>

              {/* Aspect ratio */}
              <div className="flex items-center px-3 py-2.5">
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="font-mono text-xs text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  <option value="1:1">1:1</option>
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                </select>
              </div>

              {/* Quality */}
              <div className="flex items-stretch">
                {(['1K', '2K'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setImageQuality(q)}
                    className={`px-3 font-mono text-xs uppercase transition-colors ${
                      imageQuality === q ? 'bg-rust text-white' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Model */}
              <div className="flex items-center px-3 py-2.5">
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value as 'gemini' | 'seedream')}
                  className="font-mono text-xs text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer uppercase"
                >
                  <option value="gemini">GEMINI</option>
                  <option value="seedream">SEEDREAM</option>
                </select>
              </div>

            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !imageTitle.trim()}
            className="btn-primary w-full mt-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? 'GENERATING MOCKUP...' : 'GENERATE MOCKUP'}
          </button>

          {error && (
            <div className="mt-3 border border-red-300 bg-red-50 p-3">
              <p className="font-mono text-xs uppercase text-red-700 mb-1">Error</p>
              <p className="font-mono text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
              [ LIVE OUTPUT ENGINE ]
            </p>
            <span className="font-mono text-xs border border-rust text-rust px-2 py-0.5">
              [ {imageModel === 'seedream' ? 'SEEDREAM 4' : 'GEMINI'}: READY ]
            </span>
          </div>

          <div className="border border-outline flex flex-col">
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-widest">Generated Mockup</span>
            </div>

            <div className="flex-1 min-h-[480px] relative bg-white">

              {/* Loading state */}
              {generating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #d4cbb8 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <div className="bg-white border border-outline p-6 text-center w-full max-w-xs">
                    <div className="animate-spin h-6 w-6 border-2 border-rust border-t-transparent mx-auto mb-4" />
                    <p className="font-mono text-xs text-gray-600 mb-4">{generationStage}</p>
                    <div className="space-y-1.5 text-left">
                      <p className="font-mono text-xs text-gray-500">✓ Loading brand profile</p>
                      <p className="font-mono text-xs text-rust animate-pulse">→ Building scene prompt...</p>
                      <p className="font-mono text-xs text-gray-300">→ Placing product in scene...</p>
                      <p className="font-mono text-xs text-gray-300">→ Saving to library...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result */}
              {!generating && generatedAd && (
                <div className="p-4 space-y-3">
                  {generatedAd.generatedImageUrl && (
                    <div className="border border-outline overflow-hidden">
                      <img
                        src={generatedAd.generatedImageUrl}
                        alt="Product mockup"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  <div className="border border-outline p-4 bg-white">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">Scene</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {sceneText || 'Lifestyle product placement'}
                    </p>
                  </div>

                  <div className="border border-green-300 bg-green-50 p-3">
                    <p className="font-mono text-xs uppercase text-green-700 mb-1">Saved to Library</p>
                    <a href="/library" className="font-mono text-xs text-green-600 underline">View Library →</a>
                  </div>

                  {/* ── ANIMATE THIS ── */}
                  <div className="border border-outline">
                    <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2 flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-widest">Animate This</span>
                      <span className="font-mono text-xs text-gray-500 border border-outline px-2 py-0.5">
                        [ GROK VIDEO · 5s ]
                      </span>
                    </div>

                    {/* Video player — shown once video is ready */}
                    {generatedVideo && (
                      <div className="border-b border-outline">
                        <video
                          src={generatedVideo.videoUrl}
                          controls
                          autoPlay
                          loop
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* Video generating state */}
                    {generatingVideo && (
                      <div className="p-6 flex flex-col items-center gap-3 bg-white">
                        <div className="animate-spin h-5 w-5 border-2 border-rust border-t-transparent" />
                        <p className="font-mono text-xs text-gray-500">Animating with Grok Video...</p>
                        <p className="font-mono text-xs text-gray-400 text-center">
                          This takes 60–120 seconds. Hang tight.
                        </p>
                      </div>
                    )}

                    {/* Motion prompt + trigger — hidden while generating or after video is ready */}
                    {!generatingVideo && !generatedVideo && (
                      <div className="p-4 bg-white space-y-3">
                        <div className="border border-outline">
                          <div className="px-3 py-1.5 border-b border-outline bg-[#f7f4ef] flex items-center justify-between">
                            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                              Video Title
                            </p>
                            <span className="font-mono text-[10px] text-rust uppercase tracking-widest">Required</span>
                          </div>
                          <div className="px-3 pt-3 pb-2">
                            <input
                              type="text"
                              value={videoTitle}
                              onChange={(e) => setVideoTitle(e.target.value)}
                              placeholder="e.g. Studio Shot Animation"
                              maxLength={80}
                              className="w-full text-sm font-mono bg-transparent focus:outline-none placeholder:text-gray-300 border-none p-0"
                            />
                          </div>
                        </div>

                        <div className="border border-outline">
                          <div className="px-3 py-1.5 border-b border-outline bg-[#f7f4ef]">
                            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                              Motion (optional)
                            </p>
                          </div>
                          <div className="px-3 pt-3 pb-2">
                            <textarea
                              value={motionPrompt}
                              onChange={(e) => setMotionPrompt(e.target.value)}
                              placeholder={
                                'e.g. slow 360° product rotation · steam rising from the surface · camera slowly pulls back · subtle water ripples'
                              }
                              rows={2}
                              className="w-full text-sm font-mono bg-transparent resize-none focus:outline-none placeholder:text-gray-300 border-none p-0"
                            />
                          </div>
                        </div>

                        {videoError && (
                          <div className="border border-red-300 bg-red-50 p-3">
                            <p className="font-mono text-xs text-red-600">{videoError}</p>
                          </div>
                        )}

                        <button
                          onClick={handleGenerateVideo}
                          disabled={!videoTitle.trim()}
                          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          GENERATE VIDEO
                        </button>
                      </div>
                    )}

                    {/* Re-generate option once video is done */}
                    {generatedVideo && !generatingVideo && (
                      <div className="p-3 bg-white border-t border-outline">
                        <button
                          onClick={() => {
                            setGeneratedVideo(null)
                            setVideoError(null)
                            setVideoTitle('')
                          }}
                          className="font-mono text-xs text-gray-500 hover:text-rust transition-colors"
                        >
                          ← Generate another video
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setGeneratedAd(null)
                      setError(null)
                      setGeneratedVideo(null)
                      setVideoError(null)
                      setMotionPrompt('')
                      setImageTitle('')
                      setVideoTitle('')
                    }}
                    className="btn-secondary w-full"
                  >
                    GENERATE ANOTHER MOCKUP
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!generating && !generatedAd && !error && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #d4cbb8 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <p className="font-mono text-xs text-gray-500 text-center leading-relaxed">
                    Awaiting input.<br />
                    <span className="text-gray-400">
                      Upload a product photo, describe the scene,<br />and click GENERATE MOCKUP.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="border-t border-outline px-4 py-2 bg-[#e4dcc8]">
              <span className="font-mono text-xs text-gray-500 tracking-wider">
                FORMAT: {aspectRatio}&nbsp;&nbsp;|&nbsp;&nbsp;QUALITY: {imageQuality}&nbsp;&nbsp;|&nbsp;&nbsp;MODEL: {imageModel === 'seedream' ? 'SEEDREAM 4' : 'GEMINI'}&nbsp;&nbsp;|&nbsp;&nbsp;TYPE: PRODUCT MOCKUP
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

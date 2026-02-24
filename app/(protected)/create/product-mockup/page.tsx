'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReferenceImageUpload from '@/components/create/ReferenceImageUpload'

export const dynamic = 'force-dynamic'

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
  const [imageModel, setImageModel] = useState<'gemini' | 'seedream'>('gemini')
  const [imageQuality, setImageQuality] = useState<'1K' | '2K'>('1K')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [generating, setGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<string>('')
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">
            [ CREATIVE INPUT MODULE ]
          </p>

          {/* Outer container */}
          <div className="border border-outline">

            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-widest">Input Sources</span>
            </div>

            {/* Reference Image — required for mockups */}
            <div className="border-b border-outline">
              <div className="px-4 py-1.5 border-b border-outline bg-white">
                <span className="font-mono text-xs text-gray-400 tracking-wider">— PRODUCT PHOTO —</span>
              </div>
              <div className="p-4 bg-white">
                <ReferenceImageUpload />
                <p className="font-mono text-xs text-gray-400 mt-2 leading-relaxed">
                  Upload a clean photo of your product. The selected model will use it as the source.
                </p>
              </div>
            </div>

            {/* Scene Description */}
            <div className="border-b border-outline">
              <div className="px-4 py-1.5 border-b border-outline bg-white">
                <span className="font-mono text-xs text-gray-400 tracking-wider">— SCENE DESCRIPTION —</span>
              </div>
              <div className="p-4 bg-white">
                <div className="border border-outline">
                  <div className="px-3 pt-3 pb-1">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">Describe the Scene</p>
                    <textarea
                      value={sceneText}
                      onChange={(e) => setSceneText(e.target.value)}
                      placeholder="e.g. morning coffee on a marble countertop · hands holding the product outdoors · minimalist white studio"
                      rows={3}
                      className="w-full text-sm font-mono bg-transparent resize-none focus:outline-none placeholder:text-gray-300 border-none p-0"
                    />
                  </div>
                  <div className="px-3 pb-2 text-right">
                    <span className="font-mono text-xs text-gray-400">{sceneText.length} / 300</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Settings */}
            <div className="bg-white">
              <div className="px-4 py-1.5 border-b border-outline">
                <span className="font-mono text-xs text-gray-400 tracking-wider">— IMAGE SETTINGS —</span>
              </div>

              {/* Model row */}
              <div className="flex items-center border-b border-outline">
                <div className="w-32 shrink-0 px-4 py-2.5 border-r border-outline">
                  <span className="font-mono text-xs uppercase text-gray-500">Model</span>
                </div>
                <div className="px-4 py-1.5 flex-1">
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value as 'gemini' | 'seedream')}
                    className="w-full font-mono text-xs bg-transparent focus:outline-none border-none p-0 text-gray-700"
                  >
                    <option value="gemini">Gemini Image Pro</option>
                    <option value="seedream">Seedream 4 (Replicate)</option>
                  </select>
                </div>
              </div>

              {/* Quality row */}
              <div className="flex items-center border-b border-outline">
                <div className="w-32 shrink-0 px-4 py-2.5 border-r border-outline">
                  <span className="font-mono text-xs uppercase text-gray-500">Quality</span>
                </div>
                <div className="px-4 py-2 flex gap-2">
                  {(['1K', '2K'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setImageQuality(q)}
                      className={`font-mono text-xs uppercase px-3 py-1 border transition-colors ${
                        imageQuality === q
                          ? 'border-rust text-rust'
                          : 'border-outline text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      [ {q} ]
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio row */}
              <div className="flex items-center">
                <div className="w-32 shrink-0 px-4 py-2.5 border-r border-outline">
                  <span className="font-mono text-xs uppercase text-gray-500">Aspect Ratio</span>
                </div>
                <div className="px-4 py-1.5 flex-1">
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full font-mono text-xs bg-transparent focus:outline-none border-none p-0 text-gray-700"
                  >
                    <option value="1:1">1:1 — Square</option>
                    <option value="9:16">9:16 — Story / Reel</option>
                    <option value="16:9">16:9 — Landscape</option>
                    <option value="3:4">3:4 — Feed Portrait</option>
                    <option value="4:3">4:3 — Standard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary w-full mt-3"
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

                  <button
                    onClick={() => { setGeneratedAd(null); setError(null) }}
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

'use client'

import { useState } from 'react'
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

export default function CreatePage() {
  const [contextText, setContextText] = useState('')
  const [imageQuality, setImageQuality] = useState<'1K' | '2K'>('1K')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [creativity, setCreativity] = useState(2)
  const [generating, setGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<string>('')
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setGeneratedAd(null)
    setGenerationStage('Loading brand profile and frameworks...')

    const stageTimeout1 = setTimeout(() => {
      setGenerationStage('Analyzing reference image style...')
    }, 2000)

    const stageTimeout2 = setTimeout(() => {
      setGenerationStage('Writing ad copy with AI...')
    }, 5000)

    const stageTimeout3 = setTimeout(() => {
      setGenerationStage('Generating image with Gemini...')
    }, 15000)

    const stageTimeout4 = setTimeout(() => {
      setGenerationStage('Saving to your library...')
    }, 35000)

    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_context: contextText.trim() || undefined,
          image_quality: imageQuality,
          aspect_ratio: aspectRatio,
          creativity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      clearTimeout(stageTimeout1)
      clearTimeout(stageTimeout2)
      clearTimeout(stageTimeout3)
      clearTimeout(stageTimeout4)

      setGeneratedAd(data.ad)
      setGenerationStage('Complete!')
    } catch (err: any) {
      clearTimeout(stageTimeout1)
      clearTimeout(stageTimeout2)
      clearTimeout(stageTimeout3)
      clearTimeout(stageTimeout4)

      setError(err.message || 'Failed to generate ad')
      setGenerationStage('')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-mono header-accent">The Lab Bench</h1>
      </div>
      <div className="grid grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">
            [ CREATIVE INPUT MODULE ]
          </p>

          {/* Outer container */}
          <div className="border border-outline">

            {/* Section header bar */}
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-widest">Input Sources</span>
            </div>

            {/* Reference Images */}
            <div className="border-b border-outline">
              <div className="px-4 py-1.5 border-b border-outline bg-white">
                <span className="font-mono text-xs text-gray-400 tracking-wider">— REFERENCE IMAGES MODULE —</span>
              </div>
              <div className="p-4 bg-white">
                <ReferenceImageUpload />
              </div>
            </div>

            {/* Ad Context */}
            <div className="border-b border-outline">
              <div className="px-4 py-1.5 border-b border-outline bg-white">
                <span className="font-mono text-xs text-gray-400 tracking-wider">— AD CONTEXT MODULE —</span>
              </div>
              <div className="p-4 bg-white">
                <div className="border border-outline">
                  <div className="px-3 pt-3 pb-1">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">Context Brief</p>
                    <textarea
                      value={contextText}
                      onChange={(e) => setContextText(e.target.value)}
                      placeholder="e.g. 10% off first order · Free Estimates · Summer Sale · New location open"
                      rows={3}
                      className="w-full text-sm font-mono bg-transparent resize-none focus:outline-none placeholder:text-gray-300 border-none p-0"
                    />
                  </div>
                  <div className="px-3 pb-2 text-right">
                    <span className="font-mono text-xs text-gray-400">{contextText.length} / 300</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Settings — table rows */}
            <div className="bg-white">
              <div className="px-4 py-1.5 border-b border-outline">
                <span className="font-mono text-xs text-gray-400 tracking-wider">— IMAGE SETTINGS MODULE —</span>
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
              <div className="flex items-center border-b border-outline">
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

              {/* Creativity row */}
              <div className="flex items-start">
                <div className="w-32 shrink-0 px-4 py-3 border-r border-outline self-stretch">
                  <span className="font-mono text-xs uppercase text-gray-500">Creativity</span>
                </div>
                <div className="px-4 pt-2.5 pb-3 flex-1">
                  {/* Notch labels */}
                  <div className="flex justify-between mb-1.5">
                    {(['Strict', 'Balanced', 'Creative', 'Loose'] as const).map((label, i) => (
                      <span
                        key={label}
                        className={`font-mono text-xs transition-colors ${
                          creativity === i + 1 ? 'text-rust font-bold' : 'text-gray-300'
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  {/* Range slider */}
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={1}
                    value={creativity}
                    onChange={(e) => setCreativity(Number(e.target.value))}
                    className="w-full accent-rust cursor-pointer"
                  />
                  {/* Min / max context */}
                  <div className="flex justify-between mt-1.5">
                    <span className="font-mono text-xs text-gray-400">Closely follows reference</span>
                    <span className="font-mono text-xs text-gray-400">Freely reimagined</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button — outside container */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary w-full mt-3"
          >
            {generating ? 'GENERATING...' : 'GENERATE AD'}
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
              [ MODEL: READY ]
            </span>
          </div>

          {/* Outer container */}
          <div className="border border-outline flex flex-col">

            {/* Header bar */}
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-widest">Generated Preview</span>
            </div>

            {/* Preview area */}
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
                      <p className="font-mono text-xs text-rust animate-pulse">→ Generating ad copy...</p>
                      <p className="font-mono text-xs text-gray-300">→ Creating image...</p>
                      <p className="font-mono text-xs text-gray-300">→ Saving to library...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated ad */}
              {!generating && generatedAd && (
                <div className="p-4 space-y-3">
                  {generatedAd.generatedImageUrl && (
                    <div className="border border-outline overflow-hidden">
                      <img
                        src={generatedAd.generatedImageUrl}
                        alt={generatedAd.hook}
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  <div className="border border-outline p-4 bg-white">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">Ad Copy</p>
                    <h3 className="text-xl font-bold leading-tight mb-2">{generatedAd.hook}</h3>
                    <p className="text-sm font-bold text-rust">{generatedAd.cta}</p>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline">
                      <p className="font-mono text-xs text-gray-400">{generatedAd.positioning_angle}</p>
                      <span className="text-gray-300">·</span>
                      <p className="font-mono text-xs text-gray-400">{generatedAd.target_platform}</p>
                    </div>
                  </div>

                  <div className="border border-outline p-4 bg-white">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">Social Caption</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{generatedAd.caption}</p>
                  </div>

                  <div className="border border-green-300 bg-green-50 p-3">
                    <p className="font-mono text-xs uppercase text-green-700 mb-1">Saved to Library</p>
                    <a href="/library" className="font-mono text-xs text-green-600 underline">View Library →</a>
                  </div>

                  <button
                    onClick={() => { setGeneratedAd(null); setError(null) }}
                    className="btn-secondary w-full"
                  >
                    GENERATE ANOTHER AD
                  </button>
                </div>
              )}

              {/* Empty state — dot grid */}
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
                    <span className="text-gray-400">Add context and click GENERATE AD.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="border-t border-outline px-4 py-2 bg-[#e4dcc8]">
              <span className="font-mono text-xs text-gray-500 tracking-wider">
                FORMAT: {aspectRatio}&nbsp;&nbsp;|&nbsp;&nbsp;QUALITY: {imageQuality}&nbsp;&nbsp;|&nbsp;&nbsp;CREATIVITY: {['', 'STRICT', 'BALANCED', 'CREATIVE', 'LOOSE'][creativity]}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

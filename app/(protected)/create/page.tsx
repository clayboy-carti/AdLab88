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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [contextText, setContextText] = useState('')
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
          reference_image_id: selectedImageId || undefined,
          user_context: contextText.trim() || undefined,
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
      <h1 className="text-3xl uppercase font-mono header-accent mb-8">CREATE AD</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          {/* Reference Images */}
          <div className="card">
            <h2 className="text-xl uppercase font-mono mb-1">Reference Images</h2>
            <p className="text-xs text-gray-500 font-mono mb-4">
              Optional — used as a visual style guide for the generated image
            </p>
            <ReferenceImageUpload
              onImageSelect={setSelectedImageId}
              selectedImageId={selectedImageId}
            />
          </div>

          {/* Ad Context */}
          <div className="card">
            <h2 className="text-xl uppercase font-mono mb-1">Ad Context</h2>
            <p className="text-xs text-gray-500 font-mono mb-4">
              Tell the AI what this ad is promoting — offers, events, services
            </p>
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder={"e.g. 10% off first order · Free Estimates · Summer Sale · New location open"}
              rows={4}
              className="w-full border border-outline p-3 text-sm font-mono bg-white resize-none focus:outline-none focus:border-rust placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 font-mono mt-1">
              {contextText.length} / 300 characters
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary w-full"
          >
            {generating ? 'GENERATING...' : 'GENERATE AD'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-sm">
              <p className="font-mono uppercase mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Generated Preview */}
        <div className="card">
          <h2 className="text-xl uppercase font-mono mb-4">Generated Preview</h2>

          {/* Loading State */}
          {generating && (
            <div className="border border-outline p-8 bg-gray-50">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin h-8 w-8 border-4 border-rust border-t-transparent"></div>
              </div>
              <p className="text-center text-sm font-mono text-gray-700 mb-6">
                {generationStage}
              </p>
              <div className="space-y-2 text-xs text-gray-600">
                <p>✓ Loading brand profile and frameworks</p>
                {selectedImageId && <p>✓ Preparing reference image</p>}
                <p className="animate-pulse">→ Generating ad copy with AI...</p>
                <p className="text-gray-400">→ Creating image with Gemini...</p>
                <p className="text-gray-400">→ Saving to library...</p>
              </div>
            </div>
          )}

          {/* Generated Ad Preview */}
          {!generating && generatedAd && (
            <div className="space-y-4">
              {/* Generated Image */}
              {generatedAd.generatedImageUrl && (
                <div className="border border-outline overflow-hidden">
                  <img
                    src={generatedAd.generatedImageUrl}
                    alt={generatedAd.hook}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Ad Copy — what's ON the ad */}
              <div className="border border-outline p-5 bg-white">
                <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-3">
                  Ad Copy
                </p>
                <h3 className="text-2xl font-bold leading-tight mb-2">
                  {generatedAd.hook}
                </h3>
                <p className="text-sm font-bold text-rust mt-3">{generatedAd.cta}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline">
                  <p className="text-xs text-gray-400 font-mono">
                    {generatedAd.positioning_angle}
                  </p>
                  <span className="text-gray-300">·</span>
                  <p className="text-xs text-gray-400 font-mono">
                    {generatedAd.target_platform}
                  </p>
                </div>
              </div>

              {/* Social Caption — the post body */}
              <div className="border border-outline p-5 bg-white">
                <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-3">
                  Social Caption
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {generatedAd.caption}
                </p>
              </div>

              {/* Success */}
              <div className="p-4 bg-green-50 border border-green-300 text-green-800 text-sm">
                <p className="font-mono uppercase mb-1">Saved to Library</p>
                <p>
                  <a href="/library" className="underline font-medium">
                    View Library →
                  </a>
                </p>
              </div>

              {/* Generate Another */}
              <button
                onClick={() => {
                  setGeneratedAd(null)
                  setError(null)
                }}
                className="btn-secondary w-full"
              >
                GENERATE ANOTHER AD
              </button>
            </div>
          )}

          {/* Empty State */}
          {!generating && !generatedAd && !error && (
            <div className="border border-outline p-8 text-center bg-gray-50">
              <p className="text-gray-500 text-sm font-mono">
                Add context, optionally select a reference image, then click Generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

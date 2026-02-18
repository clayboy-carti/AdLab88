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
  const [generating, setGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<string>('')
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    console.log('🚀 Generate button clicked!')
    console.log('Selected image ID:', selectedImageId)

    if (!selectedImageId) {
      alert('Please select a reference image first')
      return
    }

    console.log('✅ Starting generation...')
    setGenerating(true)
    setError(null)
    setGeneratedAd(null)
    setGenerationStage('Loading brand profile and frameworks...')

    // Simulate progressive stages for better UX
    const stageTimeout1 = setTimeout(() => {
      setGenerationStage('Analyzing reference image style...')
    }, 2000)

    const stageTimeout2 = setTimeout(() => {
      setGenerationStage('Writing ad copy with AI...')
    }, 5000)

    const stageTimeout3 = setTimeout(() => {
      setGenerationStage('Generating image with DALL-E...')
    }, 15000)

    const stageTimeout4 = setTimeout(() => {
      setGenerationStage('Saving to your library...')
    }, 35000)

    try {
      console.log('📡 Calling /api/generate-ad...')
      console.log('Request body:', { reference_image_id: selectedImageId })

      // Call generation API
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference_image_id: selectedImageId }),
      })

      console.log('Response status:', response.status)

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      // Clear timeouts
      clearTimeout(stageTimeout1)
      clearTimeout(stageTimeout2)
      clearTimeout(stageTimeout3)
      clearTimeout(stageTimeout4)

      // Success!
      setGeneratedAd(data.ad)
      setGenerationStage('Complete!')
    } catch (err: any) {
      // Clear timeouts on error
      clearTimeout(stageTimeout1)
      clearTimeout(stageTimeout2)
      clearTimeout(stageTimeout3)
      clearTimeout(stageTimeout4)

      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate ad')
      setGenerationStage('')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl uppercase font-mono header-accent mb-8">CREATE AD</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Column: Reference Images */}
        <div className="card">
          <h2 className="text-xl uppercase font-mono mb-4">Reference Images</h2>
          <ReferenceImageUpload
            onImageSelect={setSelectedImageId}
            selectedImageId={selectedImageId}
          />

          <button
            onClick={handleGenerate}
            disabled={!selectedImageId || generating}
            className="btn-primary w-full mt-6"
          >
            {generating ? 'GENERATING...' : 'GENERATE AD'}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-300 text-red-800 text-sm">
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
              <p className="text-center text-sm font-mono text-gray-700">
                {generationStage}
              </p>
              <div className="mt-6 space-y-2 text-xs text-gray-600">
                <p>✓ Loading brand profile and frameworks</p>
                <p>✓ Analyzing reference image style</p>
                <p className="animate-pulse">→ Generating copy with AI...</p>
                <p className="text-gray-400">→ Creating image with DALL-E...</p>
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

              {/* Ad Copy */}
              <div className="border border-outline p-6 bg-white">
                <div className="mb-4">
                  <p className="text-xs uppercase font-mono text-gray-500 mb-1">
                    Positioning: {generatedAd.positioning_angle}
                  </p>
                  <h3 className="text-2xl font-bold mb-2">{generatedAd.hook}</h3>
                </div>

                <p className="text-sm mb-4 text-gray-700">{generatedAd.caption}</p>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-rust">{generatedAd.cta}</p>
                  <p className="text-xs text-gray-500">
                    {generatedAd.target_platform}
                  </p>
                </div>
              </div>

              {/* Success Message */}
              <div className="p-4 bg-green-50 border border-green-300 text-green-800 text-sm">
                <p className="font-mono uppercase mb-1">Success!</p>
                <p>
                  Your ad has been generated and saved to your library.{' '}
                  <a href="/library" className="underline">
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
              <p className="text-gray-500 text-sm">
                Select a reference image and click Generate to create your ad
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

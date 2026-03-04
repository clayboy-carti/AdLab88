'use client'

import { useState } from 'react'
import type { Ad } from './AdCard'

interface Props {
  ad: Ad
  onClose: () => void
  onIterationCreated: (newAd: Ad & { generatedImageUrl: string | null }) => void
}

export default function EditAdModal({ ad, onClose, onIterationCreated }: Props) {
  const [instruction, setInstruction] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!instruction.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_ad_id: ad.id,
          instruction: instruction.trim(),
          aspect_ratio: ad.aspect_ratio ?? '1:1',
          image_quality: ad.image_quality ?? '1K',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generation failed')
      onIterationCreated(json.ad)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
              Iterate
            </p>
            <h2 className="font-mono text-base font-semibold text-graphite mt-0.5">
              Edit This Ad
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-graphite/30 hover:text-graphite transition-colors text-xl leading-none px-1"
          >
            ×
          </button>
        </div>

        {/* Source ad preview */}
        {ad.signedUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border border-forest/10 aspect-video bg-paper/60">
            <img
              src={ad.signedUrl}
              alt={ad.hook}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="mb-3">
          <p className="text-xs font-mono text-graphite/40 uppercase tracking-widest mb-0.5">
            Original hook
          </p>
          <p className="font-mono text-xs text-graphite/70 italic">&ldquo;{ad.hook}&rdquo;</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-graphite/40 block mb-1.5">
              Edit Instruction
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              placeholder="e.g. Make the background darker, add more contrast, use a warmer color palette"
              required
              className="field-input resize-none w-full text-sm"
              autoFocus
            />
            <p className="text-xs font-mono text-graphite/30 mt-1">
              Describe what to change visually. Copy is preserved from the original.
            </p>
          </div>

          {error && (
            <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || !instruction.trim()}
              className="btn-primary flex-1 text-xs disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  Generating…
                </span>
              ) : (
                '⚡ Generate Iteration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import type { ConceptDirection } from '@/lib/ai/concepts'

const STAGE_COLORS: Record<string, string> = {
  awareness: 'bg-blue-50 text-blue-600 border-blue-200',
  consideration: 'bg-amber-50 text-amber-600 border-amber-200',
  conversion: 'bg-forest/10 text-forest border-forest/20',
  retention: 'bg-rust/10 text-rust border-rust/20',
}

export default function ConceptGeneratorPanel() {
  const [campaignContext, setCampaignContext] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [concepts, setConcepts] = useState<ConceptDirection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-library-image', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setUploadedUrl(json.ad?.signedUrl ?? json.signedUrl ?? json.url ?? null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!campaignContext.trim()) return
    setGenerating(true)
    setError(null)
    setConcepts([])
    try {
      const activeRef = uploadedUrl || referenceUrl.trim() || undefined
      const res = await fetch('/api/prompt/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_context: campaignContext.trim(),
          reference_url: activeRef,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Generation failed')
      setConcepts(json.concepts ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <form onSubmit={handleGenerate} className="card space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
          Campaign Context
        </p>
        <textarea
          value={campaignContext}
          onChange={(e) => setCampaignContext(e.target.value)}
          rows={3}
          placeholder="e.g. Summer sale launch — 30% off all products, targeting existing customers and lapsed buyers"
          required
          className="field-input resize-none w-full text-sm"
          autoFocus
        />

        {/* Optional reference */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40 mb-2">
            Reference Image <span className="text-graphite/25 normal-case tracking-normal">(optional — inspires visual direction)</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          {!uploadedUrl ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : '↑ Upload'}
              </button>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="or paste image URL"
                className="field-input flex-1 text-xs"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img src={uploadedUrl} alt="Reference" className="w-16 h-16 rounded-xl object-cover border border-forest/10" />
              <button
                type="button"
                onClick={() => setUploadedUrl(null)}
                className="text-xs font-mono text-graphite/40 hover:text-rust transition-colors"
              >
                × Remove
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={generating || !campaignContext.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
              Generating Concepts…
            </span>
          ) : (
            '💡 Generate 5 Concepts'
          )}
        </button>
      </form>

      {/* Concepts grid */}
      {concepts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">
            {concepts.length} Concept Directions
          </p>
          {concepts.map((concept, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-graphite">
                    {concept.type}
                  </span>
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STAGE_COLORS[concept.audienceStage] ?? 'bg-paper text-graphite/50 border-forest/20'}`}>
                    {concept.audienceStage}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copy(concept.promptTemplate, i)}
                  className="font-mono text-xs text-forest hover:text-forest/70 border border-forest/30 px-3 py-1 rounded-lg transition-colors shrink-0"
                >
                  {copiedIdx === i ? '✓ Copied' : 'Copy Prompt'}
                </button>
              </div>

              <p className="font-mono text-xs text-forest font-medium">{concept.angle}</p>
              <p className="font-mono text-[10px] text-graphite/50 italic">{concept.whyDistinct}</p>

              <div className="bg-paper/60 border border-forest/10 rounded-xl p-3">
                <p className="font-mono text-[11px] text-graphite leading-relaxed">
                  {concept.promptTemplate}
                </p>
              </div>

              <a
                href="/create/ad"
                className="inline-block font-mono text-xs text-rust hover:text-rust/70 transition-colors"
              >
                Use in Ad Generator →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

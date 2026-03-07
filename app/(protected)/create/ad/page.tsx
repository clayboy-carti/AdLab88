'use client'

import { emitCreditsUpdated } from '@/lib/credits-event'
import { useState, useEffect } from 'react'
import { useLabLoadingSequence } from '@/hooks/useLabLoadingSequence'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { BatchAdResult } from '@/components/create/BatchResultsGrid'
import type { BrandAsset } from '@/types/database'
import {
  FlaskConical, ImagePlus, CheckCircle, X, Maximize2, Monitor,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AssetWithUrl extends BrandAsset {
  signedUrl: string
}

interface StyleRef {
  id: string
  fileName: string
  previewUrl: string
}

const GEMINI_ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1',  tooltip: 'Instagram Feed · Facebook · LinkedIn' },
  { value: '4:5',  label: '4:5',  tooltip: 'Instagram Feed Portrait · Facebook' },
  { value: '4:3',  label: '4:3',  tooltip: 'Facebook · LinkedIn · Pinterest' },
  { value: '3:4',  label: '3:4',  tooltip: 'Pinterest · Facebook · Print' },
  { value: '16:9', label: '16:9', tooltip: 'YouTube · Twitter/X · LinkedIn · Facebook' },
  { value: '9:16', label: '9:16', tooltip: 'Instagram Stories & Reels · TikTok · YouTube Shorts' },
  { value: '3:2',  label: '3:2',  tooltip: 'Twitter/X · Blog headers' },
  { value: '2:3',  label: '2:3',  tooltip: 'Pinterest · Print' },
  { value: '5:4',  label: '5:4',  tooltip: 'Facebook · Print' },
  { value: '21:9', label: '21:9', tooltip: 'YouTube banners · Desktop headers' },
]

export default function AdPage() {
  // ── Inputs ───────────────────────────────────────────────────────────
  const [contextText, setContextText] = useState('')
  const [imageQuality, setImageQuality] = useState<'1K' | '2K'>('1K')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [creativity, setCreativity] = useState(2)
  const [title, setTitle] = useState('')

  // ── Style reference (upload-only) ────────────────────────────────────
  const [styleRef, setStyleRef] = useState<StyleRef | null>(null)
  const [uploadingStyle, setUploadingStyle] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // ── Product asset (from brand assets) ────────────────────────────────
  const [assets, setAssets] = useState<AssetWithUrl[]>([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [productId, setProductId] = useState<string | null>(null)

  // ── Generation ───────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false)
  const [generatedBatch, setGeneratedBatch] = useState<BatchAdResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const labLines = useLabLoadingSequence(generating)
  const supabase = createClient()

  useEffect(() => {
    loadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAssets() {
    setLoadingAssets(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('brand_assets')
      .select('id, user_id, storage_path, file_name, file_size, mime_type, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      const { data: urlData } = await supabase.storage
        .from('brand-assets')
        .createSignedUrls(data.map((a) => a.storage_path), 604800)
      const urlMap = new Map((urlData ?? []).map((u) => [u.path, u.signedUrl]))
      setAssets(data.map((asset) => ({ ...asset, signedUrl: urlMap.get(asset.storage_path) ?? '' })))
    }
    setLoadingAssets(false)
  }

  async function handleStyleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploadingStyle(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload failed')

      const newId = result.image?.id ?? result.id
      const previewUrl = result.image?.signedUrl ?? result.signedUrl ?? ''
      if (newId) setStyleRef({ id: newId, fileName: file.name, previewUrl })
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploadingStyle(false)
      e.target.value = ''
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setGeneratedBatch(null)

    try {
      const res = await fetch('/api/generate-persona-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style_reference_image_id: styleRef?.id,
          product_asset_id: productId,
          user_context: contextText.trim() || undefined,
          image_quality: imageQuality,
          aspect_ratio: aspectRatio,
          creativity,
          title: title.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setGeneratedBatch(data.ads)
      emitCreditsUpdated()
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = !generating && !!styleRef && !!productId && !!title.trim()

  const dotGrid = {
    backgroundImage: 'radial-gradient(circle, rgba(31,58,50,0.07) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <Link
          href="/create"
          className="inline-flex items-center gap-1 text-xs font-mono text-graphite/40 uppercase tracking-widest hover:text-rust transition-colors mb-3"
        >
          ← The Lab Bench
        </Link>
        <h1 className="text-3xl font-mono font-semibold text-graphite">Ad Generation</h1>
        <p className="text-xs font-mono text-graphite/40 mt-1">
          Upload a reference ad · select your product · generates one variation per persona.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 items-start overflow-y-auto lg:overflow-hidden pb-6">

        {/* ── LEFT — Controls ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col overflow-hidden h-full">

          {/* Card header */}
          <div className="px-6 pt-5 pb-4 border-b border-forest/10">
            <div className="flex items-center gap-2">
              <FlaskConical size={15} className="text-forest/50" strokeWidth={1.8} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite/60">Ad Setup</span>
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                Title <span className="text-rust">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Drop — Persona Set"
                maxLength={80}
                className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-3 text-sm font-mono focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              />
            </div>

            {/* Style Reference */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                Style Reference <span className="text-rust">*</span>
                <span className="ml-2 normal-case text-graphite/35 tracking-normal">— the ad to style after</span>
              </label>

              {styleRef ? (
                <div className="flex items-start gap-3 rounded-xl border border-forest/20 bg-paper p-3">
                  {styleRef.previewUrl && (
                    <img
                      src={styleRef.previewUrl}
                      alt={styleRef.fileName}
                      className="w-16 h-16 object-cover rounded-lg border border-forest/15 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-forest uppercase tracking-widest mb-0.5">✓ Uploaded</p>
                    <p className="text-xs font-mono text-graphite/50 truncate">{styleRef.fileName}</p>
                  </div>
                  <button
                    onClick={() => setStyleRef(null)}
                    className="text-graphite/30 hover:text-rust transition-colors flex-shrink-0 mt-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-forest/20 bg-paper p-5 cursor-pointer hover:border-rust/40 hover:bg-rust/5 transition-colors ${uploadingStyle ? 'opacity-60 pointer-events-none' : ''}`}>
                  <ImagePlus size={20} className="text-graphite/25" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-graphite/40 text-center">
                    {uploadingStyle ? 'Uploading…' : 'Drop an ad image here or click to upload'}
                  </span>
                  <span className="text-[10px] font-mono text-graphite/25">JPEG or PNG</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleStyleUpload}
                    disabled={uploadingStyle}
                  />
                </label>
              )}

              {uploadError && (
                <p className="text-[11px] font-mono text-rust">{uploadError}</p>
              )}
            </div>

            {/* Product Asset */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                  Product Asset <span className="text-rust">*</span>
                  <span className="ml-2 normal-case text-graphite/35 tracking-normal">— from brand assets</span>
                </label>
                <Link href="/brand" className="text-[11px] font-mono text-forest/50 hover:text-forest transition-colors">
                  + Add assets →
                </Link>
              </div>

              {loadingAssets ? (
                <div className="h-20 rounded-xl bg-paper animate-pulse" />
              ) : assets.length === 0 ? (
                <div className="rounded-xl border border-forest/15 bg-paper p-5 text-center">
                  <p className="text-xs font-mono text-graphite/40 mb-2">No brand assets yet.</p>
                  <Link href="/brand" className="text-xs font-mono text-forest hover:underline">
                    Go to Brand → Assets to upload your products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setProductId(asset.id === productId ? null : asset.id)}
                      title={asset.file_name}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        productId === asset.id
                          ? 'border-forest ring-2 ring-forest/20 scale-[0.97]'
                          : 'border-transparent hover:border-forest/30'
                      }`}
                    >
                      <img src={asset.signedUrl} alt={asset.file_name} className="w-full h-full object-cover" />
                      {productId === asset.id && (
                        <div className="absolute inset-0 bg-forest/15 flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {productId && (
                <p className="text-[11px] font-mono text-forest uppercase tracking-widest">
                  ✓ {assets.find((a) => a.id === productId)?.file_name}
                </p>
              )}
            </div>

            <div className="h-px bg-forest/10" />

            {/* Context brief */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">Context Brief</label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="e.g. 10% off first order · Free shipping · Summer sale"
                rows={2}
                maxLength={300}
                className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-3 text-sm font-mono resize-none focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              />
              <div className="text-right">
                <span className="text-[11px] font-mono text-graphite/25">{contextText.length} / 300</span>
              </div>
            </div>

            <div className="h-px bg-forest/10" />

            {/* Aspect ratio chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">Aspect Ratio</label>
              <div className="flex flex-wrap gap-1.5">
                {GEMINI_ASPECT_RATIOS.map((r) => (
                  <div key={r.value} className="relative group">
                    <button
                      onClick={() => setAspectRatio(r.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                        aspectRatio === r.value
                          ? 'bg-sage border-forest/30 text-forest font-semibold'
                          : 'border-forest/15 text-graphite/50 hover:border-forest/35 hover:text-graphite'
                      }`}
                    >
                      {r.label}
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-graphite text-paper text-[10px] font-mono whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                      {r.tooltip}
                      <div className="absolute top-full left-3 border-4 border-transparent border-t-graphite" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution + Creativity row */}
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

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                  Creativity — <span className="text-rust">{['', 'Strict', 'Balanced', 'Creative', 'Loose'][creativity]}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full accent-rust cursor-pointer mt-1"
                />
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-graphite/30">Follows style closely</span>
                  <span className="text-[10px] font-mono text-graphite/30">Freely reimagined</span>
                </div>
              </div>
            </div>

            {/* Generate CTA */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-rust text-white rounded-xl py-4 font-mono font-semibold text-sm tracking-wide hover:bg-[#9a4429] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating Persona Batch…' : 'Generate Persona Batch'}
            </button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[11px] font-mono uppercase text-red-500 mb-1">Error</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT — Preview Canvas ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col overflow-hidden h-full">

          {/* Canvas header */}
          <div className="px-6 py-4 border-b border-forest/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Monitor size={15} className="text-forest/35" strokeWidth={1.8} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite/40">Ad Preview</span>
            </div>
            <span className="text-[11px] font-mono bg-sage/20 text-forest/60 px-3 py-1 rounded-full border border-sage/30">
              Gemini · Ready
            </span>
          </div>

          {/* Canvas body */}
          <div className="flex-1 relative overflow-auto min-h-0">

            {/* Empty state */}
            {!generating && !generatedBatch && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5" style={dotGrid}>
                <div className="text-center">
                  <p className="text-sm font-mono text-graphite/40">Your persona batch will appear here</p>
                  <p className="text-[11px] font-mono text-graphite/25 mt-1">upload style ref · select product · generate</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8" style={dotGrid}>
                <div className="bg-white rounded-2xl border border-forest/15 shadow-sm p-6 w-full max-w-md flex flex-col items-center gap-5">
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
                    <p className="text-sm font-mono text-graphite/60 leading-tight mb-3">Running image experiment…</p>
                    <div className="space-y-2.5">
                      {labLines.filter((l) => l.status !== 'hidden').map((line, i) => (
                        <p
                          key={i}
                          className={
                            line.status === 'completed'
                              ? 'text-xs font-mono text-graphite/40'
                              : 'text-xs font-mono font-semibold text-rust animate-pulse'
                          }
                        >
                          {line.status === 'completed' ? `✓ ${line.text}` : `→ ${line.text}…`}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!generating && generatedBatch && (
              <div className="p-5 space-y-4">
                {/* Saved banner */}
                <div className="flex items-center justify-between rounded-xl bg-sage/15 border border-sage/25 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-forest" strokeWidth={2} />
                    <span className="text-xs font-mono text-forest uppercase tracking-wide">
                      {generatedBatch.filter((a) => !a.imageGenerationFailed).length}/{generatedBatch.length} Saved to Library
                    </span>
                  </div>
                  <a href="/library" className="text-xs font-mono text-rust hover:underline">View Library →</a>
                </div>

                {/* Batch grid */}
                <div className="grid grid-cols-2 gap-3">
                  {generatedBatch.map((ad, i) => (
                    <div key={ad.id ?? i} className="flex flex-col gap-1.5">
                      {ad.imageGenerationFailed ? (
                        <div className="aspect-square rounded-xl border border-red-200 bg-red-50 flex items-center justify-center p-3">
                          <p className="text-[10px] font-mono text-red-400 text-center">Generation failed</p>
                        </div>
                      ) : ad.generatedImageUrl ? (
                        <div className="relative group">
                          <img
                            src={ad.generatedImageUrl}
                            alt={ad.hook}
                            className="w-full aspect-square object-cover rounded-xl border border-forest/15"
                          />
                          <button
                            onClick={() => setPreviewUrl(ad.generatedImageUrl)}
                            className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-forest/20 rounded-lg px-2.5 py-1 text-xs font-mono text-graphite opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Maximize2 size={10} /> Expand
                          </button>
                        </div>
                      ) : (
                        <div className="aspect-square rounded-xl bg-paper border border-forest/10 animate-pulse" />
                      )}
                      {ad.framework_applied && (
                        <p className="text-[10px] font-mono text-graphite/35 uppercase tracking-wider truncate text-center">
                          {ad.framework_applied}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setGeneratedBatch(null); setError(null) }}
                  className="w-full rounded-xl border border-forest/20 py-3 text-sm font-mono text-graphite/50 hover:text-graphite hover:border-forest/40 transition-colors"
                >
                  Generate Another Batch
                </button>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="px-6 py-3 border-t border-forest/10 flex-shrink-0">
            <span className="text-[11px] font-mono text-graphite/25 uppercase tracking-widest">
              {aspectRatio} · {imageQuality} · Gemini · Persona Batch
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
    </div>
  )
}

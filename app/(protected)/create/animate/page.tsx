'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Film, Upload, ImagePlus, X, CheckCircle, LayoutGrid } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────
interface LibraryImage {
  id: string
  signedUrl: string
  storage_path: string
  title: string | null
  created_at: string
}

// ── Dot-grid background ───────────────────────────────────────────────────────
const dotGrid = {
  backgroundImage: 'radial-gradient(circle, rgba(31,58,50,0.07) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
}

function AnimateContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const preselectedAdId = searchParams.get('adId')

  // Image selection
  const [source, setSource] = useState<'library' | 'upload'>('library')
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null)

  // Upload path
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null)
  const [uploadedAdId, setUploadedAdId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video generation
  const [videoTitle, setVideoTitle] = useState('')
  const [motionPrompt, setMotionPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<{ id: string; videoUrl: string } | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  // ── Load library images on mount ────────────────────────────────────────────
  useEffect(() => {
    setLibraryLoading(true)
    supabase
      .from('generated_ads')
      .select('id, storage_path, title, created_at')
      .order('created_at', { ascending: false })
      .limit(48)
      .then(async ({ data, error }) => {
        if (error || !data) { setLibraryLoading(false); return }
        const paths = data.map((d) => d.storage_path).filter(Boolean) as string[]
        if (paths.length === 0) { setLibraryLoading(false); return }
        const { data: signed } = await supabase.storage
          .from('generated-ads')
          .createSignedUrls(paths, 3600)
        const urlMap = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))
        const images = data
          .filter((d) => d.storage_path && urlMap.get(d.storage_path))
          .map((d) => ({
            id: d.id,
            signedUrl: urlMap.get(d.storage_path)!,
            storage_path: d.storage_path,
            title: d.title,
            created_at: d.created_at,
          }))
        setLibraryImages(images)

        // Auto-select if we came from product mockup with an adId
        if (preselectedAdId) {
          const match = images.find((img) => img.id === preselectedAdId)
          if (match) {
            setSelectedAdId(match.id)
            setSelectedPreviewUrl(match.signedUrl)
          }
        }

        setLibraryLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle file upload ───────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setUploadedPreviewUrl(URL.createObjectURL(file))
    setUploadedAdId(null)
    setUploadError(null)

    // Upload to Supabase storage and insert a generated_ads row so the
    // generate-video API can fetch it via ad_id
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() ?? 'jpg'
      const storagePath = `${user.id}/animate-uploads/${Date.now()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('generated-ads')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (storageError) throw new Error(storageError.message)

      const { data: row, error: dbError } = await supabase
        .from('generated_ads')
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          title: file.name.replace(/\.[^.]+$/, ''),
          target_platform: 'animate_upload',
          content_type: 'image',
        })
        .select('id')
        .single()
      if (dbError || !row) throw new Error(dbError?.message ?? 'Failed to save image record')

      setUploadedAdId(row.id)
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Derived: the ad_id to use for video generation ──────────────────────────
  const activeAdId = source === 'library' ? selectedAdId : uploadedAdId
  const activePreviewUrl = source === 'library' ? selectedPreviewUrl : uploadedPreviewUrl
  const canGenerate = !!activeAdId && !!videoTitle.trim() && !generating

  // ── Generate video ───────────────────────────────────────────────────────────
  const handleGenerateVideo = async () => {
    if (!activeAdId) return
    setGenerating(true)
    setVideoError(null)
    setGeneratedVideo(null)

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: activeAdId,
          motion_prompt: motionPrompt.trim() || undefined,
          title: videoTitle.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Video generation failed')
      setGeneratedVideo({ id: data.video.id, videoUrl: data.video.videoUrl })
    } catch (err: any) {
      setVideoError(err.message || 'Failed to generate video')
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setGeneratedVideo(null)
    setVideoError(null)
    setVideoTitle('')
    setMotionPrompt('')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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
        <h1 className="text-3xl font-mono font-semibold text-graphite">Animate</h1>
        <p className="text-sm font-mono text-graphite/40 mt-1">Turn a still image into a 5-second video with Grok.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT — Image source + controls ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-5 pb-4 border-b border-forest/10">
            <div className="flex items-center gap-2 mb-3">
              <Film size={15} className="text-forest/50" strokeWidth={1.8} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite/60">Animation Setup</span>
            </div>

            {/* Source toggle */}
            <div className="flex rounded-xl border border-forest/15 overflow-hidden">
              <button
                onClick={() => setSource('library')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono transition-colors ${
                  source === 'library'
                    ? 'bg-forest text-white'
                    : 'text-graphite/50 hover:text-graphite hover:bg-forest/5'
                }`}
              >
                <LayoutGrid size={12} />
                From Library
              </button>
              <button
                onClick={() => setSource('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono transition-colors border-l border-forest/15 ${
                  source === 'upload'
                    ? 'bg-forest text-white'
                    : 'text-graphite/50 hover:text-graphite hover:bg-forest/5'
                }`}
              >
                <Upload size={12} />
                Upload Image
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">

            {/* ── Library picker ── */}
            {source === 'library' && (
              <div>
                {libraryLoading ? (
                  <div className="flex items-center justify-center h-40 text-xs font-mono text-graphite/30">
                    Loading library…
                  </div>
                ) : libraryImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <p className="text-xs font-mono text-graphite/40">No images in library yet.</p>
                    <Link href="/create/product-mockup" className="text-xs font-mono text-rust hover:underline">
                      Generate a mockup first →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                    {libraryImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => {
                          setSelectedAdId(img.id)
                          setSelectedPreviewUrl(img.signedUrl)
                        }}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedAdId === img.id
                            ? 'border-forest ring-2 ring-forest/20'
                            : 'border-transparent hover:border-forest/30'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.signedUrl} alt="" className="w-full h-full object-cover" />
                        {selectedAdId === img.id && (
                          <div className="absolute inset-0 bg-forest/20 flex items-center justify-center">
                            <CheckCircle size={18} className="text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Upload picker ── */}
            {source === 'upload' && (
              <div>
                {!uploadedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-xl border-2 border-dashed border-forest/20 flex flex-col items-center justify-center gap-2 hover:border-forest/40 hover:bg-forest/5 transition-all"
                  >
                    <ImagePlus size={24} className="text-forest/30" strokeWidth={1.5} />
                    <p className="text-xs font-mono text-graphite/40">Click to upload an image</p>
                    <p className="text-[10px] font-mono text-graphite/25">PNG, JPG, WEBP</p>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-forest/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedPreviewUrl!} alt="Uploaded" className="w-full h-auto max-h-56 object-contain bg-paper/50" />
                    <button
                      onClick={() => {
                        setUploadedFile(null)
                        setUploadedPreviewUrl(null)
                        setUploadedAdId(null)
                        setUploadError(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 p-1 bg-white/90 rounded-lg border border-forest/15 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <X size={12} className="text-graphite/50" />
                    </button>
                    {uploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <p className="text-xs font-mono text-graphite/60">Uploading…</p>
                      </div>
                    )}
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs font-mono text-red-500 mt-2">{uploadError}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            <div className="h-px bg-forest/10" />

            {/* Video title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                Video Title <span className="text-rust">*</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. Product Hero Animation"
                maxLength={80}
                className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              />
            </div>

            {/* Motion prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
                Motion <span className="text-graphite/40">(optional)</span>
              </label>
              <textarea
                value={motionPrompt}
                onChange={(e) => setMotionPrompt(e.target.value)}
                placeholder="e.g. slow 360° rotation · steam rising · camera pulls back"
                rows={2}
                className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-2.5 text-sm font-mono resize-none focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              />
            </div>

            {videoError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-mono text-red-500">{videoError}</p>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerateVideo}
              disabled={!canGenerate}
              className="w-full bg-forest text-white rounded-xl py-3 text-sm font-mono font-medium hover:bg-forest/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? 'Animating…' : 'Generate Video'}
            </button>

            {!activeAdId && (
              <p className="text-[10px] font-mono text-graphite/30 text-center -mt-2">
                {source === 'library' ? 'Select an image from your library above' : 'Upload an image above to get started'}
              </p>
            )}

          </div>
        </div>

        {/* ── RIGHT — Preview canvas ──────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-forest/20 shadow-sm flex flex-col"
          style={{ minHeight: '560px' }}
        >
          {/* Canvas header */}
          <div className="px-6 py-4 border-b border-forest/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Film size={15} className="text-forest/35" strokeWidth={1.8} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite/40">
                Preview
              </span>
            </div>
            <span className="text-[11px] font-mono bg-sage/20 text-forest/60 px-3 py-1 rounded-full border border-sage/30">
              Grok · 5s
            </span>
          </div>

          {/* Canvas body */}
          <div className="flex-1 relative">

            {/* Empty state — no image selected */}
            {!activePreviewUrl && !generating && !generatedVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={dotGrid}>
                <div className="w-16 h-16 rounded-2xl bg-forest/5 border border-forest/10 flex items-center justify-center">
                  <Film size={28} className="text-forest/20" strokeWidth={1.3} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-mono text-graphite/40">Select an image to animate</p>
                  <p className="text-[11px] font-mono text-graphite/25 mt-1">your video will appear here</p>
                </div>
              </div>
            )}

            {/* Selected image preview (before generating) */}
            {activePreviewUrl && !generating && !generatedVideo && (
              <div className="p-5">
                <div className="rounded-xl overflow-hidden border border-forest/15">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activePreviewUrl} alt="Selected image" className="w-full h-auto" />
                </div>
                <p className="text-[10px] font-mono text-graphite/30 text-center mt-3">
                  Image selected · add a title and hit Generate Video
                </p>
              </div>
            )}

            {/* Loading state */}
            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8" style={dotGrid}>
                <div className="bg-white rounded-2xl border border-forest/15 shadow-sm p-6 w-full max-w-xs flex flex-col items-center gap-5">
                  <div className="rounded-xl overflow-hidden border border-forest/15 w-full aspect-video bg-paper">
                    <video
                      src="/Generation_Loading.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-mono text-graphite/60 leading-tight mb-1">Animating with Grok Video…</p>
                    <p className="text-xs font-mono text-graphite/30">60–120 seconds. Hang tight.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {!generating && generatedVideo && (
              <div className="p-5 space-y-4">
                <video
                  src={generatedVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-xl border border-forest/15"
                />
                <div className="flex items-center justify-between rounded-xl bg-sage/15 border border-sage/25 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-forest" strokeWidth={2} />
                    <span className="text-xs font-mono text-forest uppercase tracking-wide">Saved to Library</span>
                  </div>
                  <a href="/library" className="text-xs font-mono text-rust hover:underline">View Library →</a>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-mono text-graphite/40 hover:text-rust transition-colors"
                >
                  ← Animate another image
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default function AnimatePage() {
  return (
    <Suspense>
      <AnimateContent />
    </Suspense>
  )
}

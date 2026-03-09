'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BrandAsset } from '@/types/database'

interface AssetWithUrl extends BrandAsset {
  signedUrl: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Called when the user picks an asset to use as reference */
  onSelect: (id: string, signedUrl: string) => void
}

export default function PhotoPicker({ isOpen, onClose, onSelect }: Props) {
  const [uploading, setUploading] = useState(false)
  const [assets, setAssets] = useState<AssetWithUrl[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) loadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const loadAssets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('brand_assets')
      .select('id, user_id, storage_path, file_name, file_size, mime_type, category, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      const paths = data.map((a) => a.storage_path)
      const { data: urlData } = await supabase.storage
        .from('brand-assets')
        .createSignedUrls(paths, 604800)

      const urlMap = new Map(
        (urlData ?? []).map((item) => [item.path, item.signedUrl])
      )

      setAssets(
        data.map((a) => ({
          ...a,
          signedUrl: urlMap.get(a.storage_path) ?? '',
        }))
      )
    } else {
      setAssets([])
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'product')

      const response = await fetch('/api/brand/assets', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed')

      e.target.value = ''
      await loadAssets()

      if (result.asset?.id && result.asset?.url) {
        onSelect(result.asset.id, result.asset.url)
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = (id: string, signedUrl: string) => {
    onSelect(id, signedUrl)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl border border-forest/50 shadow-lg w-full max-w-lg flex flex-col max-h-[80vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-forest/15 shrink-0">
          <h2 className="font-mono text-xs uppercase tracking-widest text-forest/70">
            Brand Asset Library
          </h2>
          <button
            onClick={onClose}
            className="text-graphite/40 hover:text-graphite transition-colors text-lg leading-none"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6 space-y-4">

          {/* Upload row */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-graphite/40">
              {assets.length === 0 ? 'No assets saved' : `${assets.length} in library`}
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="photo-picker-upload"
            />
            <label
              htmlFor="photo-picker-upload"
              className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${
                uploading
                  ? 'text-graphite/30 border-forest/15 cursor-not-allowed'
                  : 'text-forest/70 border-forest/30 hover:border-forest hover:text-forest cursor-pointer'
              }`}
            >
              {uploading ? 'Uploading…' : '+ Upload Asset'}
            </label>
          </div>

          {error && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-rust">{error}</p>
          )}

          {/* Empty state */}
          {assets.length === 0 && !uploading && (
            <div className="border border-dashed border-forest/20 rounded-xl py-10 text-center">
              <p className="font-mono text-xs text-graphite/40">
                No brand assets yet — upload one above or add assets from your Brand page.
              </p>
            </div>
          )}

          {/* Asset grid */}
          {assets.length > 0 && (
            <>
              <p className="font-mono text-[10px] uppercase tracking-widest text-graphite/40">
                Click an asset to use it as your product reference
              </p>
              <div className="grid grid-cols-4 gap-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => handleSelect(asset.id, asset.signedUrl)}
                    className="relative aspect-square border border-forest/20 rounded-xl cursor-pointer hover:border-rust/60 hover:shadow-md transition-all duration-200 overflow-hidden"
                    title={asset.file_name}
                  >
                    <img
                      src={asset.signedUrl}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                    />
                    {asset.category && asset.category !== 'other' && (
                      <span className="absolute bottom-1 left-1 font-mono text-[8px] uppercase tracking-widest bg-black/50 text-white px-1 py-0.5 rounded">
                        {asset.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

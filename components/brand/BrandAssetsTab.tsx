'use client'

import { useState, useEffect, useRef } from 'react'
import type { BrandAsset, AssetCategory } from '@/types/database'

const CATEGORIES: { value: AssetCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Product' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'logo', label: 'Logo' },
  { value: 'other', label: 'Other' },
]

const ASSET_CATEGORIES: AssetCategory[] = ['product', 'packaging', 'lifestyle', 'logo', 'other']

type AssetWithUrl = BrandAsset & { url: string | null }

export default function BrandAssetsTab() {
  const [assets, setAssets] = useState<AssetWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<AssetCategory | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAssets()
  }, [])

  async function fetchAssets() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/brand/assets')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load assets')
      setAssets(json.assets)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('category', 'other')
        const res = await fetch('/api/brand/assets', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Upload failed')
        setAssets((prev) => [json.asset, ...prev])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleCategoryChange(id: string, category: AssetCategory) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/brand/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, category } : a)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/brand/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Delete failed')
      }
      setAssets((prev) => prev.filter((a) => a.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filtered = filter === 'all' ? assets : assets.filter((a) => a.category === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-graphite/40">Brand Assets</p>
          <p className="text-sm font-mono text-graphite/60 mt-0.5">
            Product images, packaging, lifestyle photos, logos
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-xs disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Uploading…
              </span>
            ) : (
              '+ Upload Assets'
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-mono text-rust border border-rust/20 bg-rust/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setFilter(c.value)}
            className={`font-mono text-xs px-3 py-1 rounded-full border transition-colors ${
              filter === c.value
                ? 'bg-forest text-white border-forest'
                : 'border-forest/30 text-forest/60 hover:border-forest hover:text-forest'
            }`}
          >
            {c.label}
            {c.value !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {assets.filter((a) => a.category === c.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-forest/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-forest/20 rounded-xl">
          <p className="font-mono text-sm text-graphite/40">
            {assets.length === 0
              ? 'No assets yet — upload your first one'
              : 'No assets in this category'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              categories={ASSET_CATEGORIES}
              updating={updatingId === asset.id}
              onCategoryChange={handleCategoryChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AssetCard({
  asset,
  categories,
  updating,
  onCategoryChange,
  onDelete,
}: {
  asset: AssetWithUrl
  categories: AssetCategory[]
  updating: boolean
  onCategoryChange: (id: string, category: AssetCategory) => void
  onDelete: (id: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="group relative bg-white rounded-xl border border-forest/20 overflow-visible">
      <div className="aspect-square bg-paper/60 rounded-t-xl overflow-hidden">
        {asset.url ? (
          <img
            src={asset.url}
            alt={asset.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-graphite/20">
            No preview
          </div>
        )}
      </div>

      <div className="px-2 py-2 border-t border-forest/10">
        <p className="font-mono text-[10px] text-graphite/60 truncate mb-1.5">{asset.file_name}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            disabled={updating}
            className="font-mono text-[9px] uppercase tracking-widest text-forest/60 bg-paper border border-forest/20 rounded-full px-2 py-0.5 hover:border-forest/50 transition-colors"
          >
            {updating ? '…' : asset.category}
          </button>
          <button
            type="button"
            onClick={() => onDelete(asset.id)}
            className="text-graphite/20 hover:text-rust transition-colors text-sm leading-none opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </div>

        {showPicker && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-forest/20 rounded-lg shadow-lg z-10 p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onCategoryChange(asset.id, cat)
                  setShowPicker(false)
                }}
                className={`w-full text-left font-mono text-xs px-2 py-1.5 rounded hover:bg-paper transition-colors capitalize ${
                  asset.category === cat ? 'text-forest font-semibold' : 'text-graphite/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

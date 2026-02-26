'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReferenceImage } from '@/types/database'

interface ImageWithUrl extends ReferenceImage {
  signedUrl: string
}

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export default function PhotoPicker({ selectedId, onSelect }: Props) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<ImageWithUrl[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadImages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('reference_images')
      .select('id, user_id, storage_path, file_name, file_size, mime_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      const paths = data.map((img) => img.storage_path)
      const { data: urlData } = await supabase.storage
        .from('reference-images')
        .createSignedUrls(paths, 3600)

      const urlMap = new Map(
        (urlData ?? []).map((item) => [item.path, item.signedUrl])
      )

      setImages(
        data.map((img) => ({
          ...img,
          signedUrl: urlMap.get(img.storage_path) ?? '',
        }))
      )
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

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload failed')

      await loadImages()
      e.target.value = ''

      // Auto-select the newly uploaded photo
      if (result.image?.id) onSelect(result.image.id)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: string, storagePath: string) => {
    if (!confirm('Delete this photo from your library?')) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.storage.from('reference-images').remove([storagePath])
      await supabase.from('reference_images').delete().eq('id', imageId)

      // Clear selection if the deleted image was selected
      if (selectedId === imageId) onSelect(null)

      await loadImages()
    } catch {
      setError('Failed to delete photo')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
          {images.length === 0 ? 'No photos saved' : `${images.length} / 5 in library`}
        </span>

        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleUpload}
          disabled={uploading || images.length >= 5}
          className="hidden"
          id="photo-picker-upload"
        />
        <label
          htmlFor="photo-picker-upload"
          className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 border transition-colors ${
            images.length >= 5 || uploading
              ? 'text-gray-300 border-outline cursor-not-allowed'
              : 'text-gray-500 border-outline hover:text-rust hover:border-rust cursor-pointer'
          }`}
        >
          {uploading ? 'Uploading...' : '+ Upload New'}
        </label>
      </div>

      {error && <p className="font-mono text-xs text-red-500">{error}</p>}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="border border-dashed border-outline py-5 text-center">
          <p className="font-mono text-xs text-gray-400">
            Upload a product photo to use as a reference.
          </p>
        </div>
      )}

      {/* Library grid — click to select / deselect */}
      {images.length > 0 && (
        <>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
            Click a photo to select it
          </p>
          <div className="grid grid-cols-5 gap-2">
            {images.map((img) => {
              const isSelected = img.id === selectedId
              return (
                <div
                  key={img.id}
                  onClick={() => onSelect(isSelected ? null : img.id)}
                  className={`relative aspect-square border-2 cursor-pointer group transition-colors ${
                    isSelected ? 'border-rust' : 'border-outline hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.signedUrl}
                    alt={img.file_name}
                    className="w-full h-full object-cover"
                  />

                  {/* Selection overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-rust/10 pointer-events-none" />
                  )}

                  {/* Selection badge */}
                  {isSelected && (
                    <div className="absolute bottom-0 right-0 bg-rust text-white px-1 py-0.5 font-mono text-[8px] leading-none uppercase">
                      ✓
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(img.id, img.storage_path)
                    }}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-0.5"
                    title="Remove from library"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Selection status */}
          {selectedId ? (
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
                1 photo selected
              </span>
              <button
                onClick={() => onSelect(null)}
                className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-rust transition-colors"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 pt-0.5">
              No photo selected — generation will run without a reference
            </p>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReferenceImage } from '@/types/database'

interface ImageWithUrl extends ReferenceImage {
  signedUrl: string
}

interface Props {
  /** Called when the user picks an image — parent should close the panel */
  onSelect: (id: string, signedUrl: string) => void
}

export default function PhotoPicker({ onSelect }: Props) {
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

    if (data && data.length > 0) {
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
    } else {
      setImages([])
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

      // Get signed URL for the newly uploaded image, then auto-select + close
      const { data: signedUrlData } = await supabase.storage
        .from('reference-images')
        .createSignedUrl(result.image.storage_path, 3600)

      e.target.value = ''
      await loadImages()

      if (result.image?.id && signedUrlData?.signedUrl) {
        onSelect(result.image.id, signedUrlData.signedUrl)
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, imageId: string, storagePath: string) => {
    e.stopPropagation()
    if (!confirm('Remove this photo from your library?')) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.storage.from('reference-images').remove([storagePath])
      await supabase.from('reference_images').delete().eq('id', imageId)
      await loadImages()
    } catch {
      setError('Failed to delete photo')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
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
          {uploading ? 'Uploading...' : '+ Upload from Device'}
        </label>
      </div>

      {error && <p className="font-mono text-xs text-red-500">{error}</p>}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="border border-dashed border-outline py-5 text-center">
          <p className="font-mono text-xs text-gray-400">
            No saved photos yet — upload one above to get started.
          </p>
        </div>
      )}

      {/* Library grid */}
      {images.length > 0 && (
        <>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
            Click a photo to use it as your reference
          </p>
          <div className="grid grid-cols-5 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => onSelect(img.id, img.signedUrl)}
                className="relative aspect-square border border-outline cursor-pointer group hover:border-rust transition-colors"
              >
                <img
                  src={img.signedUrl}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                <button
                  onClick={(e) => handleDelete(e, img.id, img.storage_path)}
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-0.5"
                  title="Remove from library"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

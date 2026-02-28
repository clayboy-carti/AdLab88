'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReferenceImage } from '@/types/database'

interface ImageWithUrl extends ReferenceImage {
  signedUrl: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Called when the user picks an image to use as reference */
  onSelect: (id: string, signedUrl: string) => void
}

export default function PhotoPicker({ isOpen, onClose, onSelect }: Props) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<ImageWithUrl[]>([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) loadImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

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

      const { data: signedUrlData } = await supabase.storage
        .from('reference-images')
        .createSignedUrl(result.image.storage_path, 3600)

      e.target.value = ''
      await loadImages()

      if (result.image?.id && signedUrlData?.signedUrl) {
        onSelect(result.image.id, signedUrlData.signedUrl)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white border border-outline w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
            Reference Image Library
          </span>
          <button
            onClick={onClose}
            className="font-mono text-lg text-gray-400 hover:text-rust leading-none transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-4 space-y-3">

          {/* Upload row */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
              {images.length === 0 ? 'No photos saved' : `${images.length} in library`}
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="photo-picker-upload"
            />
            <label
              htmlFor="photo-picker-upload"
              className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1.5 border transition-colors ${
                uploading
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
            <div className="border border-dashed border-outline py-8 text-center">
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
              <div className="grid grid-cols-4 gap-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => handleSelect(img.id, img.signedUrl)}
                    className="relative aspect-square border border-outline cursor-pointer hover:border-rust transition-colors"
                    title={img.file_name}
                  >
                    <img
                      src={img.signedUrl}
                      alt={img.file_name}
                      className="w-full h-full object-cover"
                    />
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

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReferenceImage } from '@/types/database'

interface ImageWithUrl extends ReferenceImage {
  signedUrl: string
}

export default function ReferenceImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<ImageWithUrl[]>([])
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<ImageWithUrl | null>(null)
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

    const { data, error } = await supabase
      .from('reference_images')
      .select('id, user_id, storage_path, file_name, file_size, mime_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const paths = data.map((img) => img.storage_path)
      const { data: urlData } = await supabase.storage
        .from('reference-images')
        .createSignedUrls(paths, 3600)

      const urlMap = new Map(
        (urlData ?? []).map((item) => [item.path, item.signedUrl])
      )

      setImages(data.map((img) => ({
        ...img,
        signedUrl: urlMap.get(img.storage_path) ?? '',
      })))
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

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      await loadImages()
      e.target.value = ''
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: string, storagePath: string) => {
    if (!confirm('Delete this image?')) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.storage.from('reference-images').remove([storagePath])
      await supabase.from('reference_images').delete().eq('id', imageId)
      await loadImages()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete image')
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleUpload}
        disabled={uploading || images.length >= 5}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className={`block w-full text-center font-mono text-xs uppercase py-2.5 border transition-colors cursor-pointer ${
          images.length >= 5 || uploading
            ? 'bg-gray-100 text-gray-400 border-outline cursor-not-allowed'
            : 'bg-rust text-white border-rust hover:bg-[#9a4429]'
        }`}
      >
        {uploading ? 'UPLOADING...' : 'UPLOAD REFERENCE'}
      </label>

      <p className="font-mono text-xs text-gray-400 text-center">
        {images.length}/5 images · JPG / PNG · Max 5MB
      </p>

      {error && <p className="font-mono text-xs text-red-500">{error}</p>}

      {/* Image slots */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-1">
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`relative aspect-square border group ${
                index === 0 ? 'border-rust' : 'border-outline'
              }`}
            >
              <img
                src={img.signedUrl}
                alt={img.file_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewImage(img)}
              />
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-rust text-white px-1 py-0.5 font-mono text-[9px] leading-none">
                  ACTIVE
                </div>
              )}
              <button
                onClick={() => handleDelete(img.id, img.storage_path)}
                className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white p-0.5"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-full bg-white border-2 border-outline"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-rust text-white p-2 hover:bg-[#9a4429] transition-colors z-10"
              title="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={previewImage.signedUrl}
              alt={previewImage.file_name}
              className="max-w-full max-h-[80vh] object-contain"
            />

            <div className="p-4 border-t border-outline bg-paper">
              <p className="font-mono text-xs mb-3">{previewImage.file_name}</p>
              <button
                onClick={() => {
                  handleDelete(previewImage.id, previewImage.storage_path)
                  setPreviewImage(null)
                }}
                className="btn-secondary w-full"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

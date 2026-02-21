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
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const imagesWithUrls = await Promise.all(
        data.map(async (img) => {
          const { data: urlData } = await supabase.storage
            .from('reference-images')
            .createSignedUrl(img.storage_path, 3600)

          return {
            ...img,
            signedUrl: urlData?.signedUrl || '',
          }
        })
      )
      setImages(imagesWithUrls)
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
    <div className="space-y-4">
      <div className="border-2 border-dashed border-outline p-8 text-center bg-white">
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
          className={`cursor-pointer uppercase font-mono text-sm inline-block px-6 py-3 border border-outline ${
            images.length >= 5 || uploading
              ? 'opacity-50 cursor-not-allowed bg-gray-100'
              : 'bg-rust text-white hover:bg-[#9a4429]'
          }`}
        >
          {uploading ? 'UPLOADING...' : 'UPLOAD REFERENCE IMAGE'}
        </label>
        <p className="text-xs mt-3 text-gray-600">
          {images.length}/5 images • JPEG/PNG • Max 5MB
        </p>
        {error && <p className="text-xs mt-2 text-red-600">{error}</p>}
      </div>

      {images.length > 0 && (
        <div>
          <h3 className="text-sm uppercase font-mono mb-1">YOUR REFERENCE IMAGES</h3>
          <p className="text-xs text-gray-500 font-mono mb-3">
            All uploaded images are used — most recent takes priority
          </p>
          <div className="grid grid-cols-5 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`relative aspect-square border-2 transition-all group ${
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
                  <div className="absolute top-1 right-1 bg-rust text-white px-2 py-1 text-xs font-mono">
                    ACTIVE
                  </div>
                )}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(img.id, img.storage_path)}
                    className="p-1 bg-black text-white hover:bg-red-600 transition-colors"
                    title="Delete image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              className="absolute top-2 right-2 bg-black text-white p-2 hover:bg-red-600 transition-colors z-10"
              title="Close preview"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <img
              src={previewImage.signedUrl}
              alt={previewImage.file_name}
              className="max-w-full max-h-[80vh] object-contain"
            />

            <div className="p-4 border-t border-outline bg-paper">
              <p className="text-sm font-mono mb-3">{previewImage.file_name}</p>
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

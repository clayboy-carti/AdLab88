'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReferenceImage } from '@/types/database'

interface ReferenceImageUploadProps {
  onImageSelect: (imageId: string | null) => void
  selectedImageId: string | null
}

interface ImageWithUrl extends ReferenceImage {
  signedUrl: string
}

export default function ReferenceImageUpload({
  onImageSelect,
  selectedImageId,
}: ReferenceImageUploadProps) {
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
      // Generate signed URLs for each image
      const imagesWithUrls = await Promise.all(
        data.map(async (img) => {
          const { data: urlData } = await supabase.storage
            .from('reference-images')
            .createSignedUrl(img.storage_path, 3600) // 1 hour expiry

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
      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Upload via API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Reload images
      await loadImages()

      // Clear file input
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

      // Delete from storage
      await supabase.storage.from('reference-images').remove([storagePath])

      // Delete from database
      await supabase.from('reference_images').delete().eq('id', imageId)

      // Reload images
      await loadImages()

      // Clear selection if deleted image was selected
      if (selectedImageId === imageId) {
        onImageSelect(null)
      }
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
          <h3 className="text-sm uppercase font-mono mb-3">SELECT REFERENCE IMAGE</h3>
          <div className="grid grid-cols-5 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className={`relative aspect-square border-2 transition-all group ${
                  selectedImageId === img.id
                    ? 'border-rust shadow-lg'
                    : 'border-outline hover:border-gray-400'
                }`}
              >
                <img
                  src={img.signedUrl}
                  alt={img.file_name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewImage(img)}
                />
                {selectedImageId === img.id && (
                  <div className="absolute top-1 right-1 bg-rust text-white px-2 py-1 text-xs font-mono">
                    SELECTED
                  </div>
                )}
                <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                      onImageSelect(selectedImageId === img.id ? null : img.id)
                    }
                    className={`flex-1 p-1 text-white text-xs font-mono transition-colors ${
                      selectedImageId === img.id
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-rust hover:bg-[#9a4429]'
                    }`}
                    title={selectedImageId === img.id ? 'Deselect' : 'Select'}
                  >
                    {selectedImageId === img.id ? 'DESELECT' : 'SELECT'}
                  </button>
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
            {/* Close button */}
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

            {/* Image */}
            <img
              src={previewImage.signedUrl}
              alt={previewImage.file_name}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* Image info and actions */}
            <div className="p-4 border-t border-outline bg-paper">
              <p className="text-sm font-mono mb-3">{previewImage.file_name}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onImageSelect(previewImage.id)
                    setPreviewImage(null)
                  }}
                  className="btn-primary flex-1"
                >
                  {selectedImageId === previewImage.id
                    ? 'SELECTED ✓'
                    : 'SELECT THIS IMAGE'}
                </button>
                <button
                  onClick={() => {
                    handleDelete(previewImage.id, previewImage.storage_path)
                    setPreviewImage(null)
                  }}
                  className="btn-secondary"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
        disabled={uploading}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className={`block w-full text-center font-mono text-xs uppercase tracking-widest py-2.5 rounded-xl border transition-colors cursor-pointer ${
          uploading
            ? 'bg-forest/5 text-graphite/30 border-forest/15 cursor-not-allowed'
            : 'bg-rust text-white border-rust hover:bg-[#9a4429]'
        }`}
      >
        {uploading ? 'Uploading…' : 'Upload Reference'}
      </label>

      <p className="font-mono text-[10px] uppercase tracking-widest text-graphite/40 text-center">
        {images.length} {images.length === 1 ? 'image' : 'images'} · JPG / PNG · Max 5MB
      </p>

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-rust">{error}</p>
      )}

      {/* Image slots */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-1">
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`relative aspect-square border rounded-xl overflow-hidden group ${
                index === 0 ? 'border-rust' : 'border-forest/20'
              }`}
            >
              <img
                src={img.signedUrl}
                alt={img.file_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewImage(img)}
              />
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-rust text-white px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest rounded-md leading-none">
                  Active
                </div>
              )}
              <button
                onClick={() => handleDelete(img.id, img.storage_path)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-graphite/80 text-white p-1 rounded-lg"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-8"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-full bg-white rounded-2xl border border-forest/50 shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 text-graphite/40 hover:text-graphite transition-colors text-lg leading-none z-10 bg-white/80 rounded-lg p-1"
              title="Close preview"
            >
              ✕
            </button>

            <img
              src={previewImage.signedUrl}
              alt={previewImage.file_name}
              className="max-w-full max-h-[70vh] object-contain"
            />

            <div className="px-6 py-4 border-t border-forest/15 bg-paper flex items-center justify-between gap-4">
              <p className="font-mono text-xs text-graphite/60 truncate">{previewImage.file_name}</p>
              <button
                onClick={() => {
                  handleDelete(previewImage.id, previewImage.storage_path)
                  setPreviewImage(null)
                }}
                className="btn-secondary text-xs px-4 py-2 shrink-0"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

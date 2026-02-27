'use client'

import { useEffect, useRef, useState } from 'react'
import type { Ad } from './AdCard'
import type { Folder } from './LibraryGrid'

interface Props {
  file: File
  folders: Folder[]
  onClose: () => void
  onUploaded: (ad: Ad, newFolder?: Folder) => void
}

export default function UploadImageModal({ file, folders, onClose, onUploaded }: Props) {
  const previewUrl = useRef(URL.createObjectURL(file))

  const [title, setTitle] = useState(() => file.name.replace(/\.[^.]+$/, '') || 'Uploaded Image')
  const [caption, setCaption] = useState('')
  const [campaignValue, setCampaignValue] = useState('') // '' = none, '__new__' = create, else folder id
  const [newCampaignName, setNewCampaignName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Revoke preview URL on unmount
  useEffect(() => {
    const url = previewUrl.current
    return () => URL.revokeObjectURL(url)
  }, [])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = async () => {
    setError(null)
    setUploading(true)

    try {
      let folderId: string | null = null
      let newFolder: Folder | undefined

      // Create campaign first if requested
      if (campaignValue === '__new__') {
        const name = newCampaignName.trim()
        if (!name) {
          setError('Please enter a campaign name.')
          setUploading(false)
          return
        }
        const res = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to create campaign.')
          setUploading(false)
          return
        }
        newFolder = json.folder as Folder
        folderId = newFolder.id
      } else if (campaignValue) {
        folderId = campaignValue
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim() || file.name)
      formData.append('caption', caption)
      if (folderId) formData.append('folderId', folderId)

      const res = await fetch('/api/upload-library-image', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Upload failed.')
        setUploading(false)
        return
      }

      onUploaded(json.ad, newFolder)
    } catch {
      setError('Something went wrong. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl border border-forest/50 shadow-lg w-full max-w-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-forest/15">
          <h2 className="font-mono text-xs uppercase tracking-widest text-forest/70">Upload Image</h2>
          <button
            onClick={onClose}
            className="text-graphite/40 hover:text-graphite transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-6 p-6">

          {/* Preview */}
          <div className="w-40 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl.current}
              alt="Preview"
              className="w-full h-40 object-cover rounded-xl border border-forest/25"
            />
            <p className="text-[10px] font-mono text-graphite/40 mt-2 truncate" title={file.name}>
              {file.name}
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Title */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-forest/60 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Image title"
                className="field-input"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-forest/60 mb-1.5">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional caption for this image…"
                rows={3}
                className="field-input resize-none"
              />
            </div>

            {/* Campaign */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-forest/60 mb-1.5">Campaign</label>
              <select
                value={campaignValue}
                onChange={(e) => { setCampaignValue(e.target.value); setNewCampaignName('') }}
                className="field-input"
              >
                <option value="">No campaign</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
                <option value="__new__">+ Create new campaign</option>
              </select>

              {campaignValue === '__new__' && (
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Campaign name"
                  autoFocus
                  className="field-input mt-2"
                />
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-forest/15">
          {error
            ? <p className="text-[10px] font-mono text-rust uppercase">{error}</p>
            : <span />
          }
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className={`btn-primary text-xs px-4 py-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

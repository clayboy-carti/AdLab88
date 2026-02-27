'use client'

import { useMemo, useRef, useState } from 'react'
import AdCard, { type Ad } from './AdCard'
import AdSetCard from './AdSetCard'
import AdSetModal from './AdSetModal'
import AdModal from './AdModal'
import VideoCard, { type VideoItem } from './VideoCard'
import VideoModal from './VideoModal'
import CarouselModal from './CarouselModal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Folder {
  id: string
  name: string
  created_at: string
}

export interface CarouselSelItem {
  id: string
  type: 'ad' | 'video'
  signedUrl: string | null
  title?: string | null
}

// ─── Feed grouping ────────────────────────────────────────────────────────────

type FeedItem =
  | { type: 'single'; ad: Ad }
  | { type: 'set'; batchId: string; ads: Ad[] }

function buildFeed(ads: Ad[]): FeedItem[] {
  const batchMap = new Map<string, Ad[]>()
  const order: Array<{ kind: 'single'; ad: Ad } | { kind: 'batch'; batchId: string }> = []
  const seen = new Set<string>()

  for (const ad of ads) {
    if (ad.batch_id) {
      if (!seen.has(ad.batch_id)) {
        seen.add(ad.batch_id)
        order.push({ kind: 'batch', batchId: ad.batch_id })
        batchMap.set(ad.batch_id, [])
      }
      batchMap.get(ad.batch_id)!.push(ad)
    } else {
      order.push({ kind: 'single', ad })
    }
  }

  return order.map((entry) =>
    entry.kind === 'single'
      ? { type: 'single', ad: entry.ad }
      : { type: 'set', batchId: entry.batchId, ads: batchMap.get(entry.batchId)! }
  )
}

// ─── Unified date-sorted feed for "All" tab ───────────────────────────────────

type UnifiedItem =
  | { kind: 'ad'; item: FeedItem; date: string }
  | { kind: 'video'; video: VideoItem; date: string }

function buildUnifiedFeed(adFeed: FeedItem[], videos: VideoItem[]): UnifiedItem[] {
  const items: UnifiedItem[] = []

  for (const item of adFeed) {
    const date = item.type === 'single' ? item.ad.created_at : (item.ads[0]?.created_at ?? '')
    items.push({ kind: 'ad', item, date })
  }

  for (const video of videos) {
    items.push({ kind: 'video', video, date: video.created_at })
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return items
}

// ─── Component ───────────────────────────────────────────────────────────────

type Filter = 'all' | 'images' | 'videos'
type DragPayload = { adIds: string[]; videoIds: string[] }

export default function LibraryGrid({
  initialAds,
  initialVideos = [],
  initialFolders = [],
}: {
  initialAds: Ad[]
  initialVideos?: VideoItem[]
  initialFolders?: Folder[]
}) {
  // ── Asset state ──
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos)
  const [filter, setFilter] = useState<Filter>('all')

  // ── Folder state ──
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)

  // ── Folder CRUD UI ──
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  // ── Drag-and-drop ──
  // null = no drag-over target; 'all' = All Assets zone; UUID = specific folder
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  // ── Modals ──
  const [selectedSet, setSelectedSet] = useState<{ batchId: string; ads: Ad[] } | null>(null)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)

  // ── Carousel mode ──
  const [carouselMode, setCarouselMode] = useState(false)
  const [carouselItems, setCarouselItems] = useState<CarouselSelItem[]>([])
  const [showCarouselModal, setShowCarouselModal] = useState(false)

  // ── Image upload ──
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!e.target) return
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-library-image', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setUploadError(json.error ?? 'Upload failed')
      } else {
        setAds((prev) => [json.ad, ...prev])
      }
    } catch {
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Filtered assets ──
  const filteredAds = activeFolderId
    ? ads.filter((a) => a.folder_id === activeFolderId)
    : ads
  const filteredVideos = activeFolderId
    ? videos.filter((v) => v.folder_id === activeFolderId)
    : videos

  const adFeed = useMemo(() => buildFeed(filteredAds), [filteredAds])
  const unifiedFeed = useMemo(() => buildUnifiedFeed(adFeed, filteredVideos), [adFeed, filteredVideos])

  // ── Per-folder asset counts (for sidebar labels) ──
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const ad of ads) {
      if (ad.folder_id) counts.set(ad.folder_id, (counts.get(ad.folder_id) ?? 0) + 1)
    }
    for (const video of videos) {
      if (video.folder_id) counts.set(video.folder_id, (counts.get(video.folder_id) ?? 0) + 1)
    }
    return counts
  }, [ads, videos])

  // Keep selectedSet in sync with ads state (e.g. after a delete)
  const liveSetAds = selectedSet
    ? ads.filter((a) => a.batch_id === selectedSet.batchId)
    : null

  // ── Ad/video update handlers ──
  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, caption: newCaption } : a)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, caption: newCaption } : prev))
  }

  const handleAdTitleUpdate = (adId: string, newTitle: string) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, title: newTitle } : a)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, title: newTitle } : prev))
  }

  const handleVideoTitleUpdate = (videoId: string, newTitle: string) => {
    setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, title: newTitle } : v)))
    setSelectedVideo((prev) => (prev?.id === videoId ? { ...prev, title: newTitle } : prev))
  }

  const handleDelete = (adId: string) => {
    setAds((prev) => prev.filter((a) => a.id !== adId))
    setSelectedAd(null)
    if (selectedSet) {
      const remaining = ads.filter((a) => a.id !== adId && a.batch_id === selectedSet.batchId)
      if (remaining.length === 0) setSelectedSet(null)
    }
  }

  const handleVariantClick = (ad: Ad) => setSelectedAd(ad)

  const toggleCarouselItem = (item: CarouselSelItem) => {
    setCarouselItems((prev) => {
      const exists = prev.find((i) => i.id === item.id)
      if (exists) return prev.filter((i) => i.id !== item.id)
      if (prev.length >= 10) return prev  // Instagram max
      return [...prev, item]
    })
  }

  const exitCarouselMode = () => {
    setCarouselMode(false)
    setCarouselItems([])
    setShowCarouselModal(false)
  }

  const handleVideoDelete = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId))
    setSelectedVideo(null)
  }

  // ── Drag-and-drop ──
  const handleDragStart = (e: React.DragEvent, payload: DragPayload) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTarget(target)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the actual drop zone (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTarget(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    setDragOverTarget(null)
    try {
      const { adIds, videoIds }: DragPayload = JSON.parse(e.dataTransfer.getData('text/plain'))
      await fetch('/api/folders/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, adIds, videoIds }),
      })
      if (adIds.length > 0) {
        setAds((prev) => prev.map((a) => adIds.includes(a.id) ? { ...a, folder_id: folderId } : a))
      }
      if (videoIds.length > 0) {
        setVideos((prev) => prev.map((v) => videoIds.includes(v.id) ? { ...v, folder_id: folderId } : v))
      }
    } catch {
      // silent — user can retry
    }
  }

  const handleRemoveFromCampaign = async (adIds: string[], videoIds: string[]) => {
    await fetch('/api/folders/move', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: null, adIds, videoIds }),
    })
    if (adIds.length > 0) setAds((prev) => prev.map((a) => adIds.includes(a.id) ? { ...a, folder_id: null } : a))
    if (videoIds.length > 0) setVideos((prev) => prev.map((v) => videoIds.includes(v.id) ? { ...v, folder_id: null } : v))
  }

  // ── Folder CRUD ──
  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    setCreatingFolder(false)
    setNewFolderName('')
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      alert(`A campaign named "${name}" already exists.`)
      return
    }
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const { folder } = await res.json()
      setFolders((prev) => [...prev, folder])
      setActiveFolderId(folder.id)
    }
  }

  const startRename = (folder: Folder) => {
    setRenamingFolderId(folder.id)
    setRenameValue(folder.name)
  }

  const handleRenameFolder = async (folderId: string) => {
    const name = renameValue.trim()
    setRenamingFolderId(null)
    if (!name) return
    if (folders.some((f) => f.id !== folderId && f.name.toLowerCase() === name.toLowerCase())) {
      alert(`A campaign named "${name}" already exists.`)
      return
    }
    const res = await fetch(`/api/folders/${folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, name } : f))
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' })
    if (res.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId))
      setAds((prev) => prev.map((a) => a.folder_id === folderId ? { ...a, folder_id: null } : a))
      setVideos((prev) => prev.map((v) => v.folder_id === folderId ? { ...v, folder_id: null } : v))
      if (activeFolderId === folderId) setActiveFolderId(null)
    }
  }

  // ── Helpers ──
  const activeFolderName = activeFolderId ? folders.find((f) => f.id === activeFolderId)?.name : null
  const totalCount = ads.length + videos.length

  return (
    <div className="flex gap-8 items-start">

      {/* ── Campaign / Folder sidebar ── */}
      <aside className="hidden md:flex flex-col w-44 flex-shrink-0 sticky top-8 max-h-[calc(100vh-5rem)] overflow-y-auto gap-1">
        <p className="text-[10px] font-mono uppercase text-gray-400 tracking-widest mb-2">Campaigns</p>

        {/* All Assets drop zone */}
        <div
          onDragOver={(e) => handleDragOver(e, 'all')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`rounded-sm transition-colors ${dragOverTarget === 'all' ? 'bg-rust/10 ring-1 ring-rust' : ''}`}
        >
          <button
            onClick={() => setActiveFolderId(null)}
            className={`w-full text-left px-3 py-2 text-xs font-mono uppercase transition-colors rounded-sm ${
              activeFolderId === null
                ? 'bg-graphite text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Assets
            <span className={`ml-1.5 ${activeFolderId === null ? 'text-gray-300' : 'text-gray-400'}`}>
              ({totalCount})
            </span>
          </button>
        </div>

        {/* Folder list */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
            className={`group relative rounded-sm transition-colors ${
              dragOverTarget === folder.id ? 'bg-rust/10 ring-1 ring-rust' : ''
            }`}
          >
            {renamingFolderId === folder.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFolder(folder.id)
                  if (e.key === 'Escape') setRenamingFolderId(null)
                }}
                onBlur={() => handleRenameFolder(folder.id)}
                className="w-full px-3 py-2 text-xs font-mono border border-rust bg-white focus:outline-none rounded-sm"
              />
            ) : (
              <button
                onClick={() => setActiveFolderId(folder.id)}
                className={`w-full text-left px-3 py-2.5 text-[11px] font-bold font-mono uppercase tracking-wider transition-all rounded border-2 pr-14 shadow-sm ${
                  activeFolderId === folder.id
                    ? 'bg-rust border-rust text-white shadow-rust/30'
                    : 'bg-rust/8 border-rust/60 text-rust hover:bg-rust/15 hover:border-rust'
                }`}
              >
                <span className="block truncate">{folder.name}</span>
                <span className={`text-[10px] font-normal ${activeFolderId === folder.id ? 'text-white/60' : 'text-rust/60'}`}>
                  ({folderCounts.get(folder.id) ?? 0})
                </span>
              </button>
            )}

            {/* Rename + delete icons (visible on hover) */}
            {renamingFolderId !== folder.id && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={() => startRename(folder)}
                  title="Rename"
                  className={`p-1 transition-colors ${activeFolderId === folder.id ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-rust'}`}
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  title="Delete campaign"
                  className={`p-1 transition-colors ${activeFolderId === folder.id ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* New Campaign input / button */}
        {creatingFolder ? (
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
            }}
            onBlur={handleCreateFolder}
            placeholder="Campaign name…"
            className="w-full px-3 py-2 text-xs font-mono border border-rust bg-white focus:outline-none rounded-sm placeholder:text-gray-300"
          />
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="w-full text-left px-3 py-2 text-xs font-mono text-gray-400 hover:text-rust transition-colors uppercase"
          >
            + New Campaign
          </button>
        )}

        {/* Drag hint */}
        <p className="text-[9px] font-mono text-gray-300 uppercase mt-3 leading-relaxed px-1">
          Drag cards to a campaign to organize them
        </p>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">

        {/* Filter tabs + active campaign badge */}
        <div className="flex items-center gap-2 mb-6 border-b border-outline pb-4 flex-wrap">
          {(['all', 'images', 'videos'] as Filter[]).map((f) => {
            const count =
              f === 'all'
                ? filteredAds.length + filteredVideos.length
                : f === 'images'
                ? filteredAds.length
                : filteredVideos.length
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-mono uppercase px-3 py-1.5 border transition-colors ${
                  filter === f
                    ? 'border-graphite bg-graphite text-white'
                    : 'border-outline text-gray-500 hover:border-graphite'
                }`}
              >
                {f} ({count})
              </button>
            )
          })}

          {activeFolderName && (
            <span className="ml-auto flex items-center gap-2 text-xs font-mono text-gray-500 border border-outline px-3 py-1.5">
              <FolderIcon />
              {activeFolderName}
              <button
                onClick={() => setActiveFolderId(null)}
                className="text-gray-400 hover:text-graphite transition-colors"
                title="Back to all assets"
              >
                ✕
              </button>
            </span>
          )}

          {activeFolderId && !carouselMode && (
            <button
              onClick={() => { setCarouselMode(true); setCarouselItems([]) }}
              className="ml-auto flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:border-rust hover:text-rust transition-colors"
              title="Select images and videos to build a carousel post"
            >
              <CarouselIcon />
              Create Carousel
            </button>
          )}

          {!carouselMode && (
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                className={`flex items-center gap-1.5 text-xs font-mono uppercase border px-3 py-1.5 transition-colors ${
                  uploading
                    ? 'border-outline text-gray-300 cursor-not-allowed'
                    : 'border-outline text-gray-500 hover:border-graphite hover:text-graphite'
                } ${activeFolderName ? '' : 'ml-auto'}`}
                title="Upload an image to your library"
              >
                <UploadIcon />
                {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
            </>
          )}

          {carouselMode && (
            <button
              onClick={exitCarouselMode}
              className="ml-auto text-xs font-mono uppercase text-gray-400 hover:text-graphite transition-colors px-3 py-1.5"
            >
              Cancel
            </button>
          )}

          {uploadError && (
            <span className="w-full text-[10px] font-mono text-rust uppercase mt-1">
              {uploadError}
            </span>
          )}
        </div>

        {/* Empty state for folder */}
        {activeFolderId && filteredAds.length === 0 && filteredVideos.length === 0 && (
          <div className="border border-outline border-dashed p-12 text-center">
            <p className="text-xs font-mono uppercase text-gray-400 mb-2">Campaign is empty</p>
            <p className="text-[11px] font-mono text-gray-300">Drag assets here to add them to this campaign</p>
          </div>
        )}

        {/* ── Library grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filter === 'all' && unifiedFeed.map((item) => {
            if (item.kind === 'video') {
              const selIdx = carouselItems.findIndex((i) => i.id === item.video.id)
              return (
                <div key={item.video.id} className="relative group">
                  <div
                    draggable={!carouselMode}
                    onDragStart={!carouselMode ? (e) => handleDragStart(e, { adIds: [], videoIds: [item.video.id] }) : undefined}
                    className={!carouselMode ? 'cursor-grab active:cursor-grabbing' : undefined}
                  >
                    <VideoCard video={item.video} onClick={!carouselMode ? () => setSelectedVideo(item.video) : () => {}} />
                  </div>
                  {activeFolderId && !carouselMode && (
                    <button
                      onClick={() => handleRemoveFromCampaign([], [item.video.id])}
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase text-gray-500 hover:text-rust hover:border-rust"
                    >
                      Remove
                    </button>
                  )}
                  {carouselMode && (
                    <CarouselOverlay
                      selIdx={selIdx}
                      onToggle={() => toggleCarouselItem({ id: item.video.id, type: 'video', signedUrl: item.video.signedUrl, title: item.video.title })}
                      atMax={carouselItems.length >= 10}
                    />
                  )}
                </div>
              )
            }
            const feedItem = item.item
            if (feedItem.type === 'set') {
              return (
                <div key={feedItem.batchId} className="relative group">
                  <div
                    draggable={!carouselMode}
                    onDragStart={!carouselMode ? (e) => handleDragStart(e, { adIds: feedItem.ads.map((a) => a.id), videoIds: [] }) : undefined}
                    className={!carouselMode ? 'cursor-grab active:cursor-grabbing' : undefined}
                  >
                    <AdSetCard
                      ads={feedItem.ads}
                      onClick={() => !carouselMode && setSelectedSet({ batchId: feedItem.batchId, ads: feedItem.ads })}
                    />
                  </div>
                  {activeFolderId && !carouselMode && (
                    <button
                      onClick={() => handleRemoveFromCampaign(feedItem.ads.map((a) => a.id), [])}
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase text-gray-500 hover:text-rust hover:border-rust"
                    >
                      Remove
                    </button>
                  )}
                  {carouselMode && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-mono uppercase text-white bg-black/60 px-2 py-1">Open to pick individually</span>
                    </div>
                  )}
                </div>
              )
            }
            const selIdx = carouselItems.findIndex((i) => i.id === feedItem.ad.id)
            return (
              <div key={feedItem.ad.id} className="relative group">
                <div
                  draggable={!carouselMode}
                  onDragStart={!carouselMode ? (e) => handleDragStart(e, { adIds: [feedItem.ad.id], videoIds: [] }) : undefined}
                  className={!carouselMode ? 'cursor-grab active:cursor-grabbing' : undefined}
                >
                  <AdCard ad={feedItem.ad} onClick={!carouselMode ? () => setSelectedAd(feedItem.ad) : () => {}} />
                </div>
                {activeFolderId && !carouselMode && (
                  <button
                    onClick={() => handleRemoveFromCampaign([feedItem.ad.id], [])}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase text-gray-500 hover:text-rust hover:border-rust"
                  >
                    Remove
                  </button>
                )}
                {carouselMode && (
                  <CarouselOverlay
                    selIdx={selIdx}
                    onToggle={() => toggleCarouselItem({ id: feedItem.ad.id, type: 'ad', signedUrl: feedItem.ad.signedUrl, title: feedItem.ad.title })}
                    atMax={carouselItems.length >= 10}
                  />
                )}
              </div>
            )
          })}

          {filter === 'images' && adFeed.map((item) => {
            if (item.type === 'set') {
              return (
                <div key={item.batchId} className="relative group">
                  <div
                    draggable={!carouselMode}
                    onDragStart={!carouselMode ? (e) => handleDragStart(e, { adIds: item.ads.map((a) => a.id), videoIds: [] }) : undefined}
                    className={!carouselMode ? 'cursor-grab active:cursor-grabbing' : undefined}
                  >
                    <AdSetCard
                      ads={item.ads}
                      onClick={() => !carouselMode && setSelectedSet({ batchId: item.batchId, ads: item.ads })}
                    />
                  </div>
                  {activeFolderId && !carouselMode && (
                    <button
                      onClick={() => handleRemoveFromCampaign(item.ads.map((a) => a.id), [])}
                      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase text-gray-500 hover:text-rust hover:border-rust"
                    >
                      Remove
                    </button>
                  )}
                  {carouselMode && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-mono uppercase text-white bg-black/60 px-2 py-1">Open to pick individually</span>
                    </div>
                  )}
                </div>
              )
            }
            const selIdx = carouselItems.findIndex((i) => i.id === item.ad.id)
            return (
              <div key={item.ad.id} className="relative group">
                <div
                  draggable={!carouselMode}
                  onDragStart={!carouselMode ? (e) => handleDragStart(e, { adIds: [item.ad.id], videoIds: [] }) : undefined}
                  className={!carouselMode ? 'cursor-grab active:cursor-grabbing' : undefined}
                >
                  <AdCard ad={item.ad} onClick={!carouselMode ? () => setSelectedAd(item.ad) : () => {}} />
                </div>
                {activeFolderId && !carouselMode && (
                  <button
                    onClick={() => handleRemoveFromCampaign([item.ad.id], [])}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase text-gray-500 hover:text-rust hover:border-rust"
                  >
                    Remove
                  </button>
                )}
                {carouselMode && (
                  <CarouselOverlay
                    selIdx={selIdx}
                    onToggle={() => toggleCarouselItem({ id: item.ad.id, type: 'ad', signedUrl: item.ad.signedUrl, title: item.ad.title })}
                    atMax={carouselItems.length >= 10}
                  />
                )}
              </div>
            )
          })}

          {filter === 'videos' && filteredVideos.map((video) => {
            const selIdx = carouselItems.findIndex((i) => i.id === video.id)
            return (
              <div key={video.id} className="relative group">
                <div
                  draggable={!carouselMode}
                  onDragStart={!carouselMode ? (e) => handleDragStart(e, { adIds: [], videoIds: [video.id] }) : undefined}
                  className={!carouselMode ? 'cursor-grab active:cursor-grabbing' : undefined}
                >
                  <VideoCard video={video} onClick={!carouselMode ? () => setSelectedVideo(video) : () => {}} />
                </div>
                {activeFolderId && !carouselMode && (
                  <button
                    onClick={() => handleRemoveFromCampaign([], [video.id])}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase text-gray-500 hover:text-rust hover:border-rust"
                  >
                    Remove
                  </button>
                )}
                {carouselMode && (
                  <CarouselOverlay
                    selIdx={selIdx}
                    onToggle={() => toggleCarouselItem({ id: video.id, type: 'video', signedUrl: video.signedUrl, title: video.title })}
                    atMax={carouselItems.length >= 10}
                  />
                )}
              </div>
            )
          })}

        </div>

        {/* ── Carousel selection sticky bar ── */}
        {carouselMode && (
          <div className="sticky bottom-0 left-0 right-0 z-40 bg-graphite border-t-2 border-rust shadow-lg px-6 py-4 flex items-center gap-4 mt-6">
            <span className="text-xs font-mono text-white uppercase">
              {carouselItems.length === 0
                ? 'Click items to select them'
                : `${carouselItems.length}/10 item${carouselItems.length !== 1 ? 's' : ''} selected`}
            </span>
            {carouselItems.length > 0 && (
              <button
                onClick={() => setCarouselItems([])}
                className="text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase"
              >
                Clear
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={exitCarouselMode}
                className="text-xs font-mono uppercase text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCarouselModal(true)}
                disabled={carouselItems.length < 2}
                className="text-xs font-mono uppercase bg-rust text-white px-4 py-2 hover:bg-rust/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Build Carousel ({carouselItems.length}) →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Level 1: Set variant picker ── */}
      {selectedSet && liveSetAds && liveSetAds.length > 0 && !selectedAd && (
        <AdSetModal
          ads={liveSetAds}
          onClose={() => setSelectedSet(null)}
          onVariantClick={handleVariantClick}
        />
      )}

      {/* ── Level 2: Ad detail / edit ── */}
      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onCaptionUpdate={handleCaptionUpdate}
          onTitleUpdate={handleAdTitleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* ── Video detail modal ── */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleVideoDelete}
          onTitleUpdate={handleVideoTitleUpdate}
        />
      )}

      {/* ── Carousel builder modal ── */}
      {showCarouselModal && (
        <CarouselModal
          items={carouselItems}
          onItemsChange={setCarouselItems}
          onClose={() => setShowCarouselModal(false)}
          onScheduled={exitCarouselMode}
        />
      )}
    </div>
  )
}

// ─── Carousel overlay ─────────────────────────────────────────────────────────

function CarouselOverlay({
  selIdx,
  onToggle,
  atMax,
}: {
  selIdx: number
  onToggle: () => void
  atMax: boolean
}) {
  const selected = selIdx !== -1
  return (
    <div
      onClick={onToggle}
      title={!selected && atMax ? 'Maximum 10 items per carousel' : undefined}
      className={[
        'absolute inset-0 cursor-pointer transition-all',
        selected
          ? 'bg-rust/20 ring-2 ring-inset ring-rust'
          : atMax
          ? 'bg-black/10 cursor-not-allowed'
          : 'bg-transparent hover:bg-rust/10',
      ].join(' ')}
    >
      {/* Order badge */}
      {selected && (
        <span className="absolute top-2 left-2 bg-rust text-white text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
          {selIdx + 1}
        </span>
      )}
      {/* Checkbox */}
      <span
        className={[
          'absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center shadow transition-all',
          selected ? 'bg-rust border-rust' : 'bg-white border-gray-300',
        ].join(' ')}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CarouselIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <rect x="3" y="5" width="12" height="14" />
      <path d="M17 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
      <path d="M1 7H3" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

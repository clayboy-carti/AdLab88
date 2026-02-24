'use client'

import { useMemo, useState } from 'react'
import AdCard, { type Ad } from './AdCard'
import AdSetCard from './AdSetCard'
import AdSetModal from './AdSetModal'
import AdModal from './AdModal'
import VideoCard, { type VideoItem } from './VideoCard'
import VideoModal from './VideoModal'

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

export default function LibraryGrid({
  initialAds,
  initialVideos = [],
}: {
  initialAds: Ad[]
  initialVideos?: VideoItem[]
}) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos)
  const [filter, setFilter] = useState<Filter>('all')

  // Two modal levels: set picker → ad detail
  const [selectedSet, setSelectedSet] = useState<{ batchId: string; ads: Ad[] } | null>(null)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)

  const adFeed = useMemo(() => buildFeed(ads), [ads])
  const unifiedFeed = useMemo(() => buildUnifiedFeed(adFeed, videos), [adFeed, videos])

  // Keep selectedSet in sync with ads state (e.g. after a delete)
  const liveSetAds = selectedSet
    ? ads.filter((a) => a.batch_id === selectedSet.batchId)
    : null

  // ── Update handlers (work for both singles and set variants) ──
  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, caption: newCaption } : a)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, caption: newCaption } : prev))
  }

  const handleHookUpdate = (adId: string, newHook: string) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, hook: newHook } : a)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, hook: newHook } : prev))
  }

  const handleCtaUpdate = (adId: string, newCta: string) => {
    setAds((prev) => prev.map((a) => (a.id === adId ? { ...a, cta: newCta } : a)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, cta: newCta } : prev))
  }

  const handleDelete = (adId: string) => {
    setAds((prev) => prev.filter((a) => a.id !== adId))
    setSelectedAd(null)
    // If the set we're viewing is now empty, close it too
    if (selectedSet) {
      const remaining = ads.filter((a) => a.id !== adId && a.batch_id === selectedSet.batchId)
      if (remaining.length === 0) setSelectedSet(null)
    }
  }

  const handleVariantClick = (ad: Ad) => {
    setSelectedAd(ad)
  }

  const handleVideoDelete = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId))
    setSelectedVideo(null)
  }

  return (
    <>
      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-6 border-b border-outline pb-4">
        {(['all', 'images', 'videos'] as Filter[]).map((f) => {
          const count = f === 'all' ? ads.length + videos.length : f === 'images' ? ads.length : videos.length
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
      </div>

      {/* ── Library grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filter === 'all' && unifiedFeed.map((item) => {
          if (item.kind === 'video') {
            return <VideoCard key={item.video.id} video={item.video} onClick={() => setSelectedVideo(item.video)} />
          }
          const feedItem = item.item
          if (feedItem.type === 'set') {
            return (
              <AdSetCard
                key={feedItem.batchId}
                ads={feedItem.ads}
                onClick={() => setSelectedSet({ batchId: feedItem.batchId, ads: feedItem.ads })}
              />
            )
          }
          return (
            <AdCard key={feedItem.ad.id} ad={feedItem.ad} onClick={() => setSelectedAd(feedItem.ad)} />
          )
        })}

        {filter === 'images' && adFeed.map((item) =>
          item.type === 'set' ? (
            <AdSetCard
              key={item.batchId}
              ads={item.ads}
              onClick={() => setSelectedSet({ batchId: item.batchId, ads: item.ads })}
            />
          ) : (
            <AdCard key={item.ad.id} ad={item.ad} onClick={() => setSelectedAd(item.ad)} />
          )
        )}

        {filter === 'videos' && videos.map((video) => (
          <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} />
        ))}
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
          onHookUpdate={handleHookUpdate}
          onCtaUpdate={handleCtaUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* ── Video detail modal ── */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDelete={handleVideoDelete}
        />
      )}
    </>
  )
}

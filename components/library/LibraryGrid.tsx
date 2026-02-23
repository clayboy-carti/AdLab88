'use client'

import { useMemo, useState } from 'react'
import AdCard, { type Ad } from './AdCard'
import AdSetCard from './AdSetCard'
import AdSetModal from './AdSetModal'
import AdModal from './AdModal'

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function LibraryGrid({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)

  // Two modal levels: set picker → ad detail
  const [selectedSet, setSelectedSet] = useState<{ batchId: string; ads: Ad[] } | null>(null)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)

  const feed = useMemo(() => buildFeed(ads), [ads])

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

  return (
    <>
      {/* ── Library grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {feed.map((item) =>
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
    </>
  )
}

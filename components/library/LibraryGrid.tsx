'use client'

import { useMemo, useState } from 'react'
import AdCard, { type Ad } from './AdCard'
import AdModal from './AdModal'
import AdSetSection from './AdSetSection'

// ─── Feed types ──────────────────────────────────────────────────────────────

type SetItem = { type: 'set'; batchId: string; ads: Ad[] }
type SinglesRowItem = { type: 'singles-row'; ads: Ad[] }
type FeedItem = SetItem | SinglesRowItem

function buildFeed(ads: Ad[]): FeedItem[] {
  // Group batch ads by batch_id, preserving first-seen order
  const batchMap = new Map<string, Ad[]>()
  const singlesAndBatchOrder: Array<{ kind: 'single'; ad: Ad } | { kind: 'batch'; batchId: string }> = []
  const seenBatches = new Set<string>()

  for (const ad of ads) {
    if (ad.batch_id) {
      if (!seenBatches.has(ad.batch_id)) {
        seenBatches.add(ad.batch_id)
        singlesAndBatchOrder.push({ kind: 'batch', batchId: ad.batch_id })
        batchMap.set(ad.batch_id, [])
      }
      batchMap.get(ad.batch_id)!.push(ad)
    } else {
      singlesAndBatchOrder.push({ kind: 'single', ad })
    }
  }

  // Collapse consecutive singles into singles-row blocks
  const feed: FeedItem[] = []
  let pendingSingles: Ad[] = []

  for (const entry of singlesAndBatchOrder) {
    if (entry.kind === 'single') {
      pendingSingles.push(entry.ad)
    } else {
      if (pendingSingles.length > 0) {
        feed.push({ type: 'singles-row', ads: pendingSingles })
        pendingSingles = []
      }
      feed.push({ type: 'set', batchId: entry.batchId, ads: batchMap.get(entry.batchId)! })
    }
  }

  if (pendingSingles.length > 0) {
    feed.push({ type: 'singles-row', ads: pendingSingles })
  }

  return feed
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LibraryGrid({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)

  const feed = useMemo(() => buildFeed(ads), [ads])

  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, caption: newCaption } : ad)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, caption: newCaption } : prev))
  }

  const handleHookUpdate = (adId: string, newHook: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, hook: newHook } : ad)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, hook: newHook } : prev))
  }

  const handleCtaUpdate = (adId: string, newCta: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, cta: newCta } : ad)))
    setSelectedAd((prev) => (prev?.id === adId ? { ...prev, cta: newCta } : prev))
  }

  const handleDelete = (adId: string) => {
    setAds((prev) => prev.filter((ad) => ad.id !== adId))
    setSelectedAd(null)
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {feed.map((item, idx) =>
          item.type === 'set' ? (
            <AdSetSection
              key={item.batchId}
              ads={item.ads}
              onAdClick={(ad) => setSelectedAd(ad)}
            />
          ) : (
            <div key={`singles-${idx}`} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {item.ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} onClick={() => setSelectedAd(ad)} />
              ))}
            </div>
          )
        )}
      </div>

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

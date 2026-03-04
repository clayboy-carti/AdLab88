export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LibraryGrid from '@/components/library/LibraryGrid'

export default async function LibraryPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch ads, videos, and folders in parallel
  const [adsResult, videosResult, foldersResult] = await Promise.all([
    supabase
      .from('generated_ads')
      .select('id, user_id, batch_id, positioning_angle, hook, caption, cta, storage_path, framework_applied, target_platform, created_at, image_quality, aspect_ratio, folder_id, title, signed_url, signed_url_expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('generated_videos')
      .select('id, source_ad_id, motion_prompt, storage_path, created_at, folder_id, title, signed_url, signed_url_expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (adsResult.error) {
    console.error('[Library] Failed to fetch ads:', adsResult.error)
  }
  if (videosResult.error) {
    console.error('[Library] Failed to fetch videos:', videosResult.error)
  }
  if (foldersResult.error) {
    console.error('[Library] Failed to fetch folders:', foldersResult.error)
  }

  const adList = adsResult.data ?? []
  const videoList = videosResult.data ?? []
  const folderList = foldersResult.data ?? []

  // Only regenerate signed URLs that are missing or expiring within 1 day
  const refreshThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const isStale = (item: { signed_url?: string | null; signed_url_expires_at?: string | null }) =>
    !item.signed_url || !item.signed_url_expires_at || new Date(item.signed_url_expires_at) < refreshThreshold

  const staleAds = adList.filter((ad) => ad.storage_path && isStale(ad))
  const staleVideos = videoList.filter((v) => v.storage_path && isStale(v))
  const stalePaths = [
    ...staleAds.map((ad) => ad.storage_path as string),
    ...staleVideos.map((v) => v.storage_path as string),
  ]

  let freshUrlMap = new Map<string, string>()
  if (stalePaths.length > 0) {
    const { data: signedUrlData } = await supabase.storage
      .from('generated-ads')
      .createSignedUrls(stalePaths, 604800)

    if (signedUrlData) {
      freshUrlMap = new Map(signedUrlData.map((item) => [item.path, item.signedUrl]))

      // Persist fresh URLs back to DB so next load reuses them
      const newExpiry = new Date(Date.now() + 604800 * 1000).toISOString()
      await Promise.all([
        ...staleAds.map((ad) => {
          const url = freshUrlMap.get(ad.storage_path!)
          if (!url) return Promise.resolve()
          return supabase.from('generated_ads').update({ signed_url: url, signed_url_expires_at: newExpiry }).eq('id', ad.id)
        }),
        ...staleVideos.map((v) => {
          const url = freshUrlMap.get(v.storage_path!)
          if (!url) return Promise.resolve()
          return supabase.from('generated_videos').update({ signed_url: url, signed_url_expires_at: newExpiry }).eq('id', v.id)
        }),
      ])
    }
  }

  const adsWithUrls = adList.map((ad) => ({
    ...ad,
    signedUrl: ad.storage_path
      ? (freshUrlMap.get(ad.storage_path) ?? ad.signed_url ?? null)
      : null,
  }))

  const videosWithUrls = videoList.map((video) => ({
    ...video,
    signedUrl: video.storage_path
      ? (freshUrlMap.get(video.storage_path) ?? video.signed_url ?? null)
      : null,
  }))

  const totalCount = adsWithUrls.length + videosWithUrls.length

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-mono header-accent">Lab Records</h1>
        {totalCount > 0 && (
          <span className="text-xs font-mono text-graphite/40 bg-white border border-forest/20 px-2.5 py-1 rounded-full shadow-sm uppercase">
            {totalCount} item{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="bg-white rounded-2xl border border-forest/20 shadow-sm text-center py-16 px-8">
          <p className="text-graphite/40 uppercase font-mono text-sm mb-5">
            No content generated yet
          </p>
          <a href="/create" className="btn-primary inline-block">
            Create your first ad
          </a>
        </div>
      ) : (
        <LibraryGrid
          initialAds={adsWithUrls}
          initialVideos={videosWithUrls}
          initialFolders={folderList}
        />
      )}
    </div>
  )
}

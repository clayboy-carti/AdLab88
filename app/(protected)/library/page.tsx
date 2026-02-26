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
      .select('id, user_id, batch_id, positioning_angle, hook, caption, cta, storage_path, framework_applied, target_platform, created_at, image_quality, aspect_ratio, folder_id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('generated_videos')
      .select('id, source_ad_id, motion_prompt, storage_path, created_at, folder_id, title')
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

  // Generate signed URLs for ads and videos in parallel
  const adPaths = adList.map((ad) => ad.storage_path).filter(Boolean) as string[]
  const videoPaths = videoList.map((v) => v.storage_path).filter(Boolean) as string[]
  const allPaths = [...adPaths, ...videoPaths]

  const { data: signedUrlData } = allPaths.length > 0
    ? await supabase.storage.from('generated-ads').createSignedUrls(allPaths, 3600)
    : { data: [] }

  const urlMap = new Map(
    (signedUrlData ?? []).map((item) => [item.path, item.signedUrl])
  )

  const adsWithUrls = adList.map((ad) => ({
    ...ad,
    signedUrl: ad.storage_path ? (urlMap.get(ad.storage_path) ?? null) : null,
  }))

  const videosWithUrls = videoList.map((video) => ({
    ...video,
    signedUrl: video.storage_path ? (urlMap.get(video.storage_path) ?? null) : null,
  }))

  const totalCount = adsWithUrls.length + videosWithUrls.length

  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-mono header-accent">Lab Records</h1>
        {totalCount > 0 && (
          <span className="text-sm font-mono text-gray-500 uppercase">
            {totalCount} item{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-16 border border-outline bg-white">
          <p className="text-gray-500 uppercase font-mono text-sm mb-4">
            No content generated yet
          </p>
          <a href="/create" className="btn-primary inline-block">
            CREATE YOUR FIRST AD
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

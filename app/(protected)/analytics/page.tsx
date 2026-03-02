export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import type { PostAnalytic } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch post analytics joined with scheduled posts and ad details
  const { data: rows, error } = await supabase
    .from('post_analytics')
    .select(`
      id,
      scheduled_post_id,
      late_post_id,
      platform,
      views,
      likes,
      comments,
      shares,
      reach,
      impressions,
      clicks,
      saves,
      fetched_at,
      created_at,
      scheduled_posts (
        caption,
        scheduled_for,
        status,
        generated_ads (
          title,
          hook,
          storage_path
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Analytics] Failed to fetch analytics:', error)
  }

  const rowList = rows ?? []

  // Batch-generate signed URLs for ad thumbnails
  const storagePaths = rowList
    .map((r) => (r.scheduled_posts as any)?.generated_ads?.storage_path)
    .filter(Boolean) as string[]

  const { data: signedUrlData } = storagePaths.length > 0
    ? await supabase.storage.from('generated-ads').createSignedUrls(storagePaths, 3600)
    : { data: [] }

  const urlMap = new Map(
    (signedUrlData ?? []).map((item) => [item.path, item.signedUrl])
  )

  const analytics: PostAnalytic[] = rowList.map((row) => {
    const sp = row.scheduled_posts as any
    const ad = sp?.generated_ads ?? null
    const storagePath = ad?.storage_path ?? null
    return {
      id: row.id,
      scheduled_post_id: row.scheduled_post_id,
      late_post_id: row.late_post_id ?? null,
      platform: row.platform,
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      reach: row.reach ?? 0,
      impressions: row.impressions ?? 0,
      clicks: row.clicks ?? 0,
      saves: row.saves ?? 0,
      fetched_at: row.fetched_at ?? null,
      created_at: row.created_at,
      caption: sp?.caption ?? null,
      scheduled_for: sp?.scheduled_for ?? null,
      status: sp?.status ?? null,
      ad_title: ad?.title ?? null,
      ad_hook: ad?.hook ?? null,
      signedUrl: storagePath ? (urlMap.get(storagePath) ?? null) : null,
    }
  })

  return (
    <div className="w-full p-4 lg:p-8">
      <AnalyticsDashboard analytics={analytics} />
    </div>
  )
}

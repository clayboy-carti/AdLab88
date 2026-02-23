export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Calendar from '@/components/schedule/Calendar'
import type { ScheduledPost } from '@/components/schedule/Calendar'

export default async function SchedulePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rows, error } = await supabase
    .from('scheduled_posts')
    .select(`
      id, scheduled_for, platform, caption, status, ad_id,
      generated_ads (
        hook, cta, positioning_angle, target_platform, framework_applied, created_at, storage_path
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
    .order('scheduled_for', { ascending: true })

  if (error) {
    console.error('[Schedule] Failed to fetch scheduled posts:', error)
  }

  // Batch-generate signed URLs in one request
  const rowList = rows || []
  const storagePaths = rowList
    .map((r) => (r.generated_ads as any)?.storage_path)
    .filter(Boolean) as string[]

  const { data: signedUrlData } = storagePaths.length > 0
    ? await supabase.storage.from('generated-ads').createSignedUrls(storagePaths, 3600)
    : { data: [] }

  const urlMap = new Map(
    (signedUrlData ?? []).map((item) => [item.path, item.signedUrl])
  )

  const posts: ScheduledPost[] = rowList.map((row) => {
    const ad = row.generated_ads as any
    return {
      id: row.id,
      date: row.scheduled_for,
      platform: row.platform,
      caption: row.caption,
      status: row.status,
      adId: row.ad_id,
      hook: ad?.hook ?? undefined,
      cta: ad?.cta ?? undefined,
      positioning_angle: ad?.positioning_angle ?? undefined,
      target_platform: ad?.target_platform ?? undefined,
      framework_applied: ad?.framework_applied ?? undefined,
      ad_created_at: ad?.created_at ?? undefined,
      storage_path: ad?.storage_path ?? null,
      signedUrl: ad?.storage_path ? (urlMap.get(ad.storage_path) ?? null) : null,
    }
  })

  return (
    <div className="w-full p-4 lg:p-8">
      <h1 className="text-3xl uppercase font-mono header-accent mb-8">SCHEDULE</h1>
      <Calendar posts={posts} />
    </div>
  )
}

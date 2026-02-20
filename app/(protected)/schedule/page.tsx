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

  // Generate signed URLs for each ad image
  const posts: ScheduledPost[] = await Promise.all(
    (rows || []).map(async (row) => {
      const ad = row.generated_ads as any
      let signedUrl: string | null = null

      if (ad?.storage_path) {
        const { data } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(ad.storage_path, 3600)
        signedUrl = data?.signedUrl ?? null
      }

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
        signedUrl,
      }
    })
  )

  return (
    <div className="w-full p-4 lg:p-8">
      <h1 className="text-3xl uppercase font-mono header-accent mb-8">SCHEDULE</h1>
      <Calendar posts={posts} />
    </div>
  )
}

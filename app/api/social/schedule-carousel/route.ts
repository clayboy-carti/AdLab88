import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createLatePost, deleteLatePost, type LatePlatform, type LateMediaItem } from '@/lib/late'

const CAROUSEL_MIN = 2
const CAROUSEL_MAX = 10

export type CarouselItemRef = { id: string; type: 'ad' | 'video' }

// ── POST: schedule a carousel ─────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { items, caption, scheduledFor, platforms } = body as {
    items: CarouselItemRef[]
    caption?: string
    scheduledFor: string
    platforms?: LatePlatform[]
  }

  if (!items || items.length < CAROUSEL_MIN) {
    return NextResponse.json(
      { error: `A carousel requires at least ${CAROUSEL_MIN} items` },
      { status: 400 }
    )
  }
  if (items.length > CAROUSEL_MAX) {
    return NextResponse.json(
      { error: `A carousel supports at most ${CAROUSEL_MAX} items` },
      { status: 400 }
    )
  }
  if (!scheduledFor) {
    return NextResponse.json({ error: 'scheduledFor is required' }, { status: 400 })
  }

  // ── Verify ownership + collect storage_paths ─────────────────────────────

  const adIds    = items.filter((i) => i.type === 'ad').map((i) => i.id)
  const videoIds = items.filter((i) => i.type === 'video').map((i) => i.id)

  const storagePaths: Record<string, string> = {}  // itemId → storage_path

  if (adIds.length > 0) {
    const { data: ads, error: adErr } = await supabase
      .from('generated_ads')
      .select('id, storage_path')
      .in('id', adIds)
      .eq('user_id', user.id)

    if (adErr || !ads || ads.length !== adIds.length) {
      return NextResponse.json({ error: 'One or more ads not found or access denied' }, { status: 404 })
    }
    for (const ad of ads) storagePaths[ad.id] = ad.storage_path
  }

  if (videoIds.length > 0) {
    const { data: videos, error: vidErr } = await supabase
      .from('generated_videos')
      .select('id, storage_path')
      .in('id', videoIds)
      .eq('user_id', user.id)

    if (vidErr || !videos || videos.length !== videoIds.length) {
      return NextResponse.json({ error: 'One or more videos not found or access denied' }, { status: 404 })
    }
    for (const vid of videos) storagePaths[vid.id] = vid.storage_path
  }

  // ── Insert scheduled_posts row ────────────────────────────────────────────

  const accountIds = platforms?.map((p) => p.accountId) ?? []

  const { data: post, error: dbError } = await supabase
    .from('scheduled_posts')
    .insert({
      user_id: user.id,
      scheduled_for: scheduledFor,
      platform: 'carousel',
      post_type: 'carousel',
      caption: caption || '',
      status: 'scheduled',
      platforms: accountIds,
      carousel_item_ids: items,
    })
    .select()
    .single()

  if (dbError || !post) {
    console.error('[ScheduleCarousel] DB error:', dbError)
    return NextResponse.json({ error: 'Failed to save scheduled post' }, { status: 500 })
  }

  // ── Late API integration ──────────────────────────────────────────────────

  let lateStatus: 'skipped' | 'success' | 'error' = 'skipped'
  let lateError: string | null = null
  let lateSkipReason: 'no_api_key' | 'no_platforms' | null = null

  if (!process.env.LATE_API_KEY) {
    lateStatus = 'skipped'
    lateSkipReason = 'no_api_key'
    console.log('[ScheduleCarousel] LATE_API_KEY not set — skipping Late API call')
  } else if (!platforms || platforms.length === 0) {
    lateStatus = 'skipped'
    lateSkipReason = 'no_platforms'
    console.log('[ScheduleCarousel] No platforms selected — skipping Late API call')
  } else {
    try {
      // Build signed URLs in order (30-day TTL)
      const mediaItems: LateMediaItem[] = []

      for (const item of items) {
        const storagePath = storagePaths[item.id]
        if (!storagePath) continue

        const { data: signed } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(storagePath, 30 * 24 * 60 * 60)

        if (signed?.signedUrl) {
          mediaItems.push({ type: item.type === 'video' ? 'video' : 'image', url: signed.signedUrl })
        }
      }

      if (mediaItems.length < CAROUSEL_MIN) {
        throw new Error('Could not generate signed URLs for enough carousel items')
      }

      // Normalise scheduledFor to full ISO-8601
      const scheduledAtISO = scheduledFor.includes('T')
        ? `${scheduledFor}:00Z`
        : `${scheduledFor}T12:00:00Z`

      console.log('[ScheduleCarousel] Sending', mediaItems.length, 'media items to Late')

      const latePost = await createLatePost({
        content: caption || '',
        scheduledFor: scheduledAtISO,
        timezone: 'UTC',
        platforms,
        mediaItems,
      })

      const latePostId = latePost._id ?? latePost.id
      console.log('[ScheduleCarousel] late_post_id:', latePostId)

      if (latePostId) {
        await supabase
          .from('scheduled_posts')
          .update({ late_post_id: latePostId })
          .eq('id', post.id)
      }

      lateStatus = 'success'
    } catch (err: any) {
      console.error('[ScheduleCarousel] Late API error:', err.message)
      lateStatus = 'error'
      lateError = err.message
    }
  }

  return NextResponse.json({ post, lateStatus, lateSkipReason, lateError }, { status: 201 })
}

// ── DELETE: cancel a carousel post ───────────────────────────────────────────

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: existingPost } = await supabase
    .from('scheduled_posts')
    .select('id, late_post_id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  const latePostId = (existingPost as any)?.late_post_id

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel post' }, { status: 500 })
  }

  let lateDeleteStatus: 'skipped' | 'success' | 'error' | 'no_id' = 'skipped'
  if (!process.env.LATE_API_KEY) {
    lateDeleteStatus = 'skipped'
  } else if (!latePostId) {
    lateDeleteStatus = 'no_id'
  } else {
    try {
      await deleteLatePost(latePostId)
      lateDeleteStatus = 'success'
    } catch (e: any) {
      console.error('[UnscheduleCarousel] Could not delete Late post:', e.message)
      lateDeleteStatus = 'error'
    }
  }

  return NextResponse.json({ success: true, lateDeleteStatus })
}

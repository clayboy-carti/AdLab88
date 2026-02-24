import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createLatePost, deleteLatePost, type LatePlatform } from '@/lib/late'

// ── GET: check if a video is already scheduled ────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('scheduled_posts')
    .select('id, scheduled_for, platforms')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .eq('status', 'scheduled')
    .maybeSingle()

  return NextResponse.json({
    postId: (data as any)?.id ?? null,
    scheduledFor: data?.scheduled_for ?? null,
    platforms: (data as any)?.platforms ?? [],
  })
}

// ── POST: schedule a video (upsert) + call Late API ──────────────────────────

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { videoId, scheduledFor, caption, platforms } = body as {
    videoId: string
    scheduledFor: string
    caption?: string
    platforms?: LatePlatform[]
  }

  if (!videoId || !scheduledFor) {
    return NextResponse.json({ error: 'videoId and scheduledFor are required' }, { status: 400 })
  }

  // Verify the video belongs to this user
  const { data: video, error: videoError } = await supabase
    .from('generated_videos')
    .select('id, storage_path')
    .eq('id', videoId)
    .eq('user_id', user.id)
    .single()

  if (videoError || !video) {
    return NextResponse.json({ error: 'Video not found or access denied' }, { status: 404 })
  }

  // Check if a pending scheduled post already exists for this video
  const { data: existing } = await supabase
    .from('scheduled_posts')
    .select('id, late_post_id')
    .eq('user_id', user.id)
    .eq('video_id', videoId)
    .eq('status', 'scheduled')
    .maybeSingle()

  const accountIds = platforms?.map((p) => p.accountId) ?? []

  let post: any
  let dbError: any

  if (existing) {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for: scheduledFor,
        platform: 'video',
        caption: caption || '',
        platforms: accountIds,
      })
      .eq('id', existing.id)
      .select()
      .single()
    post = data
    dbError = error
  } else {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        video_id: videoId,
        scheduled_for: scheduledFor,
        platform: 'video',
        caption: caption || '',
        status: 'scheduled',
        platforms: accountIds,
      })
      .select()
      .single()
    post = data
    dbError = error
  }

  if (dbError) {
    console.error('[ScheduleVideo] DB error:', dbError)
    return NextResponse.json({ error: 'Failed to save scheduled post' }, { status: 500 })
  }

  // ── Late API integration ──────────────────────────────────────────────────
  let lateStatus: 'skipped' | 'success' | 'error' = 'skipped'
  let lateError: string | null = null
  let lateSkipReason: 'no_api_key' | 'no_platforms' | null = null

  if (!process.env.LATE_API_KEY) {
    lateStatus = 'skipped'
    lateSkipReason = 'no_api_key'
  } else if (!platforms || platforms.length === 0) {
    lateStatus = 'skipped'
    lateSkipReason = 'no_platforms'
  } else {
    try {
      const oldLateId = (existing as any)?.late_post_id
      if (oldLateId) {
        await deleteLatePost(oldLateId).catch((e) =>
          console.warn('[ScheduleVideo] Could not delete old Late post:', e.message)
        )
      }

      // Generate a long-lived signed URL (30 days) for the video
      let imageUrl: string | undefined
      if (video.storage_path) {
        const { data: signed } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(video.storage_path, 30 * 24 * 60 * 60)
        if (signed?.signedUrl) imageUrl = signed.signedUrl
      }

      // scheduledFor may be "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" — normalise to full ISO-8601
      const scheduledAtISO = scheduledFor.includes('T')
        ? `${scheduledFor}:00Z`
        : `${scheduledFor}T12:00:00Z`

      const latePost = await createLatePost({
        content: caption || '',
        scheduledFor: scheduledAtISO,
        timezone: 'UTC',
        platforms,
        imageUrl,
      })

      // Store the Late post ID (handle both _id and id)
      console.log('[ScheduleVideo] latePost keys:', Object.keys(latePost), '| resolved latePostId:', latePost._id ?? latePost.id)

      const latePostId = latePost._id ?? latePost.id
      if (latePostId) {
        await supabase
          .from('scheduled_posts')
          .update({ late_post_id: latePostId })
          .eq('id', post.id)
        post = { ...post, late_post_id: latePostId }
      }

      lateStatus = 'success'
    } catch (err: any) {
      console.error('[ScheduleVideo] Late API error:', err.message)
      lateStatus = 'error'
      lateError = err.message
    }
  }

  return NextResponse.json({ post, lateStatus, lateSkipReason, lateError }, { status: 201 })
}

// ── DELETE: cancel a scheduled video post ────────────────────────────────────

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: existingPost, error: fetchError } = await supabase
    .from('scheduled_posts')
    .select('id, late_post_id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    console.error('[UnscheduleVideo] Could not fetch post row:', fetchError)
  }

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
      console.error('[UnscheduleVideo] Could not delete Late post:', e.message)
      lateDeleteStatus = 'error'
    }
  }

  return NextResponse.json({ success: true, lateDeleteStatus })
}

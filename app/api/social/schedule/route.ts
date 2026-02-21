import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createLatePost, deleteLatePost, type LatePlatform } from '@/lib/late'

// ── GET: check if an ad is already scheduled ─────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const adId = searchParams.get('adId')

  if (!adId) {
    return NextResponse.json({ error: 'adId is required' }, { status: 400 })
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
    .select('scheduled_for, platforms')
    .eq('user_id', user.id)
    .eq('ad_id', adId)
    .eq('status', 'scheduled')
    .maybeSingle()

  return NextResponse.json({
    scheduledFor: data?.scheduled_for ?? null,
    platforms: (data as any)?.platforms ?? [],
  })
}

// ── POST: schedule a post (upsert) + call Late API ───────────────────────────

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
  // platforms = array of { platform: string, accountId: string } from Late
  const { adId, scheduledFor, platform, caption, platforms } = body as {
    adId: string
    scheduledFor: string
    platform?: string
    caption?: string
    platforms?: LatePlatform[]
  }

  if (!adId || !scheduledFor) {
    return NextResponse.json({ error: 'adId and scheduledFor are required' }, { status: 400 })
  }

  // Verify the ad belongs to this user and get storage_path for Late media URL
  const { data: ad, error: adError } = await supabase
    .from('generated_ads')
    .select('id, storage_path')
    .eq('id', adId)
    .eq('user_id', user.id)
    .single()

  if (adError || !ad) {
    return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
  }

  // Check if a pending scheduled post already exists for this ad
  const { data: existing } = await supabase
    .from('scheduled_posts')
    .select('id, late_post_id')
    .eq('user_id', user.id)
    .eq('ad_id', adId)
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
        platform: platform || 'post',
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
        ad_id: adId,
        scheduled_for: scheduledFor,
        platform: platform || 'post',
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
    console.error('[Schedule] DB error:', dbError)
    return NextResponse.json({ error: 'Failed to save scheduled post' }, { status: 500 })
  }

  // ── Late API integration ──────────────────────────────────────────────────
  if (process.env.LATE_API_KEY && platforms && platforms.length > 0 && post) {
    try {
      // If rescheduling, delete the old Late post first
      const oldLateId = existing?.late_post_id
      if (oldLateId) {
        await deleteLatePost(oldLateId).catch((e) =>
          console.warn('[Schedule] Could not delete old Late post:', e.message)
        )
      }

      // Generate a long-lived signed URL (30 days) so Late can fetch the image
      let mediaUrls: string[] = []
      if (ad.storage_path) {
        const { data: signed } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(ad.storage_path, 30 * 24 * 60 * 60)
        if (signed?.signedUrl) mediaUrls = [signed.signedUrl]
      }

      // Convert date "YYYY-MM-DD" → "YYYY-MM-DDT12:00:00.000Z" (noon UTC)
      const scheduledAtISO = `${scheduledFor}T12:00:00.000Z`

      const latePost = await createLatePost({
        content: caption || '',
        scheduledFor: scheduledAtISO,
        platforms,
        ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
      })

      // Store the Late post ID for future deletion
      await supabase
        .from('scheduled_posts')
        .update({ late_post_id: latePost._id })
        .eq('id', post.id)

      post = { ...post, late_post_id: latePost._id }
    } catch (lateErr: any) {
      console.error('[Schedule] Late API error:', lateErr.message)
      // Don't fail the request — DB record is saved; user can still manage locally
    }
  }

  return NextResponse.json({ post }, { status: 201 })
}

// ── DELETE: cancel a scheduled post + remove from Late ───────────────────────

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

  // Fetch the row to get the late_post_id before cancelling
  const { data: existingPost } = await supabase
    .from('scheduled_posts')
    .select('id, late_post_id')
    .eq('id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  // Cancel in our DB
  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel post' }, { status: 500 })
  }

  // Cancel in Late API if we have a late_post_id
  const latePostId = (existingPost as any)?.late_post_id
  if (process.env.LATE_API_KEY && latePostId) {
    await deleteLatePost(latePostId).catch((e) =>
      console.warn('[Schedule] Could not delete Late post:', e.message)
    )
  }

  return NextResponse.json({ success: true })
}

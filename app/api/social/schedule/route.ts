import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
  const { adId, scheduledFor, platform, caption } = body

  if (!adId || !scheduledFor) {
    return NextResponse.json({ error: 'adId and scheduledFor are required' }, { status: 400 })
  }

  // Verify the ad belongs to this user
  const { data: ad, error: adError } = await supabase
    .from('generated_ads')
    .select('id')
    .eq('id', adId)
    .eq('user_id', user.id)
    .single()

  if (adError || !ad) {
    return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 })
  }

  // Check if a pending scheduled post already exists for this ad
  const { data: existing } = await supabase
    .from('scheduled_posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('ad_id', adId)
    .eq('status', 'scheduled')
    .maybeSingle()

  let post: any
  let dbError: any

  if (existing) {
    // Update the existing row — no duplicate created
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for: scheduledFor,
        platform: platform || 'post',
        caption: caption || '',
      })
      .eq('id', existing.id)
      .select()
      .single()
    post = data
    dbError = error
  } else {
    // Insert a fresh row
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        ad_id: adId,
        scheduled_for: scheduledFor,
        platform: platform || 'post',
        caption: caption || '',
        status: 'scheduled',
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

  return NextResponse.json({ post }, { status: 201 })
}

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

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel post' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

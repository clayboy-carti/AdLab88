import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Use service role to update from a webhook (no user session)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServiceClient(url, key)
}

// Map Late event names → our status values
const EVENT_STATUS_MAP: Record<string, string> = {
  'post.published': 'published',
  'post.failed': 'failed',
  'post.cancelled': 'cancelled',
}

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Late sends { event, data: { _id, status, ... } }
  // or { type, post: { id, ... } } — handle both shapes
  const event: string = body.event ?? body.type ?? ''
  const latePostId: string = body.data?._id ?? body.data?.id ?? body.post?._id ?? body.post?.id ?? ''

  if (!latePostId) {
    console.warn('[Webhook/Late] Missing post ID in payload:', JSON.stringify(body))
    return NextResponse.json({ received: true })
  }

  const newStatus = EVENT_STATUS_MAP[event]
  if (!newStatus) {
    // Unrecognised event — acknowledge but take no action
    return NextResponse.json({ received: true })
  }

  const supabase = getServiceClient()

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: newStatus })
    .eq('late_post_id', latePostId)

  if (error) {
    console.error('[Webhook/Late] DB update error:', error)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

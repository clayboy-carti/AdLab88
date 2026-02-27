import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLateConnectUrl, disconnectLateAccount } from '@/lib/late'

// GET /api/social/connect?platform=instagram
// Starts the OAuth flow — redirects user to the platform's auth page via Late.
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const platform = req.nextUrl.searchParams.get('platform')
  if (!platform) {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 })
  }

  if (!process.env.LATE_API_KEY) {
    return NextResponse.json({ error: 'LATE_API_KEY not configured' }, { status: 500 })
  }

  const profileId = process.env.LATE_PROFILE_ID
  if (!profileId) {
    return NextResponse.json({ error: 'LATE_PROFILE_ID not configured' }, { status: 500 })
  }

  const origin = req.nextUrl.origin
  const redirectUrl = `${origin}/api/social/connect/callback`

  try {
    const authUrl = await getLateConnectUrl({ platform, profileId, redirectUrl })
    return NextResponse.redirect(authUrl)
  } catch (err: any) {
    console.error('[Connect] getLateConnectUrl error:', err.message)
    return NextResponse.redirect(
      new URL(`/profile?connect_error=${encodeURIComponent(err.message)}`, origin)
    )
  }
}

// DELETE /api/social/connect  body: { accountId }
// Disconnects a social account.
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let accountId: string
  try {
    const body = await req.json()
    accountId = body.accountId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
  }

  try {
    await disconnectLateAccount(accountId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Connect] disconnectLateAccount error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

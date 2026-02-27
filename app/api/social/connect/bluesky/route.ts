import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { connectBlueskyCredentials } from '@/lib/late'

// POST /api/social/connect/bluesky  body: { identifier, password }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.LATE_API_KEY) {
    return NextResponse.json({ error: 'LATE_API_KEY not configured' }, { status: 500 })
  }

  const profileId = process.env.LATE_PROFILE_ID
  if (!profileId) {
    return NextResponse.json({ error: 'LATE_PROFILE_ID not configured' }, { status: 500 })
  }

  let identifier: string, password: string
  try {
    const body = await req.json()
    identifier = body.identifier
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!identifier || !password) {
    return NextResponse.json({ error: 'identifier and password are required' }, { status: 400 })
  }

  try {
    const account = await connectBlueskyCredentials({ profileId, identifier, password })
    return NextResponse.json({ account })
  } catch (err: any) {
    console.error('[Connect/Bluesky] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_FIELDS = ['title'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function PATCH(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { videoId } = body

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  const updates: Partial<Record<AllowedField, string>> = {}
  for (const field of ALLOWED_FIELDS) {
    if (typeof body[field] === 'string') {
      const trimmed = body[field].trim()
      if (trimmed.length === 0) {
        return NextResponse.json({ error: `${field} cannot be empty` }, { status: 400 })
      }
      updates[field] = trimmed
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'At least one field (title) is required' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('generated_videos')
    .update(updates)
    .eq('id', videoId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[UpdateVideo] DB error:', updateError)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

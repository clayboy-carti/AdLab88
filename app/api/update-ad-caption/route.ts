import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_FIELDS = ['caption', 'hook', 'cta', 'title'] as const
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
  const { adId } = body

  if (!adId) {
    return NextResponse.json({ error: 'adId is required' }, { status: 400 })
  }

  // Build an update object from whichever allowed fields are present
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
    return NextResponse.json({ error: 'At least one field (title, caption, hook, cta) is required' }, { status: 400 })
  }

  // Update only if the row belongs to this user (ownership enforced)
  const { error: updateError } = await supabase
    .from('generated_ads')
    .update(updates)
    .eq('id', adId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[UpdateAd] DB error:', updateError)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

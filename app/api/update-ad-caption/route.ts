import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
  const { adId, caption } = body

  if (!adId || typeof caption !== 'string') {
    return NextResponse.json({ error: 'adId and caption are required' }, { status: 400 })
  }

  const trimmed = caption.trim()
  if (trimmed.length === 0) {
    return NextResponse.json({ error: 'Caption cannot be empty' }, { status: 400 })
  }

  // Update only if the row belongs to this user (ownership enforced)
  const { error: updateError } = await supabase
    .from('generated_ads')
    .update({ caption: trimmed })
    .eq('id', adId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[UpdateCaption] DB error:', updateError)
    return NextResponse.json({ error: 'Failed to save caption' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { persona, pain_point, angle, visual_direction, emotion, copy_hook } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (persona !== undefined) updates.persona = persona
    if (pain_point !== undefined) updates.pain_point = pain_point
    if (angle !== undefined) updates.angle = angle
    if (visual_direction !== undefined) updates.visual_direction = visual_direction
    if (emotion !== undefined) updates.emotion = emotion
    if (copy_hook !== undefined) updates.copy_hook = copy_hook

    const { data: profile, error } = await supabase
      .from('brand_intelligence')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[Intelligence] PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('[Intelligence] PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('brand_intelligence')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Intelligence] DELETE error:', error)
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Intelligence] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

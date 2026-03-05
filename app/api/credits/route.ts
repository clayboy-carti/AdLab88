import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining, credits_used')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    // Row doesn't exist yet — return defaults
    return NextResponse.json({ credits_remaining: 25, credits_used: 0 })
  }

  return NextResponse.json(data)
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchLateAccounts } from '@/lib/late'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.LATE_API_KEY) {
    return NextResponse.json({ accounts: [], configured: false })
  }

  // Look up this user's Late profile ID so we only return their accounts
  const { data: brand } = await supabase
    .from('brands')
    .select('late_profile_id')
    .eq('user_id', user.id)
    .single()

  const profileId = brand?.late_profile_id ?? undefined

  try {
    const accounts = await fetchLateAccounts(profileId)
    return NextResponse.json({ accounts, configured: true })
  } catch (err: any) {
    console.error('[Accounts] Late API error:', err.message)
    return NextResponse.json({ accounts: [], configured: true, error: err.message })
  }
}

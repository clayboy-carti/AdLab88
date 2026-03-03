import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CampaignItem } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, brief, intelligence_ids, asset_ids, campaign_goal } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!Array.isArray(intelligence_ids) || intelligence_ids.length === 0) {
      return NextResponse.json({ error: 'At least one intelligence profile is required' }, { status: 400 })
    }
    if (!campaign_goal?.trim()) {
      return NextResponse.json({ error: 'campaign_goal is required' }, { status: 400 })
    }

    // Fetch intelligence profiles to build the plan
    const { data: profiles, error: profilesError } = await supabase
      .from('brand_intelligence')
      .select('id, persona, angle')
      .eq('user_id', user.id)
      .in('id', intelligence_ids)

    if (profilesError || !profiles?.length) {
      return NextResponse.json({ error: 'Intelligence profiles not found' }, { status: 400 })
    }

    const assetIdsArr: string[] = Array.isArray(asset_ids) ? asset_ids : []

    // Build plan: one item per intelligence profile
    const plan: CampaignItem[] = profiles.map((p, i) => ({
      intelligenceId: p.id,
      persona: p.persona ?? '',
      angle: p.angle ?? '',
      goal: campaign_goal.trim(),
      assetId: assetIdsArr[i % assetIdsArr.length] ?? undefined,
      status: 'pending' as const,
    }))

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: name.trim(),
        brief: brief?.trim() || null,
        plan,
        status: 'planned',
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      console.error('[Campaign/Plan] DB error:', campaignError)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('[Campaign/Plan] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

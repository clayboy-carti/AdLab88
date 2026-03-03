import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { composePrompt } from '@/lib/ai/prompt-composer'
import type { Brand, BrandIntelligence } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { intelligence_id, asset_ids, campaign_goal } = body

    if (!intelligence_id || !campaign_goal?.trim()) {
      return NextResponse.json(
        { error: 'intelligence_id and campaign_goal are required' },
        { status: 400 }
      )
    }

    // Fetch brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile required' }, { status: 400 })
    }

    // Fetch intelligence profile
    const { data: profile, error: profileError } = await supabase
      .from('brand_intelligence')
      .select('*')
      .eq('id', intelligence_id)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Intelligence profile not found' }, { status: 404 })
    }

    // Resolve asset signed URLs if provided
    let assetUrls: string[] = []
    if (Array.isArray(asset_ids) && asset_ids.length > 0) {
      const { data: assets } = await supabase
        .from('brand_assets')
        .select('storage_path')
        .eq('user_id', user.id)
        .in('id', asset_ids)

      if (assets && assets.length > 0) {
        const paths = assets.map((a) => a.storage_path)
        const { data: signedUrls } = await supabase.storage
          .from('brand-assets')
          .createSignedUrls(paths, 3600)

        assetUrls = signedUrls?.map((s) => s.signedUrl).filter(Boolean) ?? []
      }
    }

    const result = await composePrompt({
      brand: brand as Brand,
      intelligenceProfile: profile as BrandIntelligence,
      assetUrls,
      campaignGoal: campaign_goal.trim(),
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[PromptCompose] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

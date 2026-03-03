import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { composePrompt } from '@/lib/ai/prompt-composer'
import { generateImageWithGemini } from '@/lib/ai/gemini-image'
import type { Brand, BrandIntelligence, CampaignItem } from '@/types/database'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaign_id } = body

    if (!campaign_id) {
      return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const plan: CampaignItem[] = campaign.plan ?? []
    if (plan.length === 0) {
      return NextResponse.json({ error: 'Campaign has no plan items' }, { status: 400 })
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

    // Mark campaign as generating
    await supabase.from('campaigns').update({ status: 'generating' }).eq('id', campaign_id)

    // Collect all intelligence profile IDs
    const intelligenceIds = Array.from(new Set(plan.map((item) => item.intelligenceId)))
    const { data: profiles } = await supabase
      .from('brand_intelligence')
      .select('*')
      .eq('user_id', user.id)
      .in('id', intelligenceIds)

    const profileMap = new Map<string, BrandIntelligence>((profiles ?? []).map((p) => [p.id, p]))

    // Collect all asset IDs
    const assetIds = Array.from(new Set(plan.map((item) => item.assetId).filter(Boolean))) as string[]
    const assetUrlMap = new Map<string, string>()

    if (assetIds.length > 0) {
      const { data: assets } = await supabase
        .from('brand_assets')
        .select('id, storage_path')
        .eq('user_id', user.id)
        .in('id', assetIds)

      if (assets && assets.length > 0) {
        const paths = assets.map((a) => a.storage_path)
        const { data: signedUrls } = await supabase.storage
          .from('brand-assets')
          .createSignedUrls(paths, 3600)

        if (signedUrls) {
          const urlMap = new Map(signedUrls.map((su) => [su.path, su.signedUrl]))
          for (const asset of assets) {
            const url = urlMap.get(asset.storage_path)
            if (url) assetUrlMap.set(asset.id, url)
          }
        }
      }
    }

    // Generate all items in parallel — allow partial failures
    const results = await Promise.allSettled(
      plan.map(async (item) => {
        const profile = profileMap.get(item.intelligenceId)
        if (!profile) throw new Error(`Profile ${item.intelligenceId} not found`)

        const assetUrls: string[] = item.assetId ? [assetUrlMap.get(item.assetId)].filter(Boolean) as string[] : []

        // Compose image prompt
        const composed = await composePrompt({
          brand: brand as Brand,
          intelligenceProfile: profile,
          assetUrls,
          campaignGoal: item.goal,
        })

        // Generate image
        const generatedImage = await generateImageWithGemini(
          assetUrls.length > 0 ? assetUrls : null,
          composed.prompt,
          user.id,
          assetUrls.length > 0 ? 0.35 : 0.0,
          0,
          '1K',
          '1:1',
          0.6
        )

        // Save to generated_ads
        const { data: adRecord, error: dbError } = await supabase
          .from('generated_ads')
          .insert({
            user_id: user.id,
            brand_id: brand.id,
            positioning_angle: profile.angle ?? 'Campaign Ad',
            hook: profile.copy_hook ?? profile.angle ?? 'Campaign Ad',
            caption: item.goal,
            cta: 'Learn More',
            image_generation_prompt: composed.prompt,
            brand_voice_match: profile.emotion ?? null,
            framework_applied: 'Campaign Builder',
            target_platform: 'Social',
            storage_path: generatedImage.storagePath,
            image_quality: '1K',
            aspect_ratio: '1:1',
            campaign_id,
            title: `${campaign.name} — ${profile.angle ?? 'Ad'}`,
          })
          .select()
          .single()

        if (dbError || !adRecord) throw new Error('Failed to save ad to database')

        // Get signed URL for preview
        const { data: signedUrlData } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(generatedImage.storagePath, 3600)

        return {
          adId: adRecord.id,
          generatedImageUrl: signedUrlData?.signedUrl ?? null,
          intelligenceId: item.intelligenceId,
          persona: item.persona,
          angle: item.angle,
        }
      })
    )

    // Build updated plan with results
    const updatedPlan: CampaignItem[] = plan.map((item, i) => {
      const result = results[i]
      if (result.status === 'fulfilled') {
        return { ...item, status: 'success' as const, adId: result.value.adId }
      } else {
        return { ...item, status: 'failed' as const, error: String(result.reason?.message ?? 'Unknown error') }
      }
    })

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const campaignStatus = successCount === plan.length ? 'complete' : successCount > 0 ? 'partial' : 'planned'

    await supabase
      .from('campaigns')
      .update({ plan: updatedPlan, status: campaignStatus })
      .eq('id', campaign_id)

    const adResults = results.map((result, i) => ({
      intelligenceId: plan[i].intelligenceId,
      persona: plan[i].persona,
      angle: plan[i].angle,
      status: result.status === 'fulfilled' ? 'success' : 'failed',
      adId: result.status === 'fulfilled' ? result.value.adId : null,
      generatedImageUrl: result.status === 'fulfilled' ? result.value.generatedImageUrl : null,
      error: result.status === 'rejected' ? String((result as PromiseRejectedResult).reason?.message ?? 'Unknown') : null,
    }))

    return NextResponse.json({
      campaign_id,
      total: plan.length,
      succeeded: successCount,
      failed: plan.length - successCount,
      results: adResults,
    })
  } catch (error: any) {
    console.error('[Campaign/Generate] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

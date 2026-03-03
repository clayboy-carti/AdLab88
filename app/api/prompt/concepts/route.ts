import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateConcepts } from '@/lib/ai/concepts'
import type { Brand } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { campaign_context, reference_url, ad_id } = body

    if (!campaign_context?.trim()) {
      return NextResponse.json({ error: 'campaign_context is required' }, { status: 400 })
    }

    // Optionally resolve reference image from library
    let referenceUrl: string | undefined = reference_url ?? undefined

    if (!referenceUrl && ad_id) {
      const { data: ad } = await supabase
        .from('generated_ads')
        .select('storage_path')
        .eq('id', ad_id)
        .eq('user_id', user.id)
        .single()

      if (ad?.storage_path) {
        const { data: signedUrlData } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(ad.storage_path, 3600)
        referenceUrl = signedUrlData?.signedUrl ?? undefined
      }
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

    const concepts = await generateConcepts({
      referenceUrl,
      campaignContext: campaign_context.trim(),
      brand: brand as Brand,
    })

    return NextResponse.json({ concepts })
  } catch (error: any) {
    console.error('[Concepts] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

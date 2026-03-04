import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { reverseEngineerAd } from '@/lib/ai/reverse-engineer'
import type { Brand } from '@/types/database'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image_url, ad_id } = body

    // Resolve image URL: either a direct URL or from a generated ad
    let imageUrl: string | null = image_url ?? null

    if (!imageUrl && ad_id) {
      const { data: ad } = await supabase
        .from('generated_ads')
        .select('storage_path')
        .eq('id', ad_id)
        .eq('user_id', user.id)
        .single()

      if (ad?.storage_path) {
        const { data: signedUrlData } = await supabase.storage
          .from('generated-ads')
          .createSignedUrl(ad.storage_path, 604800)
        imageUrl = signedUrlData?.signedUrl ?? null
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'image_url or ad_id is required' }, { status: 400 })
    }

    // Convert to base64 data URL so OpenAI doesn't need to fetch from an
    // external URL (Supabase signed URLs can be unreachable from OpenAI servers).
    try {
      const imgRes = await fetch(imageUrl)
      if (imgRes.ok) {
        const mime = imgRes.headers.get('content-type') ?? 'image/jpeg'
        const buf = await imgRes.arrayBuffer()
        imageUrl = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
      }
    } catch {
      // If fetch fails, fall through with the original URL
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

    const result = await reverseEngineerAd(imageUrl, brand as Brand)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[ReverseEngineer] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

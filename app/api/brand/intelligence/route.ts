import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateBrandIntelligence } from '@/lib/ai/intelligence'
import type { Brand } from '@/types/database'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profiles, error } = await supabase
      .from('brand_intelligence')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Intelligence] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    return NextResponse.json({ profiles: profiles ?? [] })
  } catch (error: any) {
    console.error('[Intelligence] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const body = await request.json()
    const { source } = body // 'generate' | 'manual'

    if (source === 'manual') {
      // Insert a single blank profile for manual editing
      const { data: profile, error: dbError } = await supabase
        .from('brand_intelligence')
        .insert({
          user_id: user.id,
          brand_id: brand.id,
          source: 'manual',
        })
        .select()
        .single()

      if (dbError) {
        console.error('[Intelligence] DB error:', dbError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      return NextResponse.json({ profiles: [profile] }, { status: 201 })
    }

    // Default: generate profiles using AI
    console.log('[Intelligence] Generating profiles for brand:', brand.company_name)
    const generated = await generateBrandIntelligence(brand as Brand)

    const rows = generated.map((p) => ({
      user_id: user.id,
      brand_id: brand.id,
      ...p,
    }))

    const { data: profiles, error: dbError } = await supabase
      .from('brand_intelligence')
      .insert(rows)
      .select()

    if (dbError) {
      console.error('[Intelligence] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save profiles' }, { status: 500 })
    }

    return NextResponse.json({ profiles: profiles ?? [] }, { status: 201 })
  } catch (error: any) {
    console.error('[Intelligence] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

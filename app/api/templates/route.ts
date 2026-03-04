import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: templates, error } = await supabase
      .from('ad_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Templates] DB error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({ templates: [] })
    }

    const paths = templates.map((t) => t.storage_path)
    const { data: signedUrls, error: urlError } = await supabase.storage
      .from('generated-ads')
      .createSignedUrls(paths, 604800)

    if (urlError) {
      console.error('[Templates] Signed URL error:', urlError)
      return NextResponse.json({ error: 'Failed to generate URLs' }, { status: 500 })
    }

    const urlMap = new Map(signedUrls?.map((s) => [s.path, s.signedUrl]) ?? [])
    const templatesWithUrls = templates.map((t) => ({
      ...t,
      url: urlMap.get(t.storage_path) ?? null,
    }))

    return NextResponse.json({ templates: templatesWithUrls })
  } catch (error: any) {
    console.error('[Templates] GET error:', error)
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

    const body = await request.json()
    const { ad_id, name, category, tags } = body

    if (!ad_id || !name?.trim()) {
      return NextResponse.json({ error: 'ad_id and name are required' }, { status: 400 })
    }

    // Fetch the source ad to get storage_path and copy fields
    const { data: ad, error: adError } = await supabase
      .from('generated_ads')
      .select('storage_path, hook, positioning_angle')
      .eq('id', ad_id)
      .eq('user_id', user.id)
      .single()

    if (adError || !ad || !ad.storage_path) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    const { data: template, error: dbError } = await supabase
      .from('ad_templates')
      .insert({
        user_id: user.id,
        source_ad_id: ad_id,
        name: name.trim(),
        category: category ?? null,
        tags: tags ?? null,
        storage_path: ad.storage_path,
        hook: ad.hook ?? null,
        positioning_angle: ad.positioning_angle ?? null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Templates] DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error('[Templates] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

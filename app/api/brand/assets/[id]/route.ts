import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_CATEGORIES = ['product', 'packaging', 'lifestyle', 'logo', 'other']

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
    const { category } = body

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const updates: Record<string, string> = {}
    if (category) updates.category = category

    const { data: asset, error } = await supabase
      .from('brand_assets')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[BrandAssets] PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }

    return NextResponse.json({ asset })
  } catch (error: any) {
    console.error('[BrandAssets] PATCH error:', error)
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

    // Fetch the asset first to get the storage path
    const { data: asset, error: fetchError } = await supabase
      .from('brand_assets')
      .select('storage_path')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Delete from storage
    await supabase.storage.from('brand-assets').remove([asset.storage_path])

    // Delete from DB
    const { error: dbError } = await supabase
      .from('brand_assets')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('[BrandAssets] DELETE error:', dbError)
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[BrandAssets] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

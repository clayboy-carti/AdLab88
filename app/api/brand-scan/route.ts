import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runBrandScan } from '@/lib/brand-scan'

export const maxDuration = 30

export async function POST(request: Request) {
  console.log('[BrandScan API] Starting brand scan...')

  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Create scan record (optimistic — we'll update it after)
    const { data: scanRecord, error: insertError } = await supabase
      .from('brand_scans')
      .insert({
        user_id: user.id,
        url: url.trim(),
        status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[BrandScan API] Failed to create scan record:', insertError)
      // Non-fatal: continue without audit record
    }

    const scanId = scanRecord?.id ?? null

    // Run the scan synchronously
    const result = await runBrandScan(url)

    if (!result.success) {
      // Update scan record to failed
      if (scanId) {
        await supabase
          .from('brand_scans')
          .update({ status: 'failed', error: result.error, completed_at: new Date().toISOString() })
          .eq('id', scanId)
      }
      return NextResponse.json({ error: result.error }, { status: 422 })
    }

    // Update scan record to complete
    if (scanId) {
      await supabase
        .from('brand_scans')
        .update({
          status: 'complete',
          extracted_data: result.data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId)
    }

    console.log('[BrandScan API] Scan complete:', result.data.company_name)

    return NextResponse.json({ scan: result.data }, { status: 200 })
  } catch (error: any) {
    console.error('[BrandScan API] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Brand scan failed' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LibraryGrid from '@/components/library/LibraryGrid'

export default async function LibraryPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all ads for the user, newest first
  const { data: ads, error } = await supabase
    .from('generated_ads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Library] Failed to fetch ads:', error)
  }

  // Generate signed URLs for each ad image
  const adsWithUrls = await Promise.all(
    (ads || []).map(async (ad) => {
      if (!ad.storage_path) return { ...ad, signedUrl: null }

      const { data } = await supabase.storage
        .from('generated-ads')
        .createSignedUrl(ad.storage_path, 3600)

      return { ...ad, signedUrl: data?.signedUrl || null }
    })
  )

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl uppercase font-mono header-accent">AD LIBRARY</h1>
        {adsWithUrls.length > 0 && (
          <span className="text-sm font-mono text-gray-500 uppercase">
            {adsWithUrls.length} ad{adsWithUrls.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {adsWithUrls.length === 0 ? (
        <div className="text-center py-16 border border-outline bg-white">
          <p className="text-gray-500 uppercase font-mono text-sm mb-4">
            No ads generated yet
          </p>
          <a href="/create" className="btn-primary inline-block">
            CREATE YOUR FIRST AD
          </a>
        </div>
      ) : (
        <LibraryGrid initialAds={adsWithUrls} />
      )}
    </div>
  )
}

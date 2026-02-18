import { createClient } from '@/lib/supabase/server'
import BrandWizard from '@/components/brand/BrandWizard'
import type { Brand } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function BrandPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Try to load existing brand
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl uppercase font-mono header-accent mb-8">
        {brand ? 'EDIT BRAND' : 'BRAND SETUP'}
      </h1>
      <div className="card">
        <BrandWizard existingBrand={brand as Brand | undefined} />
      </div>
    </div>
  )
}

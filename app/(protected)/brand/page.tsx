import { createClient } from '@/lib/supabase/server'
import BrandWizard from '@/components/brand/BrandWizard'
import BrandDashboard from '@/components/brand/BrandDashboard'
import type { Brand } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function BrandPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (brand) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl uppercase font-mono header-accent">Your Brand</h1>
          <p className="text-sm font-mono text-gray-500 mt-1 uppercase">{brand.company_name}</p>
        </div>
        <BrandDashboard brand={brand as Brand} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl uppercase font-mono header-accent mb-8">Brand Setup</h1>
      <div className="card">
        <BrandWizard />
      </div>
    </div>
  )
}

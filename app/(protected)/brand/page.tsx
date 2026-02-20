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
        <div className="mb-8 flex items-end justify-between border-b-2 border-rust pb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Brand Profile</p>
            <h1 className="text-3xl font-mono font-bold text-graphite uppercase">{brand.company_name}</h1>
          </div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest pb-1">
            Last updated {new Date(brand.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
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

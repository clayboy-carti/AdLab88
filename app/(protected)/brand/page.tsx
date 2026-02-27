import { createClient } from '@/lib/supabase/server'
import BrandSetupFlow from '@/components/brand/BrandSetupFlow'
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
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-mono font-bold text-graphite uppercase tracking-widest">
            Brand Configuration
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Define system inputs for optimised ad generation.
          </p>
        </div>
        <BrandDashboard brand={brand as Brand} />
      </div>
    )
  }

  return <BrandSetupFlow />
}

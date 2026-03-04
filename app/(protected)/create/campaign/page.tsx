import Link from 'next/link'
import CampaignBuilder from '@/components/create/CampaignBuilder'

export const dynamic = 'force-dynamic'

export default function CampaignPage() {
  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <Link
            href="/create"
            className="font-mono text-xs text-gray-400 uppercase tracking-widest hover:text-rust transition-colors"
          >
            ← The Lab Bench
          </Link>
          <h1 className="text-3xl font-mono header-accent mt-1">Campaign Builder</h1>
        </div>
      </div>
      <CampaignBuilder />
    </div>
  )
}

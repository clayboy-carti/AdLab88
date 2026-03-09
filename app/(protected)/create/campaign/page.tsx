import Link from 'next/link'
import CampaignBuilder from '@/components/create/CampaignBuilder'

export const dynamic = 'force-dynamic'

export default function CampaignPage() {
  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-mono header-accent">Campaign Builder</h1>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-1">
            Build a full multi-format campaign from a single brief
          </p>
        </div>
        <Link
          href="/create"
          className="text-xs font-mono text-graphite/40 uppercase tracking-widest hover:text-rust transition-colors mt-1"
        >
          ← The Lab Bench
        </Link>
      </div>
      <CampaignBuilder />
    </div>
  )
}

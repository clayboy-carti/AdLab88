import Link from 'next/link'
import ReverseEngineerPanel from '@/components/create/ReverseEngineerPanel'

export const dynamic = 'force-dynamic'

export default function ReversePage() {
  return (
    <div className="w-full p-4 lg:p-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-mono header-accent">Reverse Engineer</h1>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-1">
            Upload a winning ad · extract its style DNA · get 3 ready-to-use variant prompts
          </p>
        </div>
        <Link
          href="/create"
          className="text-xs font-mono text-graphite/40 uppercase tracking-widest hover:text-rust transition-colors mt-1"
        >
          ← The Lab Bench
        </Link>
      </div>
      <ReverseEngineerPanel />
    </div>
  )
}

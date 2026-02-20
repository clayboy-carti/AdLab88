'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/brand',    label: 'BRAND',    short: 'B' },
    { href: '/create',   label: 'CREATE',   short: 'C' },
    { href: '/library',  label: 'LIBRARY',  short: 'L' },
    { href: '/schedule', label: 'SCHEDULE', short: 'S' },
  ]

  return (
    <aside className="w-16 lg:w-[280px] h-screen bg-forest text-paper fixed left-0 top-0 flex flex-col z-40 transition-all duration-200">
      {/* Logo */}
      <div className="h-[72px] flex items-center justify-center lg:justify-start lg:px-6 border-b border-paper/20 flex-shrink-0">
        <span className="text-sm uppercase font-mono font-bold lg:hidden">AL</span>
        <div className="hidden lg:block">
          <h1 className="text-xl uppercase font-mono">ADLAB 88</h1>
          <div className="w-16 h-0.5 bg-rust mt-1" />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 lg:p-4 flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={[
              'flex items-center justify-center lg:justify-start',
              'lg:px-4 py-3 uppercase font-mono text-sm border border-transparent transition-colors',
              pathname === link.href
                ? 'bg-rust text-outline border-outline'
                : 'hover:bg-paper/10',
            ].join(' ')}
          >
            {/* Collapsed: single letter */}
            <span className="lg:hidden text-base font-bold tracking-tight">{link.short}</span>
            {/* Expanded: full label */}
            <span className="hidden lg:block">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 lg:p-4 border-t border-paper/20 flex-shrink-0">
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 uppercase font-mono text-sm border border-paper hover:bg-paper hover:text-forest transition-colors"
        >
          <span className="lg:hidden text-base">↩</span>
          <span className="hidden lg:block">LOGOUT</span>
        </button>
      </div>
    </aside>
  )
}

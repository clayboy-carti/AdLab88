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
    { href: '/brand', label: 'BRAND' },
    { href: '/create', label: 'CREATE' },
    { href: '/library', label: 'LIBRARY' },
  ]

  return (
    <aside className="w-[280px] h-screen bg-forest text-paper fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-paper/20">
        <h1 className="text-xl uppercase font-mono">
          ADLAB 88
        </h1>
        <div className="w-16 h-0.5 bg-rust mt-1" />
      </div>

      <nav className="flex-1 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-3 uppercase font-mono text-sm mb-2 border border-transparent ${
              pathname === link.href
                ? 'bg-rust text-outline border-outline'
                : 'hover:bg-forest/80'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-paper/20">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 uppercase font-mono text-sm border border-paper hover:bg-paper hover:text-forest transition-colors"
        >
          LOGOUT
        </button>
      </div>
    </aside>
  )
}

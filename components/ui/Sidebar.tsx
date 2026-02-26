'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [initials, setInitials] = useState('U')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name = user.user_metadata?.full_name as string | undefined
      if (name && name.trim()) {
        const parts = name.trim().split(' ')
        const first = parts[0][0] ?? ''
        const last = parts.length >= 2 ? parts[parts.length - 1][0] : ''
        setInitials((first + last).toUpperCase())
      } else if (user.email) {
        setInitials(user.email[0].toUpperCase())
      }
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
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
    <aside className="w-16 lg:w-[240px] h-screen bg-forest text-paper fixed left-0 top-0 flex flex-col z-40 transition-all duration-200">
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
              pathname === link.href || pathname.startsWith(link.href + '/')
                ? 'bg-rust text-outline border-outline'
                : 'hover:bg-paper/10',
            ].join(' ')}
          >
            <span className="lg:hidden text-base font-bold tracking-tight">{link.short}</span>
            <span className="hidden lg:block">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Profile avatar + menu */}
      <div className="p-2 lg:p-4 border-t border-paper/20 flex-shrink-0 relative" ref={menuRef}>
        {/* Dropdown — opens above the button */}
        {menuOpen && (
          <div className="absolute bottom-full left-2 lg:left-4 right-2 lg:right-4 mb-1 bg-forest border border-paper/30 flex flex-col z-50">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={[
                'flex items-center justify-center lg:justify-start lg:px-4 py-3',
                'text-sm font-mono uppercase text-paper transition-colors border-b border-paper/20',
                pathname === '/profile' ? 'bg-rust text-white' : 'hover:bg-paper/10',
              ].join(' ')}
            >
              <span className="lg:hidden text-base">P</span>
              <span className="hidden lg:inline">Profile</span>
            </Link>
            <Link
              href="/subscription"
              onClick={() => setMenuOpen(false)}
              className={[
                'flex items-center justify-center lg:justify-start lg:px-4 py-3',
                'text-sm font-mono uppercase text-paper transition-colors border-b border-paper/20',
                pathname === '/subscription' ? 'bg-rust text-white' : 'hover:bg-paper/10',
              ].join(' ')}
            >
              <span className="lg:hidden text-base">$</span>
              <span className="hidden lg:inline">Subscription</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center lg:justify-start lg:px-4 py-3 text-sm font-mono uppercase text-paper hover:bg-paper/10 transition-colors text-left w-full"
            >
              <span className="lg:hidden text-base">↩</span>
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        )}

        {/* Avatar button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          title="Account"
          className="w-full flex items-center justify-center lg:justify-start gap-3 py-1 hover:bg-paper/10 transition-colors"
        >
          <div className="w-9 h-9 bg-rust border border-paper/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-mono font-bold text-white leading-none">{initials}</span>
          </div>
          <span className="hidden lg:block text-sm font-mono uppercase text-paper/80 tracking-wide">Account</span>
          <span className="hidden lg:block ml-auto text-paper/40 text-xs">▲</span>
        </button>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { Tag, Wand2, LayoutGrid, Clock, User, CreditCard, LogOut, Menu, X } from 'lucide-react'

const links = [
  { href: '/brand',    label: 'Brand',    Icon: Tag },
  { href: '/create',   label: 'Create',   Icon: Wand2 },
  { href: '/library',  label: 'Library',  Icon: LayoutGrid },
  { href: '/schedule', label: 'Schedule', Icon: Clock },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    setMenuOpen(false)
    setMobileOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-forest text-paper flex items-center justify-between px-4 z-40 border-b border-paper/10">
        <span className="text-sm font-mono font-bold tracking-[0.2em] text-paper uppercase">
          AdLab 88
        </span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="p-2 rounded-xl text-paper/70 hover:text-paper hover:bg-paper/10 transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-forest text-paper flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 pt-8 pb-6 flex-shrink-0">
              <div>
                <h1 className="text-base font-mono font-bold tracking-[0.2em] text-paper uppercase">
                  AdLab 88
                </h1>
                <p className="text-[10px] font-mono text-paper/40 uppercase tracking-widest mt-1">
                  Creative Studio
                </p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="p-2 rounded-xl text-paper/60 hover:text-paper hover:bg-paper/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 flex flex-col gap-1">
              {links.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-150',
                      active
                        ? 'bg-rust text-white'
                        : 'text-paper/60 hover:text-paper hover:bg-paper/10',
                    ].join(' ')}
                  >
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                    <span className="font-mono text-sm font-medium tracking-wide">{label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Account links — shown directly in drawer (no sub-dropdown) */}
            <div className="px-3 pb-8 pt-3 flex-shrink-0 border-t border-paper/10 flex flex-col gap-1">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-mono transition-colors',
                  pathname === '/profile'
                    ? 'text-white bg-paper/10'
                    : 'text-paper/70 hover:text-paper hover:bg-paper/10',
                ].join(' ')}
              >
                <User size={16} strokeWidth={1.8} />
                <span>Profile</span>
              </Link>
              <Link
                href="/subscription"
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-mono transition-colors',
                  pathname === '/subscription'
                    ? 'text-white bg-paper/10'
                    : 'text-paper/70 hover:text-paper hover:bg-paper/10',
                ].join(' ')}
              >
                <CreditCard size={16} strokeWidth={1.8} />
                <span>Subscription</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-mono text-paper/70 hover:text-paper hover:bg-paper/10 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.8} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar (lg and above) ── */}
      <aside className="hidden lg:flex w-[240px] h-screen bg-forest text-paper fixed left-0 top-0 flex-col z-40">

        {/* Logo */}
        <div className="px-5 pt-8 pb-6 flex-shrink-0">
          <h1 className="text-base font-mono font-bold tracking-[0.2em] text-paper uppercase">
            AdLab 88
          </h1>
          <p className="text-[10px] font-mono text-paper/40 uppercase tracking-widest mt-1">
            Creative Studio
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={[
                  'flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150',
                  active
                    ? 'bg-rust text-white'
                    : 'text-paper/60 hover:text-paper hover:bg-paper/10',
                ].join(' ')}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span className="font-mono text-sm font-medium tracking-wide">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User / Account */}
        <div className="px-3 pb-6 flex-shrink-0 relative" ref={menuRef}>

          {/* Dropdown — opens above the button */}
          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#162E26] border border-paper/10 rounded-2xl overflow-hidden shadow-lg z-50">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-3 text-sm font-mono transition-colors',
                  pathname === '/profile'
                    ? 'text-white bg-paper/10'
                    : 'text-paper/70 hover:text-paper hover:bg-paper/10',
                ].join(' ')}
              >
                <User size={16} strokeWidth={1.8} />
                <span>Profile</span>
              </Link>
              <Link
                href="/subscription"
                onClick={() => setMenuOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-3 text-sm font-mono transition-colors border-t border-paper/10',
                  pathname === '/subscription'
                    ? 'text-white bg-paper/10'
                    : 'text-paper/70 hover:text-paper hover:bg-paper/10',
                ].join(' ')}
              >
                <CreditCard size={16} strokeWidth={1.8} />
                <span>Subscription</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-mono text-paper/70 hover:text-paper hover:bg-paper/10 transition-colors border-t border-paper/10"
              >
                <LogOut size={16} strokeWidth={1.8} />
                <span>Log out</span>
              </button>
            </div>
          )}

          {/* Avatar button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Account"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-paper/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-rust flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-mono font-bold text-white leading-none">{initials}</span>
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-mono text-paper/80 leading-tight">Account</span>
            </div>
            <span className="ml-auto text-paper/30 text-[10px]">▲</span>
          </button>
        </div>
      </aside>
    </>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [redirectTo, setRedirectTo] = useState('/create')
  const router = useRouter()
  const supabase = createClient()
  const splashVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!showSplash) return
    splashVideoRef.current?.play().catch(() => {})
    const timer = setTimeout(() => {
      router.push(redirectTo)
    }, 4000)
    return () => clearTimeout(timer)
  }, [showSplash, redirectTo, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setRedirectTo('/brand')
        setShowSplash(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setRedirectTo('/create')
        setShowSplash(true)
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  // Grid overlay style — subtle lighter lines on forest green
  const forestGrid = {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
    backgroundSize: '32px 32px',
  }

  // ── Post-login splash ─────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <div className="min-h-screen bg-forest flex flex-col items-center justify-center px-4" style={forestGrid}>
        <div className="w-full max-w-md rounded-2xl border border-paper/20 overflow-hidden shadow-lg">
          <video
            ref={splashVideoRef}
            src="/Login_Video.mp4"
            autoPlay
            muted
            playsInline
            className="w-full h-auto block"
          />
        </div>
      </div>
    )
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-4" style={forestGrid}>
      <div className="w-full max-w-sm flex flex-col items-center">

        {/* Logo */}
        <div className="w-full mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/AdLab_Logo2.png"
            alt="AdLab 88"
            className="w-full h-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-2xl border border-paper/10 shadow-xl overflow-hidden">

        {/* Card header */}
        <div className="px-6 pt-6 pb-4 border-b border-forest/10 text-center">
          <h2 className="font-mono text-xl font-semibold text-graphite">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="font-mono text-xs text-graphite/40 mt-1 uppercase tracking-widest">
            {isSignup ? 'Start running better experiments' : 'Sign in to the lab bench'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="px-6 py-6 flex flex-col gap-4">

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-mono text-red-500">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-2.5 text-sm font-mono text-graphite focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono uppercase tracking-widest text-graphite/65">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-[#EFE6D8] border border-forest/25 px-4 py-2.5 text-sm font-mono text-graphite focus:outline-none focus:border-forest/50 placeholder:text-graphite/25"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-3 bg-rust text-white rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-rust/90 disabled:opacity-50 transition-colors"
          >
            {loading ? '…' : isSignup ? 'Create Account' : 'Sign In'}
          </button>

        </form>

        {/* Footer */}
        <div className="px-6 pb-5 border-t border-forest/10 pt-4">
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(null) }}
            className="text-xs font-mono text-graphite/40 hover:text-rust transition-colors"
          >
            {isSignup ? 'Already have an account? Sign in →' : "Don't have an account? Sign up →"}
          </button>
        </div>

        </div>

        {/* Tagline */}
        <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-paper/30">
          Run Better Experiments.
        </p>

      </div>
    </div>
  )
}

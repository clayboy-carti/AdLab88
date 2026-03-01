'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        router.push('/brand') // New users go to brand setup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.refresh() // Middleware handles redirect
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper bg-grid-paper flex flex-col items-center justify-center px-4">

      {/* Brand identity */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-widest text-graphite">
          ADLAB 88
        </h1>
        <div className="mt-1 h-px w-full bg-rust" />
        <p className="mt-2 text-xs font-mono uppercase tracking-widest text-graphite/50">
          Run Better Experiments.
        </p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm border border-outline bg-paper">

        {/* Card header */}
        <div className="border-b border-outline px-6 py-3">
          <span className="text-xs font-mono uppercase tracking-widest text-graphite/60">
            {isSignup ? 'Create Account' : 'Sign In'}
          </span>
        </div>

        {/* Form body */}
        <form onSubmit={handleAuth} className="px-6 py-6 flex flex-col gap-4">

          {error && (
            <div className="border border-rust px-3 py-2">
              <p className="text-xs font-mono text-rust">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono uppercase tracking-widest text-graphite/50">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border border-outline px-3 py-2 font-mono text-sm text-graphite placeholder:text-graphite/30 focus:outline-none focus:ring-1 focus:ring-outline"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono uppercase tracking-widest text-graphite/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-outline px-3 py-2 font-mono text-sm text-graphite placeholder:text-graphite/30 focus:outline-none focus:ring-1 focus:ring-outline"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-rust border border-outline text-white uppercase font-mono text-xs tracking-widest hover:bg-[#9a4429] disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Card footer */}
        <div className="border-t border-outline px-6 py-3">
          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(null) }}
            className="text-xs font-mono text-graphite/50 hover:text-graphite transition-colors underline underline-offset-2"
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>

      {/* Video preview */}
      <div className="w-full max-w-sm mt-4 rounded-xl overflow-hidden border border-forest/15 aspect-video bg-paper">
        <video
          src="/Login_Video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  )
}

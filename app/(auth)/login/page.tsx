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
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <form onSubmit={handleAuth} className="w-full max-w-md p-8 border border-outline bg-white">
        <h1 className="text-2xl uppercase font-mono mb-6">
          {isSignup ? 'SIGN UP' : 'LOGIN'}
        </h1>

        {error && (
          <div className="mb-4 p-3 border border-outline bg-red-50 text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-4 border border-outline font-mono"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-6 border border-outline font-mono"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-rust border border-outline text-white uppercase font-mono hover:bg-[#9a4429] disabled:opacity-50"
        >
          {loading ? 'LOADING...' : isSignup ? 'SIGN UP' : 'LOGIN'}
        </button>

        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="mt-4 text-sm underline"
        >
          {isSignup ? 'Already have an account? Login' : 'Need an account? Sign up'}
        </button>
      </form>
    </div>
  )
}

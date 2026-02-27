'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface LateAccount {
  _id: string
  platform: string
  displayName: string
  username: string
}

const OAUTH_PLATFORMS: { id: string; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'threads', label: 'Threads' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'googlebusiness', label: 'Google Business' },
]

export default function ConnectedAccounts() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [accounts, setAccounts] = useState<LateAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Bluesky inline form
  const [blueskyOpen, setBlueskyOpen] = useState(false)
  const [bskyHandle, setBskyHandle] = useState('')
  const [bskyPassword, setBskyPassword] = useState('')
  const [bskyStatus, setBskyStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [bskyError, setBskyError] = useState('')

  // Disconnect state
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Banner from OAuth callback
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Read URL params once on mount
  useEffect(() => {
    const connected = searchParams.get('connected')
    const connectError = searchParams.get('connect_error')
    if (connected) {
      setBanner({ type: 'success', message: `Account connected successfully.` })
      // Clean the URL so a page refresh doesn't re-show the banner
      const url = new URL(window.location.href)
      url.searchParams.delete('connected')
      router.replace(url.pathname + url.search)
    } else if (connectError) {
      setBanner({ type: 'error', message: connectError })
      const url = new URL(window.location.href)
      url.searchParams.delete('connect_error')
      router.replace(url.pathname + url.search)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/social/accounts')
      const data = await res.json()
      setConfigured(data.configured !== false)
      setAccounts(data.accounts ?? [])
      if (data.error) setLoadError(data.error)
    } catch {
      setLoadError('Failed to load accounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleDisconnect = async (accountId: string) => {
    setDisconnecting(accountId)
    try {
      const res = await fetch('/api/social/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a._id !== accountId))
        setBanner({ type: 'success', message: 'Account disconnected.' })
      } else {
        const data = await res.json()
        setBanner({ type: 'error', message: data.error ?? 'Failed to disconnect.' })
      }
    } catch {
      setBanner({ type: 'error', message: 'Failed to disconnect.' })
    } finally {
      setDisconnecting(null)
    }
  }

  const handleConnectBluesky = async () => {
    if (!bskyHandle.trim() || !bskyPassword.trim()) {
      setBskyError('Handle and app password are required.')
      return
    }
    setBskyStatus('saving')
    setBskyError('')
    try {
      const res = await fetch('/api/social/connect/bluesky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: bskyHandle.trim(), password: bskyPassword.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setBanner({ type: 'success', message: 'Bluesky account connected.' })
        setBlueskyOpen(false)
        setBskyHandle('')
        setBskyPassword('')
        setBskyStatus('idle')
        loadAccounts()
      } else {
        setBskyError(data.error ?? 'Failed to connect.')
        setBskyStatus('error')
      }
    } catch {
      setBskyError('Failed to connect.')
      setBskyStatus('error')
    }
  }

  const accountsByPlatform = accounts.reduce<Record<string, LateAccount[]>>((acc, a) => {
    ;(acc[a.platform] ??= []).push(a)
    return acc
  }, {})

  const blueskyAccounts = accountsByPlatform['bluesky'] ?? []

  if (!configured) {
    return (
      <div className="mt-8 p-4 bg-white border border-outline">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Connected Accounts</p>
        <p className="font-mono text-sm text-gray-500 mt-2">
          Social account connections require <span className="text-graphite">LATE_API_KEY</span> and{' '}
          <span className="text-graphite">LATE_PROFILE_ID</span> to be configured.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="mb-4 border-b border-outline pb-3">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Connected Accounts</p>
        <p className="font-mono text-sm text-gray-500">
          Connect your social accounts to schedule posts directly from the library.
        </p>
      </div>

      {banner && (
        <div
          className={`mb-4 p-3 border font-mono text-xs uppercase tracking-wide ${
            banner.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-rust'
          }`}
        >
          {banner.message}
          <button
            onClick={() => setBanner(null)}
            className="ml-3 underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {loadError && (
        <p className="mb-4 text-xs font-mono text-rust">{loadError}</p>
      )}

      <div className="border border-outline flex flex-col gap-0">
        {/* ── OAuth platforms ── */}
        {OAUTH_PLATFORMS.map((platform, idx) => {
          const connected = accountsByPlatform[platform.id] ?? []
          const isLast = idx === OAUTH_PLATFORMS.length - 1 && blueskyAccounts.length === 0

          return (
            <section
              key={platform.id}
              className={isLast ? '' : 'border-b border-outline'}
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
                    {platform.label}
                  </p>
                  {loading ? (
                    <p className="font-mono text-sm text-gray-400">Loading...</p>
                  ) : connected.length === 0 ? (
                    <p className="font-mono text-sm text-gray-400 italic">Not connected</p>
                  ) : (
                    <ul className="flex flex-col gap-2 mt-1">
                      {connected.map((acc) => (
                        <li key={acc._id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-mono text-sm text-graphite">
                              {acc.displayName || acc.username}
                            </span>
                            {acc.username && acc.displayName && (
                              <span className="font-mono text-xs text-gray-400 ml-2">
                                {acc.username}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDisconnect(acc._id)}
                            disabled={disconnecting === acc._id}
                            className="text-xs font-mono uppercase border border-outline px-2 py-1 hover:bg-red-50 hover:border-red-200 hover:text-rust transition-colors flex-shrink-0 disabled:opacity-40"
                          >
                            {disconnecting === acc._id ? 'Removing...' : 'Disconnect'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <a
                  href={`/api/social/connect?platform=${platform.id}`}
                  className="text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  Connect
                </a>
              </div>
            </section>
          )
        })}

        {/* ── Bluesky (credentials) ── */}
        <section>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Bluesky</p>
                {loading ? (
                  <p className="font-mono text-sm text-gray-400">Loading...</p>
                ) : blueskyAccounts.length === 0 && !blueskyOpen ? (
                  <p className="font-mono text-sm text-gray-400 italic">Not connected</p>
                ) : (
                  <ul className="flex flex-col gap-2 mt-1">
                    {blueskyAccounts.map((acc) => (
                      <li key={acc._id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-mono text-sm text-graphite">
                            {acc.displayName || acc.username}
                          </span>
                          {acc.username && acc.displayName && (
                            <span className="font-mono text-xs text-gray-400 ml-2">
                              {acc.username}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDisconnect(acc._id)}
                          disabled={disconnecting === acc._id}
                          className="text-xs font-mono uppercase border border-outline px-2 py-1 hover:bg-red-50 hover:border-red-200 hover:text-rust transition-colors flex-shrink-0 disabled:opacity-40"
                        >
                          {disconnecting === acc._id ? 'Removing...' : 'Disconnect'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {blueskyOpen && (
                  <div className="flex flex-col gap-2 mt-3">
                    <p className="text-xs font-mono text-gray-400">
                      Use an{' '}
                      <a
                        href="https://bsky.app/settings/app-passwords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        app password
                      </a>
                      , not your main account password.
                    </p>
                    <input
                      type="text"
                      value={bskyHandle}
                      onChange={(e) => setBskyHandle(e.target.value)}
                      placeholder="yourhandle.bsky.social"
                      className="w-full max-w-sm"
                      disabled={bskyStatus === 'saving'}
                    />
                    <input
                      type="password"
                      value={bskyPassword}
                      onChange={(e) => setBskyPassword(e.target.value)}
                      placeholder="App password"
                      className="w-full max-w-sm"
                      disabled={bskyStatus === 'saving'}
                    />
                    {bskyError && (
                      <p className="text-xs font-mono text-rust">{bskyError}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleConnectBluesky}
                        disabled={bskyStatus === 'saving'}
                        className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                      >
                        {bskyStatus === 'saving' ? 'Connecting...' : 'Connect'}
                      </button>
                      <button
                        onClick={() => {
                          setBlueskyOpen(false)
                          setBskyHandle('')
                          setBskyPassword('')
                          setBskyError('')
                          setBskyStatus('idle')
                        }}
                        disabled={bskyStatus === 'saving'}
                        className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!blueskyOpen && (
                <button
                  onClick={() => setBlueskyOpen(true)}
                  className="text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

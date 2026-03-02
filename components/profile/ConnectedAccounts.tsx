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

  useEffect(() => {
    const connected = searchParams.get('connected')
    const connectError = searchParams.get('connect_error')
    if (connected) {
      setBanner({ type: 'success', message: `Account connected successfully.` })
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
      <div className="card p-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-graphite/45 mb-2">Connected Accounts</p>
        <p className="font-mono text-sm text-graphite/50">
          Social account connections require <span className="text-graphite font-medium">LATE_API_KEY</span> and{' '}
          <span className="text-graphite font-medium">LATE_PROFILE_ID</span> to be configured.
        </p>
      </div>
    )
  }

  return (
    <div className="card flex flex-col gap-0 p-0 overflow-hidden">

      {/* Section label */}
      <div className="px-6 py-4 border-b border-forest/10 bg-forest/[0.02]">
        <p className="text-xs font-mono uppercase tracking-widest text-graphite/50">Connected Accounts</p>
        <p className="font-mono text-xs text-graphite/40 mt-0.5">
          Connect your social accounts to schedule posts from the library.
        </p>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-xl border font-mono text-xs uppercase tracking-wide flex items-center justify-between ${
          banner.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-rust'
        }`}>
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="ml-3 underline opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {loadError && (
        <p className="mx-6 mt-4 text-xs font-mono text-rust">{loadError}</p>
      )}

      {/* OAuth platforms */}
      {OAUTH_PLATFORMS.map((platform, idx) => {
        const connected = accountsByPlatform[platform.id] ?? []
        const isLast = idx === OAUTH_PLATFORMS.length - 1 && blueskyAccounts.length === 0

        return (
          <section key={platform.id} className={isLast ? '' : 'border-b border-forest/10'}>
            <div className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-widest text-graphite/45 mb-1">
                  {platform.label}
                </p>
                {loading ? (
                  <p className="font-mono text-xs text-graphite/35">Loading...</p>
                ) : connected.length === 0 ? (
                  <p className="font-mono text-xs text-graphite/35 italic">Not connected</p>
                ) : (
                  <ul className="flex flex-col gap-1 mt-1">
                    {connected.map((acc) => (
                      <li key={acc._id} className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm text-graphite">
                          {acc.displayName || acc.username}
                        </span>
                        {acc.username && acc.displayName && (
                          <span className="font-mono text-xs text-graphite/40">{acc.username}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {!loading && (
                connected.length === 0 ? (
                  <a
                    href={`/api/social/connect?platform=${platform.id}`}
                    className="btn-secondary text-xs px-4 py-2 flex-shrink-0"
                  >
                    Connect
                  </a>
                ) : (
                  <button
                    onClick={() => handleDisconnect(connected[0]._id)}
                    disabled={disconnecting === connected[0]._id}
                    className="btn-secondary text-xs px-4 py-2 flex-shrink-0 hover:bg-red-50 hover:border-red-200 hover:text-rust disabled:opacity-40"
                  >
                    {disconnecting === connected[0]._id ? 'Removing...' : 'Disconnect'}
                  </button>
                )
              )}
            </div>
          </section>
        )
      })}

      {/* Bluesky (credentials) */}
      <section>
        <div className="px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-widest text-graphite/45 mb-1">Bluesky</p>
              {loading ? (
                <p className="font-mono text-xs text-graphite/35">Loading...</p>
              ) : blueskyAccounts.length === 0 && !blueskyOpen ? (
                <p className="font-mono text-xs text-graphite/35 italic">Not connected</p>
              ) : (
                <ul className="flex flex-col gap-1 mt-1">
                  {blueskyAccounts.map((acc) => (
                    <li key={acc._id} className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm text-graphite">
                        {acc.displayName || acc.username}
                      </span>
                      {acc.username && acc.displayName && (
                        <span className="font-mono text-xs text-graphite/40">{acc.username}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {blueskyOpen && (
                <div className="flex flex-col gap-2 mt-3">
                  <p className="text-xs font-mono text-graphite/40">
                    Use an{' '}
                    <a
                      href="https://bsky.app/settings/app-passwords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-forest"
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
                    className="field-input max-w-sm"
                    disabled={bskyStatus === 'saving'}
                  />
                  <input
                    type="password"
                    value={bskyPassword}
                    onChange={(e) => setBskyPassword(e.target.value)}
                    placeholder="App password"
                    className="field-input max-w-sm"
                    disabled={bskyStatus === 'saving'}
                  />
                  {bskyError && <p className="text-xs font-mono text-rust">{bskyError}</p>}
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

            {!blueskyOpen && !loading && (
              blueskyAccounts.length === 0 ? (
                <button
                  onClick={() => setBlueskyOpen(true)}
                  className="btn-secondary text-xs px-4 py-2 flex-shrink-0"
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={() => handleDisconnect(blueskyAccounts[0]._id)}
                  disabled={disconnecting === blueskyAccounts[0]._id}
                  className="btn-secondary text-xs px-4 py-2 flex-shrink-0 hover:bg-red-50 hover:border-red-200 hover:text-rust disabled:opacity-40"
                >
                  {disconnecting === blueskyAccounts[0]._id ? 'Removing...' : 'Disconnect'}
                </button>
              )
            )}
          </div>
        </div>
      </section>

    </div>
  )
}

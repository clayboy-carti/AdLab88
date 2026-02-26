'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/database'

type Props = {
  profile: UserProfile
}

type SectionStatus = 'idle' | 'editing' | 'saving' | 'success' | 'error'

export default function ProfileForm({ profile }: Props) {
  const supabase = createClient()

  // --- Display Name ---
  const [nameStatus, setNameStatus] = useState<SectionStatus>('idle')
  const [nameValue, setNameValue] = useState(profile.full_name)
  const [nameError, setNameError] = useState('')

  const saveName = async () => {
    if (!nameValue.trim()) {
      setNameError('Name cannot be empty.')
      return
    }
    setNameStatus('saving')
    setNameError('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: nameValue.trim() }),
    })
    if (res.ok) {
      setNameStatus('success')
      setTimeout(() => setNameStatus('idle'), 2000)
    } else {
      const data = await res.json()
      setNameError(data.error ?? 'Failed to save.')
      setNameStatus('error')
    }
  }

  const cancelName = () => {
    setNameValue(profile.full_name)
    setNameError('')
    setNameStatus('idle')
  }

  // --- Email ---
  const [emailStatus, setEmailStatus] = useState<SectionStatus>('idle')
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const sendEmailUpdate = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailStatus('saving')
    setEmailError('')
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) {
      setEmailError(error.message)
      setEmailStatus('error')
    } else {
      setEmailStatus('success')
    }
  }

  const cancelEmail = () => {
    setNewEmail('')
    setEmailError('')
    setEmailStatus('idle')
  }

  // --- Password Reset ---
  const [resetStatus, setResetStatus] = useState<SectionStatus>('idle')
  const [resetError, setResetError] = useState('')

  const sendPasswordReset = async () => {
    setResetStatus('saving')
    setResetError('')
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) {
      setResetError(error.message)
      setResetStatus('error')
    } else {
      setResetStatus('success')
    }
  }

  return (
    <div className="flex flex-col gap-0 border border-outline">

      {/* ── Display Name ── */}
      <section className="border-b border-outline">
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Display Name</p>
            {nameStatus === 'editing' || nameStatus === 'saving' || nameStatus === 'error' ? (
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="Your full name"
                  className="w-full max-w-sm"
                  disabled={nameStatus === 'saving'}
                />
                {nameError && (
                  <p className="text-xs font-mono text-rust">{nameError}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={saveName}
                    disabled={nameStatus === 'saving'}
                    className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                  >
                    {nameStatus === 'saving' ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelName}
                    disabled={nameStatus === 'saving'}
                    className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-mono text-graphite text-base mt-1">
                  {profile.full_name || <span className="text-gray-400 italic">Not set</span>}
                </p>
                {nameStatus === 'success' && (
                  <p className="text-xs font-mono text-green-700 mt-1 uppercase tracking-wide">Saved.</p>
                )}
              </>
            )}
          </div>
          {nameStatus === 'idle' || nameStatus === 'success' ? (
            <button
              onClick={() => setNameStatus('editing')}
              className="text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              Edit
            </button>
          ) : null}
        </div>
      </section>

      {/* ── Email Address ── */}
      <section className="border-b border-outline">
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Email Address</p>
            <p className="font-mono text-graphite text-base mt-1 break-all">{profile.email}</p>

            {emailStatus === 'editing' || emailStatus === 'saving' || emailStatus === 'error' ? (
              <div className="flex flex-col gap-2 mt-4">
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wide">New email address</p>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  className="w-full max-w-sm"
                  disabled={emailStatus === 'saving'}
                />
                {emailError && (
                  <p className="text-xs font-mono text-rust">{emailError}</p>
                )}
                <p className="text-xs font-mono text-gray-400">
                  A confirmation link will be sent to both your current and new email.
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={sendEmailUpdate}
                    disabled={emailStatus === 'saving'}
                    className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                  >
                    {emailStatus === 'saving' ? 'Sending...' : 'Send Confirmation'}
                  </button>
                  <button
                    onClick={cancelEmail}
                    disabled={emailStatus === 'saving'}
                    className="btn-secondary text-xs px-4 py-2 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : emailStatus === 'success' ? (
              <div className="mt-3 p-3 bg-green-50 border border-green-200">
                <p className="text-xs font-mono text-green-800 uppercase tracking-wide">
                  Confirmation emails sent. Check both inboxes to complete the change.
                </p>
                <button
                  onClick={cancelEmail}
                  className="text-xs font-mono underline text-green-700 mt-1"
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
          {emailStatus === 'idle' ? (
            <button
              onClick={() => setEmailStatus('editing')}
              className="text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              Change
            </button>
          ) : null}
        </div>
      </section>

      {/* ── Password ── */}
      <section>
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Password</p>

            {resetStatus === 'idle' && (
              <p className="font-mono text-graphite text-sm mt-1">
                Send a password reset link to <span className="text-rust">{profile.email}</span>.
              </p>
            )}
            {resetStatus === 'saving' && (
              <p className="font-mono text-gray-400 text-sm mt-1">Sending reset email...</p>
            )}
            {resetStatus === 'success' && (
              <div className="mt-1 p-3 bg-green-50 border border-green-200">
                <p className="text-xs font-mono text-green-800 uppercase tracking-wide">
                  Reset link sent — check your inbox.
                </p>
              </div>
            )}
            {resetStatus === 'error' && (
              <p className="text-xs font-mono text-rust mt-1">{resetError}</p>
            )}
          </div>
          {(resetStatus === 'idle' || resetStatus === 'error') && (
            <button
              onClick={sendPasswordReset}
              className="text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              Send Reset Email
            </button>
          )}
        </div>
      </section>

    </div>
  )
}

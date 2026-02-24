'use client'

import { useEffect, useRef, useState } from 'react'
import type { VideoItem } from './VideoCard'
import type { LateAccount, LatePlatform } from '@/lib/late'

interface VideoModalProps {
  video: VideoItem
  onClose: () => void
  onDelete?: (videoId: string) => void
}

// ─── Accounts cache (shared with AdModal — module-level) ─────────────────────
const ACCOUNTS_CACHE_TTL = 5 * 60 * 1000
let accountsCache: { accounts: LateAccount[]; configured: boolean; ts: number } | null = null

function fetchAccountsCached(): Promise<{ accounts: LateAccount[]; configured: boolean }> {
  if (accountsCache && Date.now() - accountsCache.ts < ACCOUNTS_CACHE_TTL) {
    return Promise.resolve({ accounts: accountsCache.accounts, configured: accountsCache.configured })
  }
  return fetch('/api/social/accounts')
    .then((r) => r.json())
    .then((data) => {
      accountsCache = { accounts: data.accounts ?? [], configured: data.configured !== false, ts: Date.now() }
      return { accounts: accountsCache.accounts, configured: accountsCache.configured }
    })
}

// ─── Calendar helpers ────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface PickerDay {
  dayNum: number
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
}

function buildPickerGrid(year: number, month: number): PickerDay[] {
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(todayDate)

  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const leadingDays = firstOfMonth.getDay()
  const totalCells = Math.ceil((leadingDays + lastOfMonth.getDate()) / 7) * 7
  const trailingDays = totalCells - leadingDays - lastOfMonth.getDate()

  const cells: PickerDay[] = []

  for (let i = leadingDays - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    date.setHours(0, 0, 0, 0)
    const ds = toDateStr(date)
    cells.push({ dayNum: date.getDate(), dateStr: ds, isCurrentMonth: false, isToday: ds === todayStr, isPast: ds < todayStr })
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    const ds = toDateStr(date)
    cells.push({ dayNum: d, dateStr: ds, isCurrentMonth: true, isToday: ds === todayStr, isPast: ds < todayStr })
  }
  for (let d = 1; d <= trailingDays; d++) {
    const date = new Date(year, month + 1, d)
    date.setHours(0, 0, 0, 0)
    const ds = toDateStr(date)
    cells.push({ dayNum: d, dateStr: ds, isCurrentMonth: false, isToday: ds === todayStr, isPast: ds < todayStr })
  }
  return cells
}

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Platform icon map ────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, () => JSX.Element> = {
  twitter:   XTwitterIcon,
  x:         XTwitterIcon,
  facebook:  FacebookIcon,
  instagram: InstagramIcon,
  linkedin:  LinkedInIcon,
}

function PlatformIcon({ platform }: { platform: string }) {
  const Icon = PLATFORM_ICONS[platform.toLowerCase()]
  return Icon ? <Icon /> : <span className="text-xs font-mono uppercase">{platform[0]}</span>
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function VideoModal({ video, onClose, onDelete }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Post caption for social scheduling (not persisted, only used when scheduling)
  const [postCaption, setPostCaption] = useState('')
  const [captionCopied, setCaptionCopied] = useState(false)
  const motionCopied = false // handled by motionCopiedState below
  const [motionCopiedState, setMotionCopiedState] = useState(false)

  // Download
  const [downloading, setDownloading] = useState(false)

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Late accounts
  const [lateAccounts, setLateAccounts] = useState<LateAccount[]>([])
  const [lateConfigured, setLateConfigured] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])

  const toggleAccount = (accountId: string) =>
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    )

  // Schedule
  const now = new Date()
  const [pickerMonth, setPickerMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduledPostId, setScheduledPostId] = useState<string | null>(null)
  const [unscheduling, setUnscheduling] = useState(false)
  const [unscheduleError, setUnscheduleError] = useState<string | null>(null)
  const [lateStatus, setLateStatus] = useState<'skipped' | 'success' | 'error' | null>(null)
  const [lateSkipReason, setLateSkipReason] = useState<'no_api_key' | 'no_platforms' | null>(null)
  const [lateError, setLateError] = useState<string | null>(null)

  // Load accounts + existing schedule
  useEffect(() => {
    const fetchAccounts = fetchAccountsCached()
    const fetchSchedule = fetch(`/api/social/schedule-video?videoId=${video.id}`).then((r) => r.json())

    Promise.all([fetchAccounts, fetchSchedule])
      .then(([accountsData, scheduleData]) => {
        setLateAccounts(accountsData.accounts ?? [])
        setLateConfigured(accountsData.configured !== false)
        setAccountsLoading(false)

        const { postId, scheduledFor, platforms } = scheduleData
        if (scheduledFor) {
          const [datePart, timePart] = scheduledFor.split('T')
          setSelectedDate(datePart)
          if (timePart) setSelectedTime(timePart.slice(0, 5))
          setScheduleConfirmed(true)
          setScheduledPostId(postId ?? null)
        }
        if (Array.isArray(platforms) && platforms.length > 0) {
          setSelectedAccountIds(platforms)
        }
      })
      .catch(() => setAccountsLoading(false))
  }, [video.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  // ── Copy motion prompt
  const handleCopyMotion = async () => {
    if (!video.motion_prompt) return
    try {
      await navigator.clipboard.writeText(video.motion_prompt)
      setMotionCopiedState(true)
      setTimeout(() => setMotionCopiedState(false), 2000)
    } catch { /* silent */ }
  }

  // ── Copy post caption
  const handleCopyCaption = async () => {
    if (!postCaption) return
    try {
      await navigator.clipboard.writeText(postCaption)
      setCaptionCopied(true)
      setTimeout(() => setCaptionCopied(false), 2000)
    } catch { /* silent */ }
  }

  // ── Download
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/download-video?videoId=${video.id}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('x-filename') || `video_${video.id}.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  // ── Delete
  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/delete-video?videoId=${video.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      onDelete?.(video.id)
      onClose()
    } catch (err: any) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  // ── Schedule
  const handleSchedule = async () => {
    if (!selectedDate) return
    if (lateConfigured && lateAccounts.length > 0 && selectedAccountIds.length === 0) {
      setScheduleError('Please select at least one social media account')
      return
    }
    setScheduling(true)
    setScheduleError(null)
    try {
      const platforms: LatePlatform[] = selectedAccountIds
        .map((id) => {
          const acct = lateAccounts.find((a) => a._id === id)
          return acct ? { platform: acct.platform, accountId: acct._id } : null
        })
        .filter(Boolean) as LatePlatform[]

      const res = await fetch('/api/social/schedule-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          scheduledFor: `${selectedDate}T${selectedTime}`,
          caption: postCaption,
          platforms,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to schedule post')
      }
      const data = await res.json()
      setScheduleConfirmed(true)
      setScheduledPostId(data.post?.id ?? null)
      setLateStatus(data.lateStatus ?? null)
      setLateSkipReason(data.lateSkipReason ?? null)
      setLateError(data.lateError ?? null)
    } catch (err: any) {
      setScheduleError(err.message)
    } finally {
      setScheduling(false)
    }
  }

  // ── Unschedule
  const handleUnschedule = async () => {
    setUnscheduleError(null)
    if (!scheduledPostId) {
      setScheduleConfirmed(false)
      setSelectedDate(null)
      setLateStatus(null)
      setLateSkipReason(null)
      setLateError(null)
      return
    }
    setUnscheduling(true)
    try {
      const res = await fetch(`/api/social/schedule-video?postId=${scheduledPostId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to unschedule post')
      }
      setScheduleConfirmed(false)
      setSelectedDate(null)
      setScheduledPostId(null)
      setLateStatus(null)
      setLateSkipReason(null)
      setLateError(null)
    } catch (err: any) {
      setUnscheduleError(err.message)
    } finally {
      setUnscheduling(false)
    }
  }

  const pickerYear = pickerMonth.getFullYear()
  const pickerMonthIdx = pickerMonth.getMonth()
  const pickerCells = buildPickerGrid(pickerYear, pickerMonthIdx)

  const formattedDate = new Date(video.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-white border border-outline w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline flex-shrink-0">
          <span className="text-xs font-mono uppercase text-gray-400">{formattedDate}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || !video.signedUrl}
              title="Download video"
              className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? <span className="font-mono">...</span> : <><DownloadIcon /><span>Download</span></>}
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete video"
                className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
              >
                <TrashIcon /><span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {deleteError && (
                  <span className="text-xs font-mono text-red-600">{deleteError}</span>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs font-mono uppercase border border-red-500 text-red-600 px-3 py-1.5 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'DELETING...' : 'CONFIRM DELETE'}
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                  disabled={deleting}
                  className="text-xs font-mono uppercase text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center px-3 py-1.5 border-2 border-rust text-rust hover:bg-rust hover:text-white transition-colors"
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Video + Publish To + Calendar — 3 columns */}
        <div className="flex border-b border-outline flex-shrink-0 min-h-[280px]">

          {/* Left: video player */}
          <div className="flex-1 border-r border-outline flex items-center justify-center bg-gray-900">
            {video.signedUrl ? (
              <video
                ref={videoRef}
                src={video.signedUrl}
                controls
                autoPlay
                loop
                className="max-h-[45vh] w-auto max-w-full object-contain"
              />
            ) : (
              <span className="text-xs font-mono text-gray-400 uppercase">No video</span>
            )}
          </div>

          {/* Middle: Publish To — platform toggles */}
          <div className="w-56 flex flex-col flex-shrink-0 border-r border-outline">
            <div className="px-5 py-3 border-b border-outline bg-gray-50">
              <p className="text-xs uppercase font-mono text-gray-500 tracking-widest">Publish To</p>
            </div>

            {accountsLoading ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <span className="text-xs font-mono text-gray-400 uppercase animate-pulse">Loading accounts…</span>
              </div>
            ) : !lateConfigured ? (
              <div className="flex-1 p-5 flex flex-col gap-3">
                <p className="text-xs font-mono text-gray-500 leading-relaxed">
                  Add your <span className="text-graphite font-bold">LATE_API_KEY</span> to Vercel environment variables (enable for Preview + Production) or .env.local for local development.
                </p>
                <a
                  href="https://getlate.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono uppercase border border-outline px-3 py-2 text-center hover:bg-gray-100 transition-colors"
                >
                  Get Late API Key →
                </a>
              </div>
            ) : lateAccounts.length === 0 ? (
              <div className="flex-1 p-5 flex flex-col gap-3">
                <p className="text-xs font-mono text-gray-500 leading-relaxed">
                  No social accounts connected. Connect accounts in your Late dashboard first.
                </p>
                <a
                  href="https://app.getlate.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono uppercase border border-outline px-3 py-2 text-center hover:bg-gray-100 transition-colors"
                >
                  Open Late Dashboard →
                </a>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-outline overflow-y-auto">
                {lateAccounts.map((acct) => {
                  const enabled = selectedAccountIds.includes(acct._id)
                  return (
                    <div key={acct._id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`flex-shrink-0 transition-colors ${enabled ? 'text-graphite' : 'text-gray-300'}`}>
                          <PlatformIcon platform={acct.platform} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs font-mono uppercase tracking-wide truncate transition-colors ${enabled ? 'text-graphite' : 'text-gray-400'}`}>
                            {acct.displayName || acct.username}
                          </p>
                          {acct.username && acct.displayName && (
                            <p className="text-[10px] font-mono text-gray-400 truncate">@{acct.username}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAccount(acct._id)}
                        role="switch"
                        aria-checked={enabled}
                        className={`ml-2 relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-rust' : 'bg-gray-200'}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: mini calendar */}
          <div className="w-60 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-outline bg-gray-50 flex items-center justify-between">
              <p className="text-xs uppercase font-mono text-gray-500 tracking-widest">Schedule</p>
              {selectedDate && !scheduleConfirmed && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-mono text-gray-400 hover:text-gray-700 transition-colors uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col p-3 overflow-hidden">
              {scheduleConfirmed ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-forest flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-mono text-graphite font-bold leading-snug">
                        {formatSelectedDate(selectedDate!)}
                      </p>
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5">{selectedTime}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUnschedule}
                    disabled={unscheduling}
                    className="text-xs font-mono uppercase text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors text-left"
                  >
                    {unscheduling ? 'Removing...' : 'Unschedule'}
                  </button>
                  {unscheduleError && (
                    <p className="text-[10px] font-mono text-red-600">{unscheduleError}</p>
                  )}
                  {lateStatus === 'success' && (
                    <p className="text-[10px] font-mono text-forest bg-forest/5 border border-forest/20 px-2 py-1.5 leading-snug">
                      ✓ Synced to Late
                    </p>
                  )}
                  {lateStatus === 'skipped' && lateSkipReason === 'no_api_key' && (
                    <p className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1.5 leading-snug">
                      Saved locally — LATE_API_KEY not found in environment.
                    </p>
                  )}
                  {lateStatus === 'skipped' && lateSkipReason === 'no_platforms' && (
                    <p className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-outline px-2 py-1.5 leading-snug">
                      Saved locally — select accounts on the left to publish to Late
                    </p>
                  )}
                  {(lateStatus === 'error' || lateError) && (
                    <div className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-1.5">
                      <p className="font-bold">Late API error</p>
                      {lateError && <p className="mt-0.5 opacity-80">{lateError}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-1.5">
                    <button
                      onClick={() => setPickerMonth(new Date(pickerYear, pickerMonthIdx - 1, 1))}
                      className="border border-outline px-1.5 py-0.5 font-mono text-xs hover:bg-gray-100 transition-colors"
                    >←</button>
                    <span className="text-[10px] uppercase font-mono tracking-wider">
                      {MONTH_NAMES[pickerMonthIdx]} {pickerYear}
                    </span>
                    <button
                      onClick={() => setPickerMonth(new Date(pickerYear, pickerMonthIdx + 1, 1))}
                      className="border border-outline px-1.5 py-0.5 font-mono text-xs hover:bg-gray-100 transition-colors"
                    >→</button>
                  </div>

                  {/* Day labels */}
                  <div className="grid grid-cols-7 mb-0.5">
                    {DAY_LABELS.map((d, i) => (
                      <div key={i} className="text-[9px] uppercase font-mono text-gray-400 text-center py-0.5">{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7">
                    {pickerCells.map((cell, i) => {
                      const isSelected = cell.dateStr === selectedDate
                      const isDisabled = cell.isPast
                      return (
                        <button
                          key={cell.dateStr + '-' + i}
                          onClick={() => { if (!isDisabled) setSelectedDate(cell.dateStr) }}
                          disabled={isDisabled}
                          className={[
                            'h-7 flex items-center justify-center text-[10px] font-mono transition-colors',
                            isSelected
                              ? 'bg-rust text-white font-bold'
                              : cell.isToday
                              ? 'text-rust font-bold bg-white'
                              : cell.isCurrentMonth
                              ? isDisabled
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-graphite hover:bg-paper'
                              : 'text-gray-300 cursor-not-allowed',
                          ].filter(Boolean).join(' ')}
                        >
                          {cell.dayNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Time selector */}
                  <div className="flex items-center gap-2 mt-2 border border-outline px-2 py-0.5">
                    <span className="text-xs font-mono text-gray-400 uppercase flex-shrink-0">Time</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      <select
                        value={selectedTime.split(':')[0]}
                        onChange={(e) => setSelectedTime(`${e.target.value}:${selectedTime.split(':')[1]}`)}
                        className="text-xs font-mono text-graphite bg-transparent border-none outline-none cursor-pointer appearance-none"
                      >
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className="text-xs font-mono text-gray-400">:</span>
                      <select
                        value={selectedTime.split(':')[1]}
                        onChange={(e) => setSelectedTime(`${selectedTime.split(':')[0]}:${e.target.value}`)}
                        className="text-xs font-mono text-graphite bg-transparent border-none outline-none cursor-pointer appearance-none"
                      >
                        {['00', '15', '30', '45'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Schedule button */}
                  <div className="mt-2">
                    {scheduleError && (
                      <p className="text-[10px] font-mono text-red-600 mb-1">{scheduleError}</p>
                    )}
                    <button
                      onClick={handleSchedule}
                      disabled={!selectedDate || scheduling || (lateConfigured && lateAccounts.length > 0 && selectedAccountIds.length === 0)}
                      className="btn-primary w-full text-xs py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {scheduling ? 'SCHEDULING...' : !selectedDate ? 'SELECT A DATE' : (lateConfigured && lateAccounts.length > 0 && selectedAccountIds.length === 0) ? 'SELECT AN ACCOUNT' : 'SCHEDULE'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">

          {/* Motion Prompt (read-only + copy) */}
          {video.motion_prompt && (
            <div className="border border-outline p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase font-mono text-gray-400 tracking-widest">Motion</p>
                <button
                  onClick={handleCopyMotion}
                  className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  {motionCopiedState ? <><CheckIcon /><span>Copied</span></> : <><CopyIcon /><span>Copy</span></>}
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{video.motion_prompt}</p>
            </div>
          )}

          {/* Post Caption — editable, used for social scheduling */}
          <div className="border border-outline p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase font-mono text-gray-400 tracking-widest">Post Caption</p>
              <button
                onClick={handleCopyCaption}
                disabled={!postCaption}
                className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {captionCopied ? <><CheckIcon /><span>Copied</span></> : <><CopyIcon /><span>Copy</span></>}
              </button>
            </div>
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="Write a caption for this video post…"
              rows={4}
              className="w-full border border-outline p-3 text-sm font-mono bg-white resize-none focus:outline-none focus:border-rust placeholder:text-gray-300"
            />
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="9" y="9" width="13" height="13" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XTwitterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

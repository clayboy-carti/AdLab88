'use client'

import { useEffect, useRef, useState } from 'react'
import type { CarouselSelItem } from './LibraryGrid'
import type { LateAccount, LatePlatform } from '@/lib/late'

interface CarouselModalProps {
  items: CarouselSelItem[]
  onItemsChange: (items: CarouselSelItem[]) => void
  onClose: () => void
  onScheduled: () => void
}

// ─── Accounts cache (shared with AdModal) ────────────────────────────────────
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

// ─── Calendar helpers ─────────────────────────────────────────────────────────

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

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CarouselModal({ items, onItemsChange, onClose, onScheduled }: CarouselModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // ── Caption ──
  const [caption, setCaption] = useState('')

  // ── Accounts ──
  const [lateAccounts, setLateAccounts] = useState<LateAccount[]>([])
  const [lateConfigured, setLateConfigured] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])

  const toggleAccount = (accountId: string) =>
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    )

  // ── Calendar ──
  const now = new Date()
  const [pickerMonth, setPickerMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState('09:00')

  // ── Schedule state ──
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [lateStatus, setLateStatus] = useState<'skipped' | 'success' | 'error' | null>(null)
  const [lateSkipReason, setLateSkipReason] = useState<'no_api_key' | 'no_platforms' | null>(null)
  const [lateError, setLateError] = useState<string | null>(null)

  useEffect(() => {
    fetchAccountsCached()
      .then(({ accounts, configured }) => {
        setLateAccounts(accounts)
        setLateConfigured(configured)
      })
      .catch(() => {})
      .finally(() => setAccountsLoading(false))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  // ── Reorder ──
  const moveItem = (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= items.length) return
    const arr = [...items]
    ;[arr[index], arr[next]] = [arr[next], arr[index]]
    onItemsChange(arr)
  }

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  // ── Schedule ──
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

      const res = await fetch('/api/social/schedule-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, type }) => ({ id, type })),
          caption,
          scheduledFor: `${selectedDate}T${selectedTime}`,
          platforms,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to schedule carousel')
      }

      const data = await res.json()
      setScheduleConfirmed(true)
      setLateStatus(data.lateStatus ?? null)
      setLateSkipReason(data.lateSkipReason ?? null)
      setLateError(data.lateError ?? null)
    } catch (err: any) {
      setScheduleError(err.message)
    } finally {
      setScheduling(false)
    }
  }

  const pickerYear = pickerMonth.getFullYear()
  const pickerMonthIdx = pickerMonth.getMonth()
  const pickerCells = buildPickerGrid(pickerYear, pickerMonthIdx)

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-white border border-outline w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase text-gray-400">Carousel</span>
            <span className="text-xs font-mono bg-rust text-white px-2 py-0.5">{items.length} items</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center px-3 py-1.5 border-2 border-rust text-rust hover:bg-rust hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Three-column section ── */}
        <div className="flex border-b border-outline flex-shrink-0 min-h-[320px]">

          {/* Left: Thumbnail strip + reorder */}
          <div className="flex-1 border-r border-outline flex flex-col">
            <div className="px-5 py-3 border-b border-outline bg-gray-50">
              <p className="text-xs uppercase font-mono text-gray-500 tracking-widest">Slide Order</p>
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">Use arrows to reorder · × to remove</p>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
              <div className="flex gap-3 h-full items-start min-w-max">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {/* Thumbnail */}
                    <div className="relative w-44 h-44 border border-outline bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.signedUrl ? (
                        item.type === 'video' ? (
                          <video src={item.signedUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.signedUrl} alt="" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[9px] font-mono text-gray-400 uppercase">No preview</span>
                        </div>
                      )}
                      {/* Order badge */}
                      <span className="absolute top-1 left-1 bg-rust text-white text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center rounded-full">
                        {idx + 1}
                      </span>
                      {/* Type badge */}
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-mono uppercase px-1">
                        {item.type === 'video' ? 'vid' : 'img'}
                      </span>
                    </div>
                    {/* Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-graphite disabled:opacity-20 transition-colors p-0.5"
                        title="Move left"
                      >
                        <ArrowLeftIcon />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                        title="Remove"
                      >
                        <RemoveIcon />
                      </button>
                      <button
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === items.length - 1}
                        className="text-gray-400 hover:text-graphite disabled:opacity-20 transition-colors p-0.5"
                        title="Move right"
                      >
                        <ArrowRightIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Publish To */}
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
                  Add your <span className="text-graphite font-bold">LATE_API_KEY</span> to enable publishing.
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

          {/* Right: Calendar */}
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

                  {lateStatus === 'success' && (
                    <p className="text-[10px] font-mono text-forest bg-forest/5 border border-forest/20 px-2 py-1.5 leading-snug">
                      ✓ Carousel synced to Late
                    </p>
                  )}
                  {lateStatus === 'skipped' && lateSkipReason === 'no_api_key' && (
                    <p className="text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1.5 leading-snug">
                      Saved locally — LATE_API_KEY not configured.
                    </p>
                  )}
                  {lateStatus === 'skipped' && lateSkipReason === 'no_platforms' && (
                    <p className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-outline px-2 py-1.5 leading-snug">
                      Saved locally — select accounts to publish to Late
                    </p>
                  )}
                  {(lateStatus === 'error' || lateError) && (
                    <div className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-1.5">
                      <p className="font-bold">Late API error</p>
                      {lateError && <p className="mt-0.5 opacity-80">{lateError}</p>}
                    </div>
                  )}

                  <button
                    onClick={onScheduled}
                    className="btn-primary w-full text-xs py-1.5 mt-2"
                  >
                    DONE
                  </button>
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
                      disabled={
                        !selectedDate ||
                        items.length < 2 ||
                        scheduling ||
                        (lateConfigured && lateAccounts.length > 0 && selectedAccountIds.length === 0)
                      }
                      className="btn-primary w-full text-xs py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {scheduling
                        ? 'SCHEDULING...'
                        : !selectedDate
                        ? 'SELECT A DATE'
                        : lateConfigured && lateAccounts.length > 0 && selectedAccountIds.length === 0
                        ? 'SELECT AN ACCOUNT'
                        : 'SCHEDULE CAROUSEL'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── Caption ── */}
        <div className="p-6">
          <div className="border border-outline p-4">
            <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-3">Caption</p>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              placeholder="Write a caption for your carousel post…"
              className="w-full text-sm font-mono bg-white resize-none focus:outline-none text-gray-700 leading-relaxed placeholder:text-gray-300"
            />
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-2">
            Instagram carousels use a single caption for all slides.
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function RemoveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

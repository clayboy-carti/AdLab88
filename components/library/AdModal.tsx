'use client'

import { useEffect, useRef, useState } from 'react'
import type { Ad } from './AdCard'

interface AdModalProps {
  ad: Ad
  onClose: () => void
  onCaptionUpdate: (adId: string, newCaption: string) => void
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

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function AdModal({ ad, onClose, onCaptionUpdate }: AdModalProps) {
  const [caption, setCaption] = useState(ad.caption)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Schedule state
  const now = new Date()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerOpen) { setPickerOpen(false); return }
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, pickerOpen])

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }

  const handleSaveCaption = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/update-ad-caption', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id, caption }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }
      onCaptionUpdate(ad.id, caption)
      setEditing(false)
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setCaption(ad.caption)
    setSaveError(null)
    setEditing(false)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/download-ad?adId=${ad.id}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('x-filename') || `ad_${ad.id}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handleSchedule = async () => {
    if (!selectedDate) return
    setScheduling(true)
    setScheduleError(null)
    try {
      const res = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: ad.id,
          scheduledFor: selectedDate,
          platform: ad.target_platform || 'post',
          caption: caption,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to schedule post')
      }
      setScheduleConfirmed(true)
    } catch (err: any) {
      setScheduleError(err.message)
    } finally {
      setScheduling(false)
    }
  }

  const pickerYear = pickerMonth.getFullYear()
  const pickerMonthIdx = pickerMonth.getMonth()
  const pickerCells = buildPickerGrid(pickerYear, pickerMonthIdx)

  const formattedDate = new Date(ad.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="bg-white border border-outline w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline flex-shrink-0">
          <span className="text-xs font-mono uppercase text-gray-400">{formattedDate}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || !ad.signedUrl}
              title="Download image"
              className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? <span className="font-mono">...</span> : <><DownloadIcon /><span>Download</span></>}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 border border-outline hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Image */}
        {ad.signedUrl ? (
          <div className="border-b border-outline flex-shrink-0">
            <img src={ad.signedUrl} alt={ad.hook} className="w-full h-auto" />
          </div>
        ) : (
          <div className="border-b border-outline bg-gray-100 h-48 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-mono text-gray-400 uppercase">No image</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">

          {/* Hook + CTA */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">Hook</p>
              <p className="text-xl font-bold text-graphite leading-snug">{ad.hook}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-mono text-gray-400 tracking-widest mb-1">CTA</p>
              <p className="text-sm font-bold text-rust">{ad.cta}</p>
            </div>
          </div>

          {/* Caption section */}
          <div className="border border-outline p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase font-mono text-gray-400 tracking-widest">Caption</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCaption}
                  title="Copy caption"
                  className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  {copied ? <><CheckIcon /><span>Copied</span></> : <><CopyIcon /><span>Copy</span></>}
                </button>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    title="Edit caption"
                    className="flex items-center gap-1.5 text-xs font-mono uppercase border border-outline px-3 py-1.5 hover:bg-gray-100 transition-colors"
                  >
                    <EditIcon /><span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <div className="flex flex-col gap-3">
                <textarea
                  ref={textareaRef}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={6}
                  className="w-full border border-outline p-3 text-sm font-mono bg-white resize-none focus:outline-none focus:border-rust"
                />
                {saveError && <p className="text-xs text-red-600 font-mono">{saveError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSaveCaption} disabled={saving} className="btn-primary text-sm px-4 py-2">
                    {saving ? 'SAVING...' : 'SAVE'}
                  </button>
                  <button onClick={handleCancelEdit} disabled={saving} className="btn-secondary text-sm px-4 py-2">
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{caption}</p>
            )}
          </div>

          {/* Meta tags */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 uppercase">{ad.positioning_angle}</span>
            {ad.target_platform && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 uppercase">{ad.target_platform}</span>
            )}
            {ad.framework_applied && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 uppercase">{ad.framework_applied}</span>
            )}
          </div>

          {/* ── Schedule Post ── */}
          <div className="border border-outline">
            <div className="px-4 py-3 border-b border-outline bg-gray-50 flex items-center justify-between">
              <p className="text-xs uppercase font-mono text-gray-500 tracking-widest">Schedule Post</p>
              {selectedDate && !scheduleConfirmed && (
                <button
                  onClick={() => { setSelectedDate(null); setPickerOpen(false) }}
                  className="text-xs font-mono text-gray-400 hover:text-gray-700 transition-colors uppercase"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="p-4 flex flex-col gap-4">
              {scheduleConfirmed ? (
                // Confirmed state
                <div className="flex items-center gap-3 py-2">
                  <span className="inline-block w-2 h-2 bg-forest flex-shrink-0" />
                  <p className="text-sm font-mono text-graphite">
                    Scheduled for{' '}
                    <span className="font-bold">{formatSelectedDate(selectedDate!)}</span>
                  </p>
                  <button
                    onClick={() => { setScheduleConfirmed(false); setSelectedDate(null) }}
                    className="ml-auto text-xs font-mono uppercase text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  {/* Date trigger button */}
                  <button
                    onClick={() => setPickerOpen((o) => !o)}
                    className="flex items-center justify-between w-full border border-outline px-4 py-3 text-sm font-mono hover:bg-gray-50 transition-colors"
                  >
                    <span className={selectedDate ? 'text-graphite' : 'text-gray-400'}>
                      {selectedDate ? formatSelectedDate(selectedDate) : 'Select a date'}
                    </span>
                    <CalendarIcon open={pickerOpen} />
                  </button>

                  {/* Inline calendar picker */}
                  {pickerOpen && (
                    <div className="border border-outline">
                      {/* Picker month nav */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-outline bg-gray-50">
                        <button
                          onClick={() => setPickerMonth(new Date(pickerYear, pickerMonthIdx - 1, 1))}
                          className="border border-outline px-2 py-1 font-mono text-xs hover:bg-gray-100 transition-colors"
                        >
                          ←
                        </button>
                        <span className="text-xs uppercase font-mono tracking-wider">
                          {MONTH_NAMES[pickerMonthIdx]} {pickerYear}
                        </span>
                        <button
                          onClick={() => setPickerMonth(new Date(pickerYear, pickerMonthIdx + 1, 1))}
                          className="border border-outline px-2 py-1 font-mono text-xs hover:bg-gray-100 transition-colors"
                        >
                          →
                        </button>
                      </div>

                      {/* Day-of-week labels */}
                      <div className="grid grid-cols-7 border-b border-outline">
                        {DAY_LABELS.map((d, i) => (
                          <div key={i} className="text-[10px] uppercase font-mono text-gray-400 text-center py-1.5">
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Day cells */}
                      <div className="grid grid-cols-7">
                        {pickerCells.map((cell, i) => {
                          const isSelected = cell.dateStr === selectedDate
                          const isLastRow = i >= pickerCells.length - 7
                          const isDisabled = cell.isPast

                          return (
                            <button
                              key={cell.dateStr + '-' + i}
                              onClick={() => {
                                if (isDisabled) return
                                setSelectedDate(cell.dateStr)
                                setPickerOpen(false)
                              }}
                              disabled={isDisabled}
                              className={[
                                'h-9 flex items-center justify-center text-xs font-mono transition-colors',
                                'border-b border-r border-outline',
                                (i + 1) % 7 === 0 ? 'border-r-0' : '',
                                isLastRow ? 'border-b-0' : '',
                                isSelected
                                  ? 'bg-rust text-white font-bold'
                                  : cell.isToday
                                  ? 'text-rust font-bold bg-white'
                                  : cell.isCurrentMonth
                                  ? isDisabled
                                    ? 'text-gray-300 bg-white cursor-not-allowed'
                                    : 'text-graphite bg-white hover:bg-paper'
                                  : 'text-gray-300 bg-gray-50 cursor-not-allowed',
                              ].filter(Boolean).join(' ')}
                            >
                              {cell.dayNum}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {scheduleError && (
                    <p className="text-xs text-red-600 font-mono">{scheduleError}</p>
                  )}
                  {/* Schedule button */}
                  <button
                    onClick={handleSchedule}
                    disabled={!selectedDate || scheduling}
                    className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {scheduling
                      ? 'SCHEDULING...'
                      : selectedDate
                      ? `SCHEDULE FOR ${formatSelectedDate(selectedDate).toUpperCase()}`
                      : 'SELECT A DATE TO SCHEDULE'}
                  </button>
                </>
              )}
            </div>
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
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function CalendarIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"
      className={`transition-transform ${open ? 'text-rust' : 'text-gray-400'}`}>
      <rect x="3" y="4" width="18" height="18" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

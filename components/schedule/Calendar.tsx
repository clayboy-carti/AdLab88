'use client'

import { useState } from 'react'
import AdModal from '@/components/library/AdModal'
import VideoModal from '@/components/library/VideoModal'
import type { Ad } from '@/components/library/AdCard'
import type { VideoItem } from '@/components/library/VideoCard'

export interface ScheduledPost {
  id: string
  date: string // 'YYYY-MM-DD'
  platform: string
  caption: string
  status: 'scheduled' | 'published' | 'failed' | 'cancelled'
  // Ad details joined from generated_ads
  adId?: string
  videoId?: string
  hook?: string
  cta?: string
  positioning_angle?: string
  target_platform?: string
  framework_applied?: string
  ad_created_at?: string
  storage_path?: string | null
  signedUrl?: string | null
  // Video-specific fields
  motion_prompt?: string | null
  source_ad_id?: string | null
  video_created_at?: string
}

interface CalendarProps {
  posts?: ScheduledPost[]
}

type CalendarView = 'month' | 'week'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface CalendarDay {
  date: Date
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  dateStr: string
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const leadingDays = firstOfMonth.getDay()
  const totalCells = Math.ceil((leadingDays + lastOfMonth.getDate()) / 7) * 7
  const trailingDays = totalCells - leadingDays - lastOfMonth.getDate()

  const cells: CalendarDay[] = []

  for (let i = leadingDays - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    date.setHours(0, 0, 0, 0)
    cells.push({ date, dayNum: date.getDate(), isCurrentMonth: false, isToday: date.getTime() === today.getTime(), dateStr: toDateStr(date) })
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    cells.push({ date, dayNum: d, isCurrentMonth: true, isToday: date.getTime() === today.getTime(), dateStr: toDateStr(date) })
  }
  for (let d = 1; d <= trailingDays; d++) {
    const date = new Date(year, month + 1, d)
    date.setHours(0, 0, 0, 0)
    cells.push({ date, dayNum: d, isCurrentMonth: false, isToday: date.getTime() === today.getTime(), dateStr: toDateStr(date) })
  }

  return cells
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function buildWeekDays(weekStart: Date): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    date.setHours(0, 0, 0, 0)
    return {
      date,
      dayNum: date.getDate(),
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      dateStr: toDateStr(date),
    }
  })
}

function weekRangeTitle(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const startMon = MONTH_NAMES[weekStart.getMonth()].slice(0, 3)
  const endMon = MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)
  const year = weekEnd.getFullYear()

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startMon} ${weekStart.getDate()}–${weekEnd.getDate()}, ${year}`
  }
  return `${startMon} ${weekStart.getDate()} – ${endMon} ${weekEnd.getDate()}, ${year}`
}

const STATUS_DOT: Record<ScheduledPost['status'], string> = {
  scheduled:  'bg-forest',
  published:  'bg-green-600',
  failed:     'bg-red-500',
  cancelled:  'bg-gray-400',
}

function postToAd(post: ScheduledPost): Ad | null {
  if (!post.adId) return null
  return {
    id: post.adId,
    hook: post.hook ?? '',
    caption: post.caption,
    cta: post.cta ?? '',
    positioning_angle: post.positioning_angle ?? '',
    target_platform: post.target_platform,
    framework_applied: post.framework_applied,
    created_at: post.ad_created_at ?? post.date,
    storage_path: post.storage_path ?? null,
    signedUrl: post.signedUrl ?? null,
  }
}

function postToVideo(post: ScheduledPost): VideoItem | null {
  if (!post.videoId) return null
  return {
    id: post.videoId,
    source_ad_id: post.source_ad_id ?? null,
    motion_prompt: post.motion_prompt ?? null,
    storage_path: post.storage_path ?? '',
    created_at: post.video_created_at ?? post.date,
    signedUrl: post.signedUrl ?? null,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Chevron left icon */
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

/** Chevron right icon */
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

/** Small user icon for chips */
function UserIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-forest/50">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/** Empty state illustration */
function EmptyIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="40" cy="57" rx="17" ry="11" fill="#B55233" fillOpacity="0.12" stroke="#B55233" strokeWidth="1.5" strokeLinecap="round" />
      {/* Head */}
      <circle cx="40" cy="30" r="12" fill="#B55233" fillOpacity="0.12" stroke="#B55233" strokeWidth="1.5" />
      {/* Sparkle dots */}
      <circle cx="63" cy="20" r="2.5" fill="#B55233" fillOpacity="0.35" />
      <circle cx="17" cy="24" r="2" fill="#B55233" fillOpacity="0.25" />
      <circle cx="66" cy="40" r="1.5" fill="#B55233" fillOpacity="0.25" />
      <circle cx="15" cy="44" r="1.5" fill="#B55233" fillOpacity="0.2" />
      {/* Sparkle lines */}
      <line x1="59" y1="14" x2="63" y2="18" stroke="#B55233" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="67" y1="14" x2="63" y2="18" stroke="#B55233" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Small chip used in the month grid */
function MonthChip({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${post.platform}: ${post.caption}`}
      className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded-md bg-sage/20 border border-sage/40 hover:bg-sage/30 transition-colors cursor-pointer"
    >
      <span className="truncate text-[10px] font-mono font-medium text-forest leading-none">
        {post.hook || post.platform}
      </span>
      <UserIcon />
    </button>
  )
}

/** Larger post card used in the week grid */
function WeekPostCard({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-forest/20 bg-white hover:border-rust/40 hover:shadow-sm transition-all group overflow-hidden"
    >
      {/* Thumbnail */}
      {post.videoId ? (
        <div className="w-full aspect-square bg-forest/5 border-b border-forest/10 flex items-center justify-center relative overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-forest/30">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="absolute top-1.5 right-1.5 text-[8px] font-mono uppercase bg-forest/10 text-forest/50 px-1 py-0.5 rounded">VIDEO</span>
        </div>
      ) : post.signedUrl ? (
        <div className="w-full aspect-square overflow-hidden bg-paper border-b border-forest/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.signedUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-forest/5 border-b border-forest/10 flex items-center justify-center">
          <span className="text-xs font-mono text-forest/30 uppercase">No Image</span>
        </div>
      )}

      <div className="p-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-sage/20 border border-sage/40 text-forest rounded-sm">
            {post.platform}
          </span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[post.status]}`} />
          <span className="text-[9px] font-mono text-graphite/40 uppercase">{post.status}</span>
        </div>
        {post.hook && (
          <p className="text-[11px] font-mono font-medium text-graphite line-clamp-2 leading-snug">
            {post.hook}
          </p>
        )}
      </div>
    </button>
  )
}

// ─── Main Calendar ────────────────────────────────────────────────────────────

export default function Calendar({ posts = [] }: CalendarProps) {
  const now = new Date()
  const [view, setView] = useState<CalendarView>('month')
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(now))
  const [localPosts, setLocalPosts] = useState<ScheduledPost[]>(posts)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const cells = buildCalendarGrid(year, month)
  const weekDays = buildWeekDays(currentWeekStart)

  const postsByDate: Record<string, ScheduledPost[]> = {}
  for (const post of localPosts) {
    if (!postsByDate[post.date]) postsByDate[post.date] = []
    postsByDate[post.date].push(post)
  }

  // ── Month navigation
  const goToPrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToTodayMonth = () => setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
  const isCurrentMonthToday = year === now.getFullYear() && month === now.getMonth()

  // ── Week navigation
  const goToPrevWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() - 7)
    setCurrentWeekStart(d)
  }
  const goToNextWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 7)
    setCurrentWeekStart(d)
  }
  const goToTodayWeek = () => setCurrentWeekStart(getWeekStart(now))
  const todayWeekStart = getWeekStart(now)
  const isCurrentWeekToday = currentWeekStart.getTime() === todayWeekStart.getTime()

  // ── View switch handlers
  const switchToMonth = () => {
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setView('month')
  }
  const switchToWeek = () => {
    setCurrentWeekStart(getWeekStart(now))
    setView('week')
  }

  // ── Upcoming posts
  const todayStr = toDateStr(now)
  const upcomingPosts = localPosts
    .filter((p) => p.status === 'scheduled' && p.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setLocalPosts((prev) => prev.map((p) => (p.adId === adId ? { ...p, caption: newCaption } : p)))
    setSelectedPost((prev) => prev?.adId === adId ? { ...prev, caption: newCaption } : prev)
  }

  const [unschedulingId, setUnschedulingId] = useState<string | null>(null)

  const handleUnschedule = async (postId: string) => {
    setUnschedulingId(postId)
    try {
      const res = await fetch(`/api/social/schedule?postId=${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        console.error('[Unschedule] Error:', data.error)
        return
      }
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      console.error('[Unschedule] Failed:', err)
    } finally {
      setUnschedulingId(null)
    }
  }

  const selectedAd = selectedPost ? postToAd(selectedPost) : null
  const selectedVideo = selectedPost ? postToVideo(selectedPost) : null

  const handleVideoDelete = (videoId: string) => {
    setLocalPosts((prev) => prev.filter((p) => p.videoId !== videoId))
    setSelectedPost(null)
  }

  const goToPrev = view === 'month' ? goToPrevMonth : goToPrevWeek
  const goToNext = view === 'month' ? goToNextMonth : goToNextWeek
  const isToday = view === 'month' ? isCurrentMonthToday : isCurrentWeekToday
  void isToday // used by goToToday logic
  void goToTodayMonth
  void goToTodayWeek

  const titleText = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : weekRangeTitle(currentWeekStart)

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-4xl font-bold text-graphite tracking-tight">Field Log</h1>

        {/* View toggle pill */}
        <div className="flex items-center gap-0.5 bg-white border border-forest/20 rounded-full p-1 shadow-sm">
          <button
            onClick={switchToMonth}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              view === 'month'
                ? 'bg-rust text-white shadow-sm'
                : 'text-graphite/60 hover:text-graphite hover:bg-forest/5',
            ].join(' ')}
          >
            Month
          </button>
          <button
            onClick={switchToWeek}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              view === 'week'
                ? 'bg-rust text-white shadow-sm'
                : 'text-graphite/60 hover:text-graphite hover:bg-forest/5',
            ].join(' ')}
          >
            Week
          </button>
        </div>
      </div>

      {/* Rust separator line */}
      <div className="h-px bg-rust mb-6" />

      {/* ── Month view ── */}
      {view === 'month' && (
        <div className="flex flex-col gap-5">

          {/* ── Calendar card ── */}
          <div className="bg-white rounded-2xl border border-forest/20 shadow-sm p-5">

            {/* Month navigation */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <button
                onClick={goToPrev}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-forest/8 text-graphite/50 hover:text-graphite transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <h2 className="text-lg font-medium text-graphite min-w-[190px] text-center">
                {titleText}
              </h2>
              <button
                onClick={goToNext}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-forest/8 text-graphite/50 hover:text-graphite transition-colors"
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1.5">
              {DAY_LABELS.map((day) => (
                <div key={day} className="text-center text-[11px] font-mono uppercase tracking-widest text-graphite/40 py-1.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                const cellPosts = postsByDate[cell.dateStr] ?? []
                return (
                  <div
                    key={cell.dateStr + '-' + i}
                    className={[
                      'rounded-lg min-h-[82px] p-1.5 flex flex-col gap-1 transition-colors',
                      cell.isToday
                        ? 'bg-white ring-2 ring-rust ring-inset'
                        : cell.isCurrentMonth
                        ? 'bg-forest/[0.03] hover:bg-forest/[0.06]'
                        : 'bg-forest/[0.015] opacity-60',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className={[
                      'text-sm font-mono leading-none',
                      cell.isToday
                        ? 'text-rust font-semibold'
                        : cell.isCurrentMonth
                        ? 'text-graphite/80'
                        : 'text-graphite/35',
                    ].join(' ')}>
                      {cell.dayNum}
                    </span>

                    {cellPosts.map((post) => (
                      <MonthChip
                        key={post.id}
                        post={post}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Upcoming posts (below calendar) ── */}
          <div className="bg-white rounded-2xl border border-forest/20 shadow-sm p-5">
            <h3 className="text-base font-bold text-graphite mb-4">Upcoming Posts</h3>

            {upcomingPosts.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <EmptyIllustration />
                <p className="text-sm font-medium text-graphite/55">No Scheduled Posts</p>
                <a
                  href="/create"
                  className="bg-rust text-white font-semibold px-4 py-2.5 rounded-xl text-sm inline-block text-center w-full max-w-[180px] hover:bg-[#9a4429] transition-colors"
                >
                  Generate an Ad →
                </a>
              </div>
            ) : (
              <>
                <div className="flex flex-row flex-wrap gap-3">
                  {upcomingPosts.slice(0, 5).map((post) => {
                    const day = parseInt(post.date.slice(8, 10))
                    const monthAbbr = MONTH_NAMES[parseInt(post.date.slice(5, 7)) - 1].slice(0, 3)
                    const isUnscheduling = unschedulingId === post.id
                    return (
                      <div key={post.id} className="rounded-xl border border-rust/40 overflow-hidden bg-white w-[200px] flex-shrink-0 flex flex-col shadow-sm">
                        <div className="h-1 bg-rust/70 w-full" />
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="flex flex-col gap-2 w-full text-left p-3 hover:bg-rust/5 transition-colors flex-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-bold text-graphite leading-none">{day}</span>
                              <span className="text-[9px] font-mono uppercase text-graphite/45">{monthAbbr}</span>
                            </div>
                            <span className="text-[9px] font-mono uppercase text-rust/70 tracking-wide">{post.platform}</span>
                          </div>
                          {post.hook && (
                            <p className="text-xs font-medium text-graphite leading-snug line-clamp-4">{post.hook}</p>
                          )}
                        </button>
                        <div className="flex border-t border-rust/20">
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="flex-1 py-1.5 text-[10px] font-mono uppercase text-graphite/45 hover:bg-rust/5 hover:text-rust transition-colors text-center"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleUnschedule(post.id)}
                            disabled={isUnscheduling}
                            className="flex-1 py-1.5 text-[10px] font-mono uppercase text-graphite/45 hover:bg-red-50 hover:text-red-500 border-l border-rust/20 disabled:opacity-40 transition-colors text-center"
                          >
                            {isUnscheduling ? '...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {upcomingPosts.length > 5 && (
                  <p className="text-[10px] font-mono text-graphite/40 uppercase mt-3">
                    +{upcomingPosts.length - 5} more
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Week view ── */}
      {view === 'week' && (
        <div className="flex flex-col gap-4">

          {/* Week navigation */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goToPrev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-forest/8 text-graphite/50 hover:text-graphite transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft />
            </button>
            <h2 className="text-lg font-medium text-graphite min-w-[240px] text-center">
              {titleText}
            </h2>
            <button
              onClick={goToNext}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-forest/8 text-graphite/50 hover:text-graphite transition-colors"
              aria-label="Next week"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-forest/20 shadow-sm overflow-hidden">
            {/* Day column headers */}
            <div className="grid grid-cols-7 border-b border-forest/15">
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={[
                    'py-3 px-2 text-center border-r border-forest/10 last:border-r-0',
                    day.isToday ? 'bg-rust/5' : 'bg-forest/[0.02]',
                  ].join(' ')}
                >
                  <p className={[
                    'text-[11px] uppercase font-mono tracking-widest',
                    day.isToday ? 'text-rust' : 'text-graphite/40',
                  ].join(' ')}>
                    {DAY_LABELS[day.date.getDay()]}
                  </p>
                  <p className={[
                    'text-2xl font-bold leading-tight mt-0.5',
                    day.isToday ? 'text-rust' : 'text-graphite',
                  ].join(' ')}>
                    {day.dayNum}
                  </p>
                  <p className="text-[10px] font-mono text-graphite/30 uppercase tracking-wide">
                    {MONTH_NAMES[day.date.getMonth()].slice(0, 3)}
                  </p>
                </div>
              ))}
            </div>

            {/* Post cards grid */}
            <div className="grid grid-cols-7">
              {weekDays.map((day) => {
                const dayPosts = postsByDate[day.dateStr] ?? []
                return (
                  <div
                    key={day.dateStr}
                    className={[
                      'border-r border-forest/10 last:border-r-0 p-2 min-h-[220px] flex flex-col gap-2',
                      day.isToday ? 'bg-rust/[0.025]' : 'bg-white',
                    ].join(' ')}
                  >
                    {dayPosts.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-graphite/20 uppercase">—</span>
                      </div>
                    ) : (
                      dayPosts.map((post) => (
                        <WeekPostCard
                          key={post.id}
                          post={post}
                          onClick={() => setSelectedPost(post)}
                        />
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ad modal */}
      {selectedPost && selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedPost(null)}
          onCaptionUpdate={handleCaptionUpdate}
          scheduledDate={selectedPost.date}
        />
      )}

      {/* Video modal */}
      {selectedPost && selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedPost(null)}
          onDelete={handleVideoDelete}
          initialCaption={selectedPost.caption ?? ''}
        />
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import AdModal from '@/components/library/AdModal'
import type { Ad } from '@/components/library/AdCard'

export interface ScheduledPost {
  id: string
  date: string // 'YYYY-MM-DD'
  platform: string
  caption: string
  status: 'scheduled' | 'published' | 'failed' | 'cancelled'
  // Ad details joined from generated_ads
  adId?: string
  hook?: string
  cta?: string
  positioning_angle?: string
  target_platform?: string
  framework_applied?: string
  ad_created_at?: string
  storage_path?: string | null
  signedUrl?: string | null
}

interface CalendarProps {
  posts?: ScheduledPost[]
}

type CalendarView = 'month' | 'week'

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
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

/** Returns the Sunday that starts the week containing `date`. */
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
      isCurrentMonth: true, // not used in week view
      isToday: date.getTime() === today.getTime(),
      dateStr: toDateStr(date),
    }
  })
}

/** Format a week range title, e.g. "FEB 16–22, 2026" or "JAN 30 – FEB 5, 2026" */
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

const PLATFORM_CHIP_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  instagram: { bg: 'bg-rust/10 border-rust/30',        text: 'text-rust',      dot: 'bg-rust' },
  tiktok:    { bg: 'bg-graphite/10 border-graphite/30', text: 'text-graphite',  dot: 'bg-graphite' },
  facebook:  { bg: 'bg-forest/10 border-forest/30',    text: 'text-forest',    dot: 'bg-forest' },
  linkedin:  { bg: 'bg-forest/10 border-forest/30',    text: 'text-forest',    dot: 'bg-forest' },
  twitter:   { bg: 'bg-graphite/10 border-graphite/30', text: 'text-graphite',  dot: 'bg-graphite' },
  x:         { bg: 'bg-graphite/10 border-graphite/30', text: 'text-graphite',  dot: 'bg-graphite' },
}

function platformChipStyle(platform: string) {
  return PLATFORM_CHIP_COLORS[platform.toLowerCase()] ?? { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-700', dot: 'bg-gray-500' }
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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small chip used in the month grid */
function MonthChip({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  const chip = platformChipStyle(post.platform)
  return (
    <button
      onClick={onClick}
      title={`${post.platform}: ${post.caption}`}
      className={`flex items-center gap-1 w-full text-left px-1.5 py-0.5 rounded-sm border ${chip.bg} hover:opacity-80 transition-opacity cursor-pointer`}
    >
      <span className={`inline-block w-1.5 h-1.5 flex-shrink-0 rounded-full ${chip.dot}`} />
      <span className={`truncate text-[10px] font-mono font-medium uppercase tracking-wide ${chip.text}`}>
        {post.hook || post.platform}
      </span>
    </button>
  )
}

/** Larger post card used in the week grid */
function WeekPostCard({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  const chip = platformChipStyle(post.platform)
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-outline bg-white hover:border-rust transition-colors group overflow-hidden"
    >
      {/* Image */}
      {post.signedUrl ? (
        <div className="w-full aspect-square overflow-hidden bg-gray-100 border-b border-outline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.signedUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-forest/5 border-b border-outline flex items-center justify-center">
          <span className="text-xs font-mono text-forest/30 uppercase">No Image</span>
        </div>
      )}

      {/* Card body */}
      <div className="p-2 flex flex-col gap-1.5">
        {/* Platform badge + status dot */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 border ${chip.bg} ${chip.text}`}>
            {post.platform}
          </span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[post.status]}`} />
          <span className="text-[9px] font-mono text-gray-400 uppercase">{post.status}</span>
        </div>

        {/* Hook */}
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

  // Month view state
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const cells = buildCalendarGrid(year, month)

  // Week view state
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

  // ── View switch handlers (sync the "other" view's position to today)
  const switchToMonth = () => {
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setView('month')
  }
  const switchToWeek = () => {
    setCurrentWeekStart(getWeekStart(now))
    setView('week')
  }

  // ── Upcoming posts (month view only)
  const todayStr = toDateStr(now)
  const upcomingPosts = localPosts
    .filter((p) => p.status === 'scheduled' && p.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  const handleCaptionUpdate = (adId: string, newCaption: string) => {
    setLocalPosts((prev) =>
      prev.map((p) => (p.adId === adId ? { ...p, caption: newCaption } : p))
    )
    setSelectedPost((prev) =>
      prev?.adId === adId ? { ...prev, caption: newCaption } : prev
    )
  }

  const selectedAd = selectedPost ? postToAd(selectedPost) : null

  // ── Shared nav bar
  const isToday = view === 'month' ? isCurrentMonthToday : isCurrentWeekToday
  const goToPrev = view === 'month' ? goToPrevMonth : goToPrevWeek
  const goToNext = view === 'month' ? goToNextMonth : goToNextWeek
  const goToToday = view === 'month' ? goToTodayMonth : goToTodayWeek
  const titleText = view === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : weekRangeTitle(currentWeekStart)

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Navigation bar ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Prev / Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrev}
              className="border border-outline px-4 py-2 font-mono text-sm hover:bg-gray-100 transition-colors"
              aria-label="Previous"
            >←</button>
            <button
              onClick={goToNext}
              className="border border-outline px-4 py-2 font-mono text-sm hover:bg-gray-100 transition-colors"
              aria-label="Next"
            >→</button>
          </div>

          {/* Title */}
          <h2 className="text-xl uppercase font-mono tracking-wider flex-1 text-center min-w-0">
            {titleText}
          </h2>

          {/* Right controls: Today + view toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              disabled={isToday}
              className="border border-outline px-4 py-2 font-mono text-xs uppercase hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              TODAY
            </button>

            {/* View toggle */}
            <div className="flex border border-outline overflow-hidden">
              <button
                onClick={switchToMonth}
                className={[
                  'px-4 py-2 font-mono text-xs uppercase transition-colors',
                  view === 'month' ? 'bg-forest text-paper' : 'hover:bg-gray-100',
                ].join(' ')}
              >
                MONTH
              </button>
              <button
                onClick={switchToWeek}
                className={[
                  'px-4 py-2 font-mono text-xs uppercase transition-colors border-l border-outline',
                  view === 'week' ? 'bg-forest text-paper' : 'hover:bg-gray-100',
                ].join(' ')}
              >
                WEEK
              </button>
            </div>
          </div>
        </div>

        {/* ── Month view ── */}
        {view === 'month' && (
          <>
            <div className="border border-outline">
              {/* Day-of-week header */}
              <div className="grid grid-cols-7">
                {DAY_LABELS.map((day) => (
                  <div key={day} className="text-xs uppercase font-mono text-gray-500 text-center py-2 bg-gray-50 border-b border-r border-outline last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  const cellPosts = postsByDate[cell.dateStr] ?? []
                  const isLastRow = i >= cells.length - 7

                  return (
                    <div
                      key={cell.dateStr + '-' + i}
                      className={[
                        'p-2 min-h-[88px] flex flex-col gap-1',
                        'border-b border-r border-outline',
                        (i + 1) % 7 === 0 ? 'border-r-0' : '',
                        isLastRow ? 'border-b-0' : '',
                        cell.isToday
                          ? 'bg-white outline outline-2 outline-rust outline-offset-[-2px]'
                          : cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                      ].filter(Boolean).join(' ')}
                    >
                      <span className={[
                        'text-sm font-mono leading-none',
                        cell.isToday ? 'text-rust font-bold' : cell.isCurrentMonth ? 'text-graphite' : 'text-gray-400',
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

            {/* Upcoming posts panel */}
            <div className="card">
              <h2 className="text-lg uppercase font-mono border-b border-outline pb-3 mb-4">Upcoming Posts</h2>

              {upcomingPosts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-mono text-gray-500 uppercase mb-4">No scheduled posts</p>
                  <a href="/create" className="btn-secondary text-sm px-4 py-2 inline-block">Generate an Ad →</a>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingPosts.map((post) => {
                    const chip = platformChipStyle(post.platform)
                    return (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="flex items-stretch gap-0 border border-outline w-full text-left hover:border-rust transition-colors group overflow-hidden"
                      >
                        {/* Thumbnail */}
                        {post.signedUrl ? (
                          <div className="w-[72px] flex-shrink-0 bg-gray-100 relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.signedUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-[72px] flex-shrink-0 bg-forest/5 flex items-center justify-center border-r border-outline">
                            <span className="text-xs font-mono text-forest/30 uppercase">AD</span>
                          </div>
                        )}

                        {/* Date badge */}
                        <div className="flex flex-col items-center justify-center bg-forest text-paper px-3 py-3 min-w-[60px] flex-shrink-0 border-r border-forest">
                          <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">
                            {MONTH_NAMES[parseInt(post.date.slice(5, 7)) - 1].slice(0, 3)}
                          </span>
                          <span className="text-2xl font-mono font-bold text-rust leading-none">
                            {parseInt(post.date.slice(8, 10))}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${chip.bg} ${chip.text}`}>
                              {post.platform}
                            </span>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[post.status]}`} />
                            <span className="text-[10px] font-mono text-gray-400 uppercase">{post.status}</span>
                          </div>
                          {post.hook && (
                            <p className="text-sm font-mono text-graphite font-medium truncate">{post.hook}</p>
                          )}
                          {post.caption && (
                            <p className="text-xs text-gray-500 truncate">{post.caption}</p>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center px-4 flex-shrink-0">
                          <span className="text-gray-300 group-hover:text-rust transition-colors font-mono text-sm">→</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Week view ── */}
        {view === 'week' && (
          <div className="border border-outline">
            {/* Day column headers */}
            <div className="grid grid-cols-7 border-b border-outline">
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={[
                    'py-3 px-2 text-center border-r border-outline last:border-r-0',
                    day.isToday ? 'bg-white' : 'bg-gray-50',
                  ].join(' ')}
                >
                  <p className={[
                    'text-xs uppercase font-mono tracking-wider',
                    day.isToday ? 'text-rust' : 'text-gray-500',
                  ].join(' ')}>
                    {DAY_LABELS[day.date.getDay()]}
                  </p>
                  <p className={[
                    'text-2xl font-mono font-bold leading-tight mt-0.5',
                    day.isToday ? 'text-rust' : 'text-graphite',
                  ].join(' ')}>
                    {day.dayNum}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wide">
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
                      'border-r border-outline last:border-r-0 p-2 min-h-[220px] flex flex-col gap-2',
                      day.isToday ? 'bg-white outline outline-2 outline-rust outline-offset-[-2px]' : 'bg-white',
                    ].join(' ')}
                  >
                    {dayPosts.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">—</span>
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
        )}
      </div>

      {/* Ad modal */}
      {selectedPost && selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedPost(null)}
          onCaptionUpdate={handleCaptionUpdate}
          scheduledDate={selectedPost.date}
        />
      )}
    </>
  )
}

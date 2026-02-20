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

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-rust text-white',
  tiktok:    'bg-graphite text-white',
  facebook:  'bg-forest text-paper',
  linkedin:  'bg-forest text-paper',
  twitter:   'bg-graphite text-white',
  x:         'bg-graphite text-white',
}

function platformColor(platform: string): string {
  return PLATFORM_COLORS[platform.toLowerCase()] ?? 'bg-gray-500 text-white'
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

export default function Calendar({ posts = [] }: CalendarProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [localPosts, setLocalPosts] = useState<ScheduledPost[]>(posts)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const cells = buildCalendarGrid(year, month)

  const postsByDate: Record<string, ScheduledPost[]> = {}
  for (const post of localPosts) {
    if (!postsByDate[post.date]) postsByDate[post.date] = []
    postsByDate[post.date].push(post)
  }

  const goToPrev = () => setCurrentMonth(new Date(year, month - 1, 1))
  const goToNext = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))

  const isCurrentMonthToday = year === now.getFullYear() && month === now.getMonth()

  const today = toDateStr(now)
  const upcomingPosts = localPosts
    .filter((p) => p.status === 'scheduled' && p.date >= today)
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

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goToPrev} className="border border-outline px-4 py-2 font-mono text-sm hover:bg-gray-100 transition-colors" aria-label="Previous month">←</button>
            <button onClick={goToNext} className="border border-outline px-4 py-2 font-mono text-sm hover:bg-gray-100 transition-colors" aria-label="Next month">→</button>
          </div>
          <h2 className="text-xl uppercase font-mono tracking-wider">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={goToToday} disabled={isCurrentMonthToday} className="border border-outline px-4 py-2 font-mono text-xs uppercase hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-default">
            Today
          </button>
        </div>

        {/* Calendar grid */}
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
                  {/* Date number */}
                  <span className={[
                    'text-sm font-mono leading-none',
                    cell.isToday ? 'text-rust font-bold' : cell.isCurrentMonth ? 'text-graphite' : 'text-gray-400',
                  ].join(' ')}>
                    {cell.dayNum}
                  </span>

                  {/* Post chips — clickable */}
                  {cellPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      title={`${post.platform}: ${post.caption}`}
                      className={`text-xs font-mono px-1.5 py-0.5 truncate flex items-center gap-1 w-full text-left hover:opacity-80 transition-opacity cursor-pointer ${platformColor(post.platform)}`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 flex-shrink-0 ${STATUS_DOT[post.status]}`} />
                      <span className="truncate uppercase text-[10px]">{post.platform}</span>
                    </button>
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
              {upcomingPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="flex items-start gap-4 border border-outline p-3 w-full text-left hover:border-rust transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center border border-outline bg-gray-50 px-3 py-2 min-w-[56px] flex-shrink-0">
                    <span className="text-xs font-mono text-gray-500 uppercase">
                      {MONTH_NAMES[parseInt(post.date.slice(5, 7)) - 1].slice(0, 3)}
                    </span>
                    <span className="text-xl font-mono font-bold text-graphite leading-tight">
                      {parseInt(post.date.slice(8, 10))}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono uppercase px-2 py-0.5 ${platformColor(post.platform)}`}>{post.platform}</span>
                      <span className={`inline-block w-2 h-2 ${STATUS_DOT[post.status]}`} />
                      <span className="text-xs font-mono text-gray-500 uppercase">{post.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{post.caption}</p>
                    {post.hook && (
                      <p className="text-xs font-mono text-gray-400 truncate group-hover:text-rust transition-colors">{post.hook}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono text-gray-300 group-hover:text-rust transition-colors self-center flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ad modal — opened when a chip or upcoming row is clicked */}
      {selectedPost && selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedPost(null)}
          onCaptionUpdate={handleCaptionUpdate}
        />
      )}
    </>
  )
}

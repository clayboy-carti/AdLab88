'use client'

import { useState } from 'react'
import { BarChart2, Eye, Heart, MessageSquare, Share2, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, type LucideIcon } from 'lucide-react'

export interface PostAnalytic {
  id: string
  scheduled_post_id: string
  late_post_id: string | null
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
  clicks: number
  saves: number
  fetched_at: string | null
  created_at: string
  // Joined from scheduled_posts
  caption?: string | null
  scheduled_for?: string | null
  status?: string | null
  // Joined from generated_ads via scheduled_posts
  ad_title?: string | null
  ad_hook?: string | null
  signedUrl?: string | null
}

interface AnalyticsDashboardProps {
  analytics: PostAnalytic[]
}

const PLATFORMS = ['All', 'instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'twitter', 'pinterest']

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  twitter: 'X / Twitter',
  pinterest: 'Pinterest',
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function engagementRate(post: PostAnalytic): string {
  if (!post.reach || post.reach === 0) return '—'
  const eng = post.likes + post.comments + post.shares + post.saves
  return ((eng / post.reach) * 100).toFixed(1) + '%'
}

interface StatCardProps {
  label: string
  value: number
  Icon: LucideIcon
  sublabel?: string
}

function StatCard({ label, value, Icon, sublabel }: StatCardProps) {
  return (
    <div className="bg-white border border-forest/20 p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-graphite/50">{label}</span>
        <Icon size={16} strokeWidth={1.6} className="text-graphite/30 flex-shrink-0" />
      </div>
      <p className="text-3xl font-mono font-semibold text-graphite tracking-tight">{formatNum(value)}</p>
      {sublabel && <p className="text-[11px] font-mono text-graphite/40 mt-1 uppercase tracking-wide">{sublabel}</p>}
    </div>
  )
}

export default function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const [platform, setPlatform] = useState('All')
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'comments' | 'shares' | 'reach' | 'scheduled_for'>('scheduled_for')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = analytics.filter((a) => platform === 'All' || a.platform === platform)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'scheduled_for') {
      const aVal = a.scheduled_for ?? a.created_at
      const bVal = b.scheduled_for ?? b.created_at
      return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }
    const aVal = a[sortBy] ?? 0
    const bVal = b[sortBy] ?? 0
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  // Aggregate totals
  const totals = filtered.reduce(
    (acc, a) => ({
      views: acc.views + (a.views ?? 0),
      likes: acc.likes + (a.likes ?? 0),
      comments: acc.comments + (a.comments ?? 0),
      shares: acc.shares + (a.shares ?? 0),
      reach: acc.reach + (a.reach ?? 0),
      impressions: acc.impressions + (a.impressions ?? 0),
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 }
  )

  const avgEngagement = filtered.length === 0
    ? '—'
    : (() => {
        const total = filtered.reduce((acc, a) => {
          if (!a.reach) return acc
          return acc + ((a.likes + a.comments + a.shares + a.saves) / a.reach) * 100
        }, 0)
        const validCount = filtered.filter((a) => a.reach > 0).length
        return validCount === 0 ? '—' : (total / validCount).toFixed(1) + '%'
      })()

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <Minus size={10} className="text-graphite/20" />
    return sortDir === 'desc'
      ? <ArrowDownRight size={10} className="text-rust" />
      : <ArrowUpRight size={10} className="text-rust" />
  }

  const activePlatforms = ['All', ...Array.from(new Set(analytics.map((a) => a.platform))).filter(Boolean)]

  return (
    <div className="w-full">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-mono uppercase tracking-tight header-accent inline-block">Analytics</h1>
          <p className="text-sm font-sans text-graphite/50 mt-2">Post performance metrics from Late API</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-graphite/30 flex items-center gap-1">
            <RefreshCw size={10} />
            Data via Late API
          </span>
        </div>
      </div>

      {/* ── Platform filter ── */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {activePlatforms.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={[
              'text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border transition-colors',
              platform === p
                ? 'bg-rust text-white border-rust'
                : 'bg-white text-graphite/60 border-forest/20 hover:border-forest/40 hover:text-graphite',
            ].join(' ')}
          >
            {p === 'All' ? 'All Platforms' : (PLATFORM_LABELS[p] ?? p)}
          </button>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Views" value={totals.views} Icon={Eye} sublabel={`${filtered.length} post${filtered.length !== 1 ? 's' : ''}`} />
        <StatCard label="Total Likes" value={totals.likes} Icon={Heart} />
        <StatCard label="Total Comments" value={totals.comments} Icon={MessageSquare} />
        <StatCard label="Total Shares" value={totals.shares} Icon={Share2} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Reach" value={totals.reach} Icon={TrendingUp} />
        <StatCard label="Total Impressions" value={totals.impressions} Icon={BarChart2} />
        <div className="bg-white border border-forest/20 p-6 lg:col-span-1">
          <div className="flex items-start justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-graphite/50">Avg. Engagement Rate</span>
            <TrendingUp size={16} strokeWidth={1.6} className="text-graphite/30 flex-shrink-0" />
          </div>
          <p className="text-3xl font-mono font-semibold text-graphite tracking-tight">{avgEngagement}</p>
          <p className="text-[11px] font-mono text-graphite/40 mt-1 uppercase tracking-wide">(likes + comments + shares + saves) / reach</p>
        </div>
      </div>

      {/* ── Posts table ── */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-forest/20 p-16 text-center">
          <BarChart2 size={32} strokeWidth={1.2} className="text-graphite/20 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest text-graphite/40 mb-2">No analytics data yet</p>
          <p className="text-xs font-sans text-graphite/30 max-w-sm mx-auto">
            Once posts are published and Late API metrics are synced, performance data will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-forest/20 overflow-x-auto">
          {/* Table header */}
          <div className="px-4 py-3 border-b border-forest/10 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-graphite/40">
              {sorted.length} Post{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-forest/10 bg-paper/50">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium min-w-[160px]">Post</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium">Platform</th>
                <th
                  className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium cursor-pointer hover:text-rust transition-colors select-none"
                  onClick={() => toggleSort('views')}
                >
                  <span className="inline-flex items-center gap-1">Views <SortIcon col="views" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium cursor-pointer hover:text-rust transition-colors select-none"
                  onClick={() => toggleSort('likes')}
                >
                  <span className="inline-flex items-center gap-1">Likes <SortIcon col="likes" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium cursor-pointer hover:text-rust transition-colors select-none"
                  onClick={() => toggleSort('comments')}
                >
                  <span className="inline-flex items-center gap-1">Comments <SortIcon col="comments" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium cursor-pointer hover:text-rust transition-colors select-none"
                  onClick={() => toggleSort('shares')}
                >
                  <span className="inline-flex items-center gap-1">Shares <SortIcon col="shares" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium cursor-pointer hover:text-rust transition-colors select-none"
                  onClick={() => toggleSort('reach')}
                >
                  <span className="inline-flex items-center gap-1">Reach <SortIcon col="reach" /></span>
                </th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium">Eng. Rate</th>
                <th
                  className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-graphite/40 font-medium cursor-pointer hover:text-rust transition-colors select-none"
                  onClick={() => toggleSort('scheduled_for')}
                >
                  <span className="inline-flex items-center gap-1">Date <SortIcon col="scheduled_for" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((post, i) => (
                <tr
                  key={post.id}
                  className={[
                    'border-b border-forest/10 hover:bg-paper/40 transition-colors',
                    i % 2 === 0 ? '' : 'bg-paper/20',
                  ].join(' ')}
                >
                  {/* Post column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {post.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.signedUrl}
                          alt="Ad thumbnail"
                          className="w-10 h-10 object-cover border border-forest/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-paper border border-forest/10 flex items-center justify-center flex-shrink-0">
                          <Eye size={12} className="text-graphite/20" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-graphite truncate max-w-[180px]">
                          {post.ad_title ?? post.ad_hook ?? 'Untitled'}
                        </p>
                        {post.caption && (
                          <p className="text-[10px] text-graphite/40 truncate max-w-[180px] mt-0.5">{post.caption}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Platform */}
                  <td className="px-4 py-3">
                    <span className="text-[10px] uppercase tracking-widest text-graphite/60 bg-paper border border-forest/15 px-2 py-1 whitespace-nowrap">
                      {PLATFORM_LABELS[post.platform] ?? post.platform}
                    </span>
                  </td>

                  {/* Metrics */}
                  <td className="px-4 py-3 text-right text-graphite/80">{formatNum(post.views ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-graphite/80">{formatNum(post.likes ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-graphite/80">{formatNum(post.comments ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-graphite/80">{formatNum(post.shares ?? 0)}</td>
                  <td className="px-4 py-3 text-right text-graphite/80">{formatNum(post.reach ?? 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={[
                      'text-xs',
                      engagementRate(post) === '—' ? 'text-graphite/30' : 'text-rust font-medium',
                    ].join(' ')}>
                      {engagementRate(post)}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-right text-graphite/40 whitespace-nowrap">
                    {post.scheduled_for ? formatDate(post.scheduled_for) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Last synced note ── */}
      {analytics.length > 0 && (
        <p className="text-[10px] font-mono text-graphite/25 uppercase tracking-widest mt-4 text-right">
          {analytics[0].fetched_at
            ? `Last synced ${formatDate(analytics[0].fetched_at)}`
            : 'Not yet synced with Late API'}
        </p>
      )}
    </div>
  )
}

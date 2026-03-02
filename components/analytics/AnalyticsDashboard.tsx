'use client'

import { useState } from 'react'
import { BarChart2, Eye, Heart, MessageSquare, Share2, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Sparkles, Zap, ExternalLink, type LucideIcon } from 'lucide-react'
import type { AnalyticsInsights, ContentSuggestion } from '@/app/api/analytics/insights/route'

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

const SAMPLE_ANALYTICS: PostAnalytic[] = [
  {
    id: 'sample-1',
    scheduled_post_id: 'sp-1',
    late_post_id: 'lp-1',
    platform: 'instagram',
    views: 48200,
    likes: 3140,
    comments: 287,
    shares: 412,
    reach: 41800,
    impressions: 61500,
    clicks: 1920,
    saves: 830,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-20T09:00:00Z',
    caption: 'Introducing our new summer collection — crafted for you. ☀️',
    scheduled_for: '2026-02-20T12:00:00Z',
    status: 'published',
    ad_title: 'Summer Collection Drop',
    ad_hook: 'Your next favorite look is here',
    signedUrl: null,
  },
  {
    id: 'sample-2',
    scheduled_post_id: 'sp-2',
    late_post_id: 'lp-2',
    platform: 'tiktok',
    views: 192400,
    likes: 14700,
    comments: 1830,
    shares: 5210,
    reach: 175000,
    impressions: 210000,
    clicks: 7340,
    saves: 3600,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-22T09:00:00Z',
    caption: 'POV: you finally found the product you didn\'t know you needed 👀',
    scheduled_for: '2026-02-22T18:00:00Z',
    status: 'published',
    ad_title: 'The Product You Didn\'t Know You Needed',
    ad_hook: 'Wait until you see this…',
    signedUrl: null,
  },
  {
    id: 'sample-3',
    scheduled_post_id: 'sp-3',
    late_post_id: 'lp-3',
    platform: 'instagram',
    views: 22100,
    likes: 1480,
    comments: 94,
    shares: 178,
    reach: 19400,
    impressions: 27300,
    clicks: 840,
    saves: 310,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-18T09:00:00Z',
    caption: 'Behind the scenes: how we make every ad count.',
    scheduled_for: '2026-02-18T14:00:00Z',
    status: 'published',
    ad_title: 'Behind the Brand',
    ad_hook: 'Ever wondered what goes into one ad?',
    signedUrl: null,
  },
  {
    id: 'sample-4',
    scheduled_post_id: 'sp-4',
    late_post_id: 'lp-4',
    platform: 'facebook',
    views: 9800,
    likes: 620,
    comments: 143,
    shares: 89,
    reach: 8700,
    impressions: 12100,
    clicks: 470,
    saves: 55,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-15T09:00:00Z',
    caption: 'Limited time offer — don\'t miss out.',
    scheduled_for: '2026-02-15T10:00:00Z',
    status: 'published',
    ad_title: 'Flash Sale — 48 Hours Only',
    ad_hook: 'Our biggest discount yet',
    signedUrl: null,
  },
  {
    id: 'sample-5',
    scheduled_post_id: 'sp-5',
    late_post_id: 'lp-5',
    platform: 'tiktok',
    views: 84600,
    likes: 7200,
    comments: 920,
    shares: 2100,
    reach: 79000,
    impressions: 98000,
    clicks: 3150,
    saves: 1800,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-25T09:00:00Z',
    caption: 'This trend is not going anywhere — get ahead of it.',
    scheduled_for: '2026-02-25T20:00:00Z',
    status: 'published',
    ad_title: 'Trend Ahead',
    ad_hook: 'Everyone\'s doing it. Are you?',
    signedUrl: null,
  },
  {
    id: 'sample-6',
    scheduled_post_id: 'sp-6',
    late_post_id: 'lp-6',
    platform: 'linkedin',
    views: 5400,
    likes: 310,
    comments: 62,
    shares: 44,
    reach: 4900,
    impressions: 7200,
    clicks: 290,
    saves: 38,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-12T09:00:00Z',
    caption: 'Why great creative is the most underrated growth lever.',
    scheduled_for: '2026-02-12T09:00:00Z',
    status: 'published',
    ad_title: 'Creative Is Your Growth Lever',
    ad_hook: 'Most brands get this wrong',
    signedUrl: null,
  },
  {
    id: 'sample-7',
    scheduled_post_id: 'sp-7',
    late_post_id: 'lp-7',
    platform: 'instagram',
    views: 31700,
    likes: 2050,
    comments: 176,
    shares: 295,
    reach: 28400,
    impressions: 38900,
    clicks: 1120,
    saves: 510,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-27T09:00:00Z',
    caption: 'New drop. Same obsession.',
    scheduled_for: '2026-02-27T16:00:00Z',
    status: 'published',
    ad_title: 'New Drop Alert',
    ad_hook: 'You asked. We delivered.',
    signedUrl: null,
  },
  {
    id: 'sample-8',
    scheduled_post_id: 'sp-8',
    late_post_id: null,
    platform: 'youtube',
    views: 14300,
    likes: 890,
    comments: 204,
    shares: 67,
    reach: 12800,
    impressions: 18400,
    clicks: 630,
    saves: 0,
    fetched_at: '2026-02-28T10:00:00Z',
    created_at: '2026-02-10T09:00:00Z',
    caption: 'Full brand story — how we got here and where we\'re going.',
    scheduled_for: '2026-02-10T15:00:00Z',
    status: 'published',
    ad_title: 'The Brand Story',
    ad_hook: '3 years. One mission.',
    signedUrl: null,
  },
]

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

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-50 text-pink-600 border-pink-200',
  tiktok: 'bg-slate-50 text-slate-700 border-slate-200',
  facebook: 'bg-blue-50 text-blue-600 border-blue-200',
  linkedin: 'bg-sky-50 text-sky-700 border-sky-200',
  youtube: 'bg-red-50 text-red-600 border-red-200',
  twitter: 'bg-slate-50 text-slate-600 border-slate-200',
  pinterest: 'bg-rose-50 text-rose-600 border-rose-200',
}

function SuggestionCard({ s, index }: { s: ContentSuggestion; index: number }) {
  const platformColor = PLATFORM_COLORS[s.platform] ?? 'bg-paper text-graphite/60 border-forest/15'
  return (
    <div className="bg-white border border-forest/15 p-5 flex flex-col gap-3 relative">
      {/* Card number */}
      <span className="absolute top-4 right-4 text-[10px] font-mono text-graphite/20 uppercase tracking-widest">
        #{index + 1}
      </span>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap pr-6">
        <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${platformColor}`}>
          {PLATFORM_LABELS[s.platform] ?? s.platform}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-forest/15 bg-paper text-graphite/50">
          {s.format}
        </span>
      </div>

      {/* Hook */}
      <p className="text-sm font-mono font-semibold text-graphite leading-snug">
        &ldquo;{s.hook}&rdquo;
      </p>

      {/* Caption idea */}
      <p className="text-xs font-sans text-graphite/60 leading-relaxed">{s.caption_idea}</p>

      {/* Why it works */}
      <div className="flex items-start gap-2 bg-forest/5 border border-forest/10 px-3 py-2">
        <Zap size={11} strokeWidth={2} className="text-rust flex-shrink-0 mt-0.5" />
        <p className="text-[11px] font-sans text-graphite/70 leading-relaxed">{s.why_it_will_work}</p>
      </div>

      {/* Angle + CTA */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[10px] font-mono text-graphite/35 uppercase tracking-widest">{s.angle}</span>
        <a
          href={`/create?hook=${encodeURIComponent(s.hook)}`}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-rust hover:text-rust/70 transition-colors"
        >
          Create this ad <ExternalLink size={9} />
        </a>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const isSampleMode = analytics.length === 0
  const data = isSampleMode ? SAMPLE_ANALYTICS : analytics

  const [platform, setPlatform] = useState('All')
  const [sortBy, setSortBy] = useState<'views' | 'likes' | 'comments' | 'shares' | 'reach' | 'scheduled_for'>('scheduled_for')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [insights, setInsights] = useState<AnalyticsInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  async function fetchInsights() {
    setInsightsLoading(true)
    setInsightsError(null)

    // Compute engagement rate for each post and pick top 5
    const withEng = data.map((p) => {
      const eng = p.reach > 0
        ? (((p.likes + p.comments + p.shares + p.saves) / p.reach) * 100).toFixed(1) + '%'
        : '0%'
      return { ...p, engagement_rate: eng }
    })

    const top5 = [...withEng]
      .sort((a, b) => parseFloat(b.engagement_rate) - parseFloat(a.engagement_rate))
      .slice(0, 5)
      .map((p) => ({
        hook: p.ad_hook ?? null,
        caption: p.caption ?? null,
        platform: p.platform,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        reach: p.reach,
        engagement_rate: p.engagement_rate,
      }))

    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: top5 }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch insights')
      }

      const result: AnalyticsInsights = await res.json()
      setInsights(result)
    } catch (e: any) {
      setInsightsError(e.message || 'Something went wrong')
    } finally {
      setInsightsLoading(false)
    }
  }

  const filtered = data.filter((a) => platform === 'All' || a.platform === platform)

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

  const activePlatforms = ['All', ...Array.from(new Set(data.map((a) => a.platform))).filter(Boolean)]

  return (
    <div className="w-full">
      {/* ── Sample data banner ── */}
      {isSampleMode && (
        <div className="mb-6 border border-rust/30 bg-rust/5 px-4 py-3 flex items-center gap-3">
          <BarChart2 size={14} strokeWidth={1.6} className="text-rust flex-shrink-0" />
          <p className="text-[11px] font-mono uppercase tracking-widest text-rust">
            Sample data — connect Late API to see your real post metrics
          </p>
        </div>
      )}

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

      {/* ── AI Creative Intelligence ── */}
      <div className="mb-8 border border-forest/20 bg-white">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-forest/10">
          <div className="flex items-center gap-2">
            <Sparkles size={14} strokeWidth={1.8} className="text-rust" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-graphite">AI Creative Intelligence</span>
          </div>
          {insights && (
            <button
              onClick={fetchInsights}
              disabled={insightsLoading}
              className="text-[10px] font-mono uppercase tracking-widest text-graphite/40 hover:text-graphite transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <RefreshCw size={9} className={insightsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>

        <div className="p-5">
          {/* Idle state */}
          {!insights && !insightsLoading && !insightsError && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <p className="text-xs font-sans text-graphite/50 max-w-sm">
                Analyze your top-performing posts and get AI-generated content suggestions designed to go viral.
                {isSampleMode && ' (Currently using sample data for demonstration.)'}
              </p>
              <button
                onClick={fetchInsights}
                className="flex items-center gap-2 bg-rust text-white text-[11px] font-mono uppercase tracking-widest px-5 py-2.5 hover:bg-rust/90 transition-colors"
              >
                <Sparkles size={12} />
                Analyze Top Performers
              </button>
            </div>
          )}

          {/* Loading */}
          {insightsLoading && (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <Sparkles size={20} strokeWidth={1.4} className="text-rust animate-pulse" />
              <p className="text-[11px] font-mono uppercase tracking-widest text-graphite/40">
                Analyzing your top performers…
              </p>
            </div>
          )}

          {/* Error */}
          {insightsError && !insightsLoading && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <p className="text-xs font-sans text-rust/70">{insightsError}</p>
              <button
                onClick={fetchInsights}
                className="text-[11px] font-mono uppercase tracking-widest text-graphite/50 hover:text-graphite transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Results */}
          {insights && !insightsLoading && (
            <div className="flex flex-col gap-5">
              {/* Summary */}
              <div className="flex items-start gap-3 bg-rust/5 border border-rust/15 px-4 py-3">
                <Sparkles size={13} strokeWidth={1.8} className="text-rust flex-shrink-0 mt-0.5" />
                <p className="text-xs font-sans text-graphite/80 leading-relaxed">{insights.summary}</p>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-graphite/35 mb-3">
                  Content suggestions
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.suggestions.map((s, i) => (
                    <SuggestionCard key={i} s={s} index={i} />
                  ))}
                </div>
              </div>
            </div>
          )}
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
      {!isSampleMode && data.length > 0 && (
        <p className="text-[10px] font-mono text-graphite/25 uppercase tracking-widest mt-4 text-right">
          {data[0].fetched_at
            ? `Last synced ${formatDate(data[0].fetched_at)}`
            : 'Not yet synced with Late API'}
        </p>
      )}
    </div>
  )
}

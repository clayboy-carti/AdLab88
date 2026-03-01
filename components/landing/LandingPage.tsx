'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ─── Scroll-trigger hook ──────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

// ─── Grid backgrounds ─────────────────────────────────────────────────────────
const paperGrid = {
  backgroundImage: `linear-gradient(rgba(31,58,50,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(31,58,50,0.055) 1px, transparent 1px)`,
  backgroundSize: '28px 28px',
}
const forestGrid = {
  backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
  backgroundSize: '32px 32px',
}

// ─── Hero workflow visual ─────────────────────────────────────────────────────
function HeroWorkflowVisual({ activeStep }: { activeStep: number }) {
  const steps = [
    {
      label: 'UPLOAD',
      title: 'Your Product Photo',
      sub: 'Drop in any image — product, lifestyle, or brand asset',
      content: (
        <div className="flex flex-col gap-3">
          <div className="w-full rounded-xl bg-paper/8 border-2 border-dashed border-paper/20 aspect-video flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-paper/10 border border-paper/20 grid grid-cols-2 gap-0.5 overflow-hidden p-1.5">
              <div className="bg-paper/15 rounded-sm" />
              <div className="bg-paper/10 rounded-sm" />
              <div className="bg-paper/10 rounded-sm" />
              <div className="bg-paper/15 rounded-sm" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="font-mono text-[10px] text-paper/50 uppercase tracking-widest">Drop file here</p>
              <p className="font-mono text-[9px] text-paper/25 uppercase tracking-widest">or pick from library</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-8 rounded-lg bg-paper/8 border border-paper/15 flex items-center px-3">
              <span className="font-mono text-[9px] text-paper/30 uppercase tracking-widest">product_shot.jpg</span>
            </div>
            <div className="px-3 h-8 rounded-lg bg-rust/70 flex items-center">
              <span className="font-mono text-[9px] text-white uppercase tracking-widest">Upload</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: 'GENERATE',
      title: 'AI Creates Mockup',
      sub: 'Pick a scene, watch Gemini place your product in',
      content: (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-1.5">
            {['Studio', 'Lifestyle', 'Luxury', 'Golden Hr', 'Minimal', 'Outdoor'].map((s, i) => (
              <button key={i} className={`py-1.5 rounded-lg font-mono text-[8px] uppercase tracking-widest transition-all ${i === 0 ? 'bg-sage/40 border border-sage/60 text-paper' : 'bg-paper/5 border border-paper/10 text-paper/30'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            {/* Scan line animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="w-full h-6 bg-gradient-to-b from-transparent via-sage/20 to-transparent" style={{ animation: 'scanLine 2s linear infinite' }} />
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/90 shadow-2xl relative z-10" />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-dot" />
              <span className="font-mono text-[8px] text-paper/50">Gemini generating…</span>
            </div>
          </div>
          <div className="flex gap-2">
            {['Gemini Vision', 'Claude 3.5', '2K Quality'].map((m, i) => (
              <span key={i} className="flex-1 text-center py-1 rounded-lg bg-paper/5 border border-paper/10 font-mono text-[7px] uppercase tracking-widest text-paper/40">{m}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'SCHEDULE',
      title: 'Schedule & Post',
      sub: 'Set a date, pick platforms, let AdLab handle the rest',
      content: (
        <div className="flex flex-col gap-3">
          <div className="w-full rounded-xl bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 aspect-video relative overflow-hidden flex items-center justify-center border border-paper/10">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="w-10 h-10 rounded-lg bg-white/90 shadow-2xl relative z-10" />
            <div className="absolute top-2 right-2">
              <span className="bg-sage/80 text-forest font-mono text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">✓ Ready</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {['IG', 'TW', 'FB'].map((p, i) => (
              <div key={i} className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-0.5 border transition-all ${i === 0 ? 'bg-rust/20 border-rust/40' : 'bg-paper/5 border-paper/10'}`}>
                <span className="font-mono text-[9px] text-paper/60 uppercase">{p}</span>
                {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-rust" />}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 py-2 rounded-xl bg-rust/80 text-center font-mono text-[9px] uppercase tracking-widest text-white">
              Schedule for Mar 17
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Floating badge top-right */}
      <div className="absolute -top-3 -right-3 z-20 bg-rust text-white rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-widest shadow-lg animate-bounce-slow">
        5× Faster
      </div>
      {/* Floating badge bottom-left */}
      <div className="absolute -bottom-3 -left-3 z-20 bg-sage text-forest rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-widest shadow-lg animate-float-alt">
        AI-Powered
      </div>

      {/* App window */}
      <div className="rounded-2xl border border-paper/15 bg-forest/60 backdrop-blur-md overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-paper/10 bg-forest/40">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 text-center font-mono text-[9px] uppercase tracking-widest text-paper/30">
            AdLab 88 — Lab Bench
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-paper/10">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex-1 py-2.5 text-center font-mono text-[9px] uppercase tracking-widest transition-all duration-300 ${
                i === activeStep
                  ? 'bg-rust/20 text-rust border-b-2 border-rust'
                  : 'text-paper/25 border-b-2 border-transparent'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="font-mono text-xs font-semibold text-paper/80 mb-0.5">{steps[activeStep].title}</p>
          <p className="font-sans text-[10px] text-paper/40 mb-4">{steps[activeStep].sub}</p>
          {steps[activeStep].content}
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pb-4 pt-1">
          {steps.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-400 ${i === activeStep ? 'w-5 h-1.5 bg-rust' : 'w-1.5 h-1.5 bg-paper/20'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Mockup before/after visual ───────────────────────────────────────────────
function MockupPreview() {
  const [view, setView] = useState<'before' | 'after'>('before')
  useEffect(() => {
    const t = setInterval(() => setView(v => v === 'before' ? 'after' : 'before'), 3200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl overflow-hidden border border-forest/15 shadow-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forest/10">
          <div className="flex gap-1.5">
            <button
              onClick={() => setView('before')}
              className={`px-3 py-1 rounded-lg font-mono text-[9px] uppercase tracking-widest transition-all ${view === 'before' ? 'bg-forest text-paper' : 'text-graphite/35 hover:text-graphite/60'}`}
            >Before</button>
            <button
              onClick={() => setView('after')}
              className={`px-3 py-1 rounded-lg font-mono text-[9px] uppercase tracking-widest transition-all ${view === 'after' ? 'bg-rust text-white' : 'text-graphite/35 hover:text-graphite/60'}`}
            >After</button>
          </div>
          <span className="font-mono text-[9px] text-graphite/30 uppercase">{view === 'before' ? 'Raw Photo' : 'Studio Scene'}</span>
        </div>

        {/* Image area */}
        <div className="aspect-square relative overflow-hidden transition-all duration-700">
          {view === 'before' ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-50">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-graphite/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-lg bg-graphite/8" />
              </div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-graphite/30">Raw Product Photo</p>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {/* Subtle shadow/reflection */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-3 bg-black/25 rounded-full blur-md" />
              <div className="w-20 h-20 rounded-xl bg-white/92 shadow-2xl relative z-10 flex items-center justify-center">
                <div className="w-12 h-12 rounded-lg bg-forest/15" />
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="font-mono text-[8px] text-paper/50 uppercase tracking-widest">Cinematic Studio</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-sage/70 text-forest font-mono text-[8px] px-2 py-0.5 rounded-full">AI Scene</span>
              </div>
            </div>
          )}
        </div>

        {/* Scene presets row */}
        <div className="p-3 flex gap-1.5 overflow-x-auto">
          {['Studio', 'Lifestyle', 'Luxury', 'Outdoor', 'Golden Hr'].map((s, i) => (
            <button key={i} className={`flex-shrink-0 px-2.5 py-1 rounded-lg font-mono text-[8px] uppercase tracking-widest border transition-all ${i === 0 ? 'bg-forest text-paper border-forest' : 'border-forest/20 text-graphite/40 hover:border-forest/40'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats below card */}
      <div className="flex gap-3 mt-3">
        <div className="flex-1 rounded-xl bg-white border border-forest/10 p-3 text-center">
          <p className="font-mono text-lg font-bold text-forest">50+</p>
          <p className="font-mono text-[8px] uppercase tracking-widest text-graphite/40">Scene Presets</p>
        </div>
        <div className="flex-1 rounded-xl bg-white border border-forest/10 p-3 text-center">
          <p className="font-mono text-lg font-bold text-forest">2K</p>
          <p className="font-mono text-[8px] uppercase tracking-widest text-graphite/40">Max Resolution</p>
        </div>
        <div className="flex-1 rounded-xl bg-white border border-forest/10 p-3 text-center">
          <p className="font-mono text-lg font-bold text-rust">~30s</p>
          <p className="font-mono text-[8px] uppercase tracking-widest text-graphite/40">Generate Time</p>
        </div>
      </div>
    </div>
  )
}

// ─── Mini calendar visual ─────────────────────────────────────────────────────
function MiniCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const scheduled = [3, 7, 10, 14, 17, 21, 24, 28]
  const today = 15

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl bg-white border border-forest/15 shadow-sm overflow-hidden">
        {/* Calendar header */}
        <div className="px-5 py-4 border-b border-forest/10 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-forest uppercase tracking-widest">March 2024</span>
          <div className="flex gap-1">
            {['IG', 'TW', 'FB'].map(p => (
              <span key={p} className="px-1.5 py-0.5 rounded bg-sage/20 font-mono text-[8px] text-forest uppercase tracking-wide">{p}</span>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center font-mono text-[8px] text-graphite/30 uppercase py-0.5">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Offset for month start (Friday = col 5, index 4 in 0-base) */}
            {[...Array(5)].map((_, i) => <div key={`e-${i}`} />)}
            {days.map(d => (
              <div
                key={d}
                className={`aspect-square rounded-lg flex items-center justify-center font-mono text-[9px] transition-all ${
                  scheduled.includes(d)
                    ? 'bg-rust text-white font-bold shadow-sm'
                    : d === today
                    ? 'bg-forest text-paper ring-2 ring-sage/50'
                    : 'text-graphite/50 hover:bg-forest/5'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Next posts */}
        <div className="px-4 pb-4 flex gap-2">
          <div className="flex-1 rounded-xl bg-rust/8 border border-rust/20 p-2.5">
            <p className="font-mono text-[8px] text-rust uppercase tracking-widest mb-0.5">Next Post</p>
            <p className="font-mono text-xs text-graphite font-semibold">Mar 17 · IG</p>
          </div>
          <div className="flex-1 rounded-xl bg-sage/10 border border-sage/30 p-2.5">
            <p className="font-mono text-[8px] text-forest/50 uppercase tracking-widest mb-0.5">Scheduled</p>
            <p className="font-mono text-xs text-graphite font-semibold">8 posts</p>
          </div>
          <div className="flex-1 rounded-xl bg-forest/5 border border-forest/15 p-2.5">
            <p className="font-mono text-[8px] text-forest/50 uppercase tracking-widest mb-0.5">Platforms</p>
            <p className="font-mono text-xs text-graphite font-semibold">3 linked</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics chart visual ───────────────────────────────────────────────────
function AnalyticsVisual({ animated }: { animated: boolean }) {
  const posts = [
    { label: 'Post #1', pct: 68, platform: 'IG', isTop: false },
    { label: 'Post #2', pct: 82, platform: 'TW', isTop: false },
    { label: 'Post #3', pct: 100, platform: 'IG', isTop: true },
    { label: 'Post #4', pct: 74, platform: 'FB', isTop: false },
    { label: 'Post #5', pct: 91, platform: 'IG', isTop: false },
  ]

  const suggestions = [
    'Golden hour lighting → avg +34% CTR',
    'Minimal text beats busy by 2.1×',
    'Studio bg trending — try this week',
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="bg-paper/5 border border-paper/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-sage">Top Performers</p>
          <div className="flex gap-1">
            {['7D', '30D', '90D'].map((p, i) => (
              <button key={i} className={`px-2 py-1 rounded font-mono text-[8px] uppercase tracking-widest transition-all ${i === 1 ? 'bg-rust/70 text-white' : 'text-paper/30 hover:text-paper/50'}`}>{p}</button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2 h-32">
          {posts.map((post, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-lg transition-all duration-700 origin-bottom ${post.isTop ? 'bg-rust/80' : 'bg-sage/40'}`}
                style={{
                  height: animated ? `${post.pct}%` : '0%',
                  transitionDelay: `${i * 100 + 200}ms`,
                }}
              />
              <span className="font-mono text-[7px] text-paper/40 uppercase">{post.platform}</span>
            </div>
          ))}
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-paper/10">
          {[
            { value: '124K', label: 'Impressions' },
            { value: '8.4%', label: 'Avg CTR' },
            { value: '+23%', label: 'MoM' },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <p className="font-mono text-base font-bold text-paper">{m.value}</p>
              <p className="font-mono text-[7px] uppercase tracking-widest text-paper/30 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI suggestions */}
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-sage/70 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block animate-pulse-dot" />
          AI Suggests
        </p>
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-paper/5 border border-paper/10 rounded-xl px-3.5 py-2.5 transition-all duration-500"
            style={{ opacity: animated ? 1 : 0, transform: animated ? 'translateX(0)' : 'translateX(20px)', transitionDelay: `${i * 100 + 600}ms` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
            <span className="font-sans text-xs text-paper/65 leading-snug">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  tier, price, priceNote, features, cta, highlighted,
}: {
  tier: string; price: string; priceNote: string; features: string[]; cta: string; highlighted?: boolean
}) {
  return (
    <div className={`rounded-2xl p-6 flex flex-col gap-5 border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group ${
      highlighted
        ? 'bg-forest border-forest text-paper shadow-lg shadow-forest/20'
        : 'bg-white border-forest/15 text-graphite'
    }`}>
      {highlighted && (
        <div className="flex justify-center -mt-2 mb-0">
          <span className="bg-rust text-white font-mono text-[8px] uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</span>
        </div>
      )}
      <div>
        <p className={`font-mono text-[9px] uppercase tracking-widest mb-2 ${highlighted ? 'text-paper/50' : 'text-graphite/40'}`}>{tier}</p>
        <div className="flex items-baseline gap-1">
          <p className={`font-mono text-4xl font-bold ${highlighted ? 'text-paper' : 'text-forest'}`}>{price}</p>
          {price !== 'Free' && <span className={`font-sans text-sm ${highlighted ? 'text-paper/50' : 'text-graphite/40'}`}>/mo</span>}
        </div>
        <p className={`font-sans text-xs mt-1 ${highlighted ? 'text-paper/40' : 'text-graphite/40'}`}>{priceNote}</p>
      </div>
      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex-shrink-0 text-xs ${highlighted ? 'text-sage' : 'text-rust'}`}>✓</span>
            <span className={`font-sans text-sm leading-snug ${highlighted ? 'text-paper/75' : 'text-graphite/65'}`}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={`text-center py-3 rounded-xl font-mono text-[10px] uppercase tracking-widest transition-all ${
          highlighted
            ? 'bg-rust text-white hover:bg-rust/90 hover:shadow-lg hover:shadow-rust/25'
            : 'bg-forest/8 text-forest hover:bg-forest/15 border border-forest/20'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, light }: { children: string; light?: boolean }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-widest mb-3 ${light ? 'text-sage' : 'text-rust'}`}>
      {children}
    </p>
  )
}

// ─── Main landing page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [heroStep, setHeroStep] = useState(0)
  const [processRef, processInView] = useInView()
  const [mockupRef, mockupInView] = useInView()
  const [scheduleRef, scheduleInView] = useInView()
  const [analyticsRef, analyticsInView] = useInView()
  const [pricingRef, pricingInView] = useInView()
  const [barsReady, setBarsReady] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setHeroStep(s => (s + 1) % 3), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (analyticsInView) {
      const t = setTimeout(() => setBarsReady(true), 350)
      return () => clearTimeout(t)
    }
  }, [analyticsInView])

  return (
    <div className="min-h-screen bg-paper font-sans overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forest/95 backdrop-blur-sm border-b border-paper/10" style={forestGrid}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rust flex items-center justify-center shadow-sm">
              <span className="font-mono text-white font-bold text-xs leading-none">88</span>
            </div>
            <span className="font-mono font-bold text-paper text-sm tracking-widest uppercase">AdLab 88</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="#how-it-works" className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-paper/50 hover:text-paper/80 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="hidden md:block font-mono text-[10px] uppercase tracking-widest text-paper/50 hover:text-paper/80 transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="font-mono text-[10px] uppercase tracking-widest text-paper/55 hover:text-paper transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-rust text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-rust/90 transition-all hover:shadow-lg hover:shadow-rust/20 hover:-translate-y-0.5"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-forest pt-16 flex items-center relative overflow-hidden" style={forestGrid}>
        {/* Decorative blobs */}
        <div className="absolute top-24 left-12 w-72 h-72 rounded-full bg-sage/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 right-16 w-96 h-96 rounded-full bg-rust/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-forest/50 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-7">
            {/* Label */}
            <div className="inline-flex">
              <span className="bg-rust/15 border border-rust/25 text-rust font-mono text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-full">
                AI-Powered Ad Creative Platform
              </span>
            </div>

            {/* Headline */}
            <div className="flex flex-col gap-1">
              <h1 className="font-mono text-5xl lg:text-6xl font-bold text-paper leading-[1.05] tracking-tight">
                RAW<br />
                PHOTOS.<br />
                <span className="text-rust">PRODUCT</span><br />
                <span className="text-rust">ADS.</span><br />
                POSTED.
              </h1>
            </div>

            {/* Subtext */}
            <p className="font-sans text-paper/60 text-lg leading-relaxed max-w-md">
              Transform product images into photorealistic scene mockups,
              generate AI-optimized ad copy, and schedule across all your
              platforms. In minutes, not hours.
            </p>

            {/* Flow chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: '📸 Upload Photo' },
                null,
                { label: '✨ AI Mockup' },
                null,
                { label: '📅 Auto-Post' },
              ].map((item, i) =>
                item === null ? (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                ) : (
                  <span key={i} className="bg-paper/8 border border-paper/12 text-paper/75 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {item.label}
                  </span>
                )
              )}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-4 pt-1">
              <Link
                href="/login"
                className="bg-rust text-white font-mono text-[10px] uppercase tracking-widest px-7 py-4 rounded-xl hover:bg-rust/90 transition-all hover:shadow-2xl hover:shadow-rust/25 hover:-translate-y-1"
              >
                Start Free Trial
              </Link>
              <Link
                href="#how-it-works"
                className="text-paper/50 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-paper transition-colors group"
              >
                See How It Works
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-y-1 transition-transform">
                  <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                </svg>
              </Link>
            </div>

            {/* Tagline */}
            <div className="pt-2 border-t border-paper/10">
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/20">Run Better Experiments.</p>
            </div>
          </div>

          {/* Right: Animated visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="animate-float">
              <HeroWorkflowVisual activeStep={heroStep} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <div className="bg-white border-y border-forest/8 py-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-forest/8">
            {[
              { value: '50+', label: 'Scene Presets' },
              { value: '5×', label: 'Batch Generation' },
              { value: '3', label: 'AI Models' },
              { value: '∞', label: 'Creativity' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-4 px-6">
                <span className="font-mono text-3xl font-bold text-forest">{stat.value}</span>
                <span className="font-mono text-[8px] uppercase tracking-widest text-graphite/35">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROCESS ───────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 bg-paper" style={paperGrid}>
        <div className="max-w-5xl mx-auto px-6" ref={processRef}>
          <div
            className="text-center mb-16 transition-all duration-700"
            style={{ opacity: processInView ? 1 : 0, transform: processInView ? 'translateY(0)' : 'translateY(28px)' }}
          >
            <SectionLabel>The Lab Process</SectionLabel>
            <h2 className="font-mono text-4xl font-bold text-forest leading-snug">
              From photo to posted.<br />Three steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector lines */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-forest/12" />

            {[
              {
                num: '01',
                emoji: '📸',
                title: 'Upload Your Photo',
                desc: 'Drop in any product photo or brand asset. Upload a fresh shot or pick from your AdLab Library.',
                color: 'bg-forest',
              },
              {
                num: '02',
                emoji: '✨',
                title: 'AI Generates Content',
                desc: 'Pick a scene preset. AI places your product into a photorealistic mockup and writes optimized ad copy. Single or 5× batch.',
                color: 'bg-rust',
              },
              {
                num: '03',
                emoji: '📅',
                title: 'Schedule & Auto-Post',
                desc: 'Review your ad, pick a date, and schedule to Instagram, Twitter, or Facebook. Auto-posts hands-free.',
                color: 'bg-sage',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="transition-all duration-700"
                style={{
                  opacity: processInView ? 1 : 0,
                  transform: processInView ? 'translateY(0)' : 'translateY(32px)',
                  transitionDelay: `${i * 130 + 150}ms`,
                }}
              >
                <div className="bg-white rounded-2xl border border-forest/10 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${step.color} text-white flex items-center justify-center font-mono text-sm font-bold flex-shrink-0`}>
                      {step.num}
                    </div>
                    <span className="text-2xl">{step.emoji}</span>
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-forest mb-2">{step.title}</h3>
                    <p className="font-sans text-sm text-graphite/60 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE: PRODUCT MOCKUP ──────────────────────────────────────── */}
      <section className="py-28 bg-white" ref={mockupRef}>
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="grid lg:grid-cols-2 gap-16 items-center transition-all duration-700"
            style={{ opacity: mockupInView ? 1 : 0, transform: mockupInView ? 'translateX(0)' : 'translateX(-32px)' }}
          >
            {/* Visual */}
            <div className="flex justify-center order-2 lg:order-1">
              <MockupPreview />
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2 flex flex-col gap-5">
              <SectionLabel>Product Mockup</SectionLabel>
              <h2 className="font-mono text-4xl font-bold text-forest leading-snug">
                Your product.<br />Any scene.<br />Instantly.
              </h2>
              <p className="font-sans text-graphite/60 leading-relaxed text-base">
                Drop in a product photo and watch AI place it into 50+ photorealistic
                scene presets — studio setups, lifestyle settings, golden hour, luxury
                aesthetics, and more. No Photoshop. No photographer.
              </p>
              <p className="font-sans text-graphite/55 leading-relaxed text-base">
                Or upload your own content and use it as a base for AI enhancement.
                Your creative, supercharged.
              </p>

              {/* Scene preset chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {['Studio', 'Lifestyle', 'Golden Hour', 'Luxury', 'Minimal', 'Outdoor', 'Abstract'].map(s => (
                  <span key={s} className="bg-sage/12 border border-sage/30 text-forest font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {s}
                  </span>
                ))}
                <span className="bg-forest/5 border border-forest/12 text-forest/40 font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                  +43 more
                </span>
              </div>

              <Link
                href="/login"
                className="self-start bg-rust text-white font-mono text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-rust/90 transition-all hover:shadow-lg hover:shadow-rust/20 hover:-translate-y-0.5 mt-2"
              >
                Try Product Mockup →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE: AD GENERATION ───────────────────────────────────────── */}
      <section className="py-28 bg-paper" style={paperGrid}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionLabel>AI Ad Generation</SectionLabel>
            <h2 className="font-mono text-4xl font-bold text-forest">Framework-driven ads that convert.</h2>
            <p className="font-sans text-graphite/55 max-w-xl mx-auto mt-4 leading-relaxed">
              AdLab uses structured marketing frameworks to condition AI output.
              Not generic content — strategic creative built on proven ad principles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '✍️',
                color: 'bg-rust/10 border-rust/20',
                iconBg: 'bg-rust/15',
                title: 'AI Copywriting',
                desc: 'Claude 3.5 generates hooks, headlines, body copy, and social captions — tuned to your brand voice, positioning, and target audience.',
              },
              {
                icon: '🎨',
                color: 'bg-forest/5 border-forest/15',
                iconBg: 'bg-forest/10',
                title: 'Visual Generation',
                desc: 'Gemini and Flux models create high-fidelity ad images at 1K or 2K resolution. Any aspect ratio. Any creative direction.',
              },
              {
                icon: '⚡',
                color: 'bg-sage/10 border-sage/25',
                iconBg: 'bg-sage/20',
                title: '5× Batch Mode',
                desc: 'Generate five unique ad variants from one brief. Test different angles, hooks, and visual styles simultaneously — then ship the winner.',
              },
            ].map((feat, i) => (
              <div key={i} className={`rounded-2xl border p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${feat.color}`}>
                <div className={`w-10 h-10 rounded-xl ${feat.iconBg} flex items-center justify-center text-xl`}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-mono text-sm font-semibold text-forest mb-2">{feat.title}</h3>
                  <p className="font-sans text-sm text-graphite/60 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Batch generation visual hint */}
          <div className="mt-8 rounded-2xl bg-white border border-forest/10 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="flex gap-3 flex-1">
              {[100, 85, 95, 78, 90].map((opacity, i) => (
                <div
                  key={i}
                  className="flex-1 aspect-square rounded-xl bg-gradient-to-br from-sage/20 to-forest/15 border border-forest/10 flex items-center justify-center relative overflow-hidden"
                  style={{ opacity: opacity / 100 }}
                >
                  <div className="w-6 h-6 rounded bg-forest/20" />
                  <div className="absolute top-1.5 right-1.5 bg-rust text-white rounded font-mono text-[7px] px-1">
                    {String.fromCharCode(65 + i)}
                  </div>
                </div>
              ))}
            </div>
            <div className="md:max-w-xs">
              <p className="font-mono text-xs font-semibold text-forest mb-1">5× Batch Generation</p>
              <p className="font-sans text-sm text-graphite/55 leading-relaxed">
                One brief. Five ad variants. Run A/B tests at scale without doubling your workload.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE: SCHEDULE ────────────────────────────────────────────── */}
      <section className="py-28 bg-white" ref={scheduleRef}>
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="grid lg:grid-cols-2 gap-16 items-center transition-all duration-700"
            style={{ opacity: scheduleInView ? 1 : 0, transform: scheduleInView ? 'translateX(0)' : 'translateX(32px)' }}
          >
            {/* Copy */}
            <div className="flex flex-col gap-5">
              <SectionLabel>Smart Scheduling</SectionLabel>
              <h2 className="font-mono text-4xl font-bold text-forest leading-snug">
                Plan once.<br />Post everywhere.<br />Automatically.
              </h2>
              <p className="font-sans text-graphite/60 leading-relaxed">
                Schedule your AI-generated ads to publish across Instagram, Twitter, and
                Facebook. Set it up once and let AdLab run your content calendar — completely hands-free.
              </p>

              <ul className="flex flex-col gap-3 pt-1">
                {[
                  'Calendar view — drag and drop scheduling',
                  'Multi-platform publishing in one click',
                  'Platform-specific captions and copy',
                  'Status tracking from scheduled to posted',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-rust/12 border border-rust/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rust" />
                    </div>
                    <span className="font-sans text-sm text-graphite/65 leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="self-start bg-forest text-paper font-mono text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-forest/90 transition-all hover:shadow-lg hover:-translate-y-0.5 mt-2"
              >
                Set Up Your Schedule →
              </Link>
            </div>

            {/* Visual */}
            <div className="flex justify-center">
              <MiniCalendar />
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYTICS + AI ────────────────────────────────────────────────── */}
      <section className="py-28 bg-forest relative overflow-hidden" style={forestGrid} ref={analyticsRef}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-sage/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-rust/5 blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div
            className="grid lg:grid-cols-2 gap-16 items-center transition-all duration-700"
            style={{ opacity: analyticsInView ? 1 : 0, transform: analyticsInView ? 'translateY(0)' : 'translateY(28px)' }}
          >
            {/* Copy */}
            <div className="flex flex-col gap-6">
              <SectionLabel light>Analytics + AI Insights</SectionLabel>
              <h2 className="font-mono text-4xl font-bold text-paper leading-snug">
                Your best ads tell you what to make next.
              </h2>
              <p className="font-sans text-paper/55 leading-relaxed text-base">
                AdLab tracks performance across every post. Our AI analyzes your top
                performers and suggests exactly what to create next — so you double down
                on what&apos;s working and stop guessing.
              </p>

              <div className="flex flex-col gap-4 pt-1">
                {[
                  { icon: '📊', title: 'Performance tracking', desc: 'Impressions, CTR, and engagement for every ad in your library.' },
                  { icon: '🏆', title: 'Top performer analysis', desc: 'Instantly see which ads, scenes, and copy styles are winning.' },
                  { icon: '🤖', title: 'AI content suggestions', desc: 'Based on your winners, AI recommends your next creative direction.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-paper/8 border border-paper/12 flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-mono text-xs font-semibold text-paper/80 mb-0.5">{item.title}</p>
                      <p className="font-sans text-sm text-paper/45 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                className="self-start bg-rust text-white font-mono text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-rust/90 transition-all hover:shadow-lg hover:shadow-rust/20 hover:-translate-y-0.5"
              >
                See Your Analytics →
              </Link>
            </div>

            {/* Analytics visual */}
            <div>
              <AnalyticsVisual animated={barsReady} />
            </div>
          </div>
        </div>
      </section>

      {/* ── ANIMATE FEATURE ──────────────────────────────────────────────── */}
      <section className="py-28 bg-paper" style={paperGrid}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div className="flex flex-col gap-5">
              <SectionLabel>Animate</SectionLabel>
              <h2 className="font-mono text-4xl font-bold text-forest leading-snug">
                Still images.<br />Now moving.
              </h2>
              <p className="font-sans text-graphite/60 leading-relaxed">
                Turn any ad image into a 5-second video with AI animation. Powered by
                Grok Video — no editing skills required. Video ads stop the scroll.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Motion prompts', '5-sec videos', 'MP4 export', 'From any image'].map(f => (
                  <span key={f} className="bg-sage/12 border border-sage/25 text-forest font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
              <Link
                href="/login"
                className="self-start bg-rust text-white font-mono text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-rust/90 transition-all hover:shadow-lg hover:shadow-rust/20 hover:-translate-y-0.5"
              >
                Animate Your Ads →
              </Link>
            </div>

            {/* Visual */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <div className="rounded-2xl bg-white border border-forest/12 shadow-sm p-6 flex flex-col md:flex-row gap-5 items-center">
                  {/* Input */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full aspect-square rounded-xl bg-paper border border-forest/10 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-xl bg-forest/10 border border-forest/15" />
                    </div>
                    <span className="font-mono text-[8px] text-graphite/35 uppercase tracking-widest">Still Image</span>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-rust/10 border border-rust/25 flex items-center justify-center animate-pulse-dot">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B55233" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                    <span className="font-mono text-[7px] text-rust uppercase tracking-widest text-center leading-tight">Grok<br />Video</span>
                  </div>

                  {/* Output */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full aspect-square rounded-xl bg-forest/6 border border-forest/15 relative overflow-hidden flex items-center justify-center">
                      <div className="w-14 h-14 rounded-xl bg-forest/15 border border-forest/20" />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-forest/80 flex items-center justify-center shadow-lg">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded px-1 py-0.5">
                        <span className="font-mono text-[7px] text-white">0:05</span>
                      </div>
                    </div>
                    <span className="font-mono text-[8px] text-graphite/35 uppercase tracking-widest">5-Sec Video</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 bg-white" ref={pricingRef}>
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="text-center mb-14 transition-all duration-700"
            style={{ opacity: pricingInView ? 1 : 0, transform: pricingInView ? 'translateY(0)' : 'translateY(28px)' }}
          >
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="font-mono text-4xl font-bold text-forest">Start your lab.</h2>
            <p className="font-sans text-graphite/55 max-w-sm mx-auto mt-4 leading-relaxed">
              From solo founders to full marketing teams. There&apos;s a plan for every experiment.
            </p>
          </div>

          <div
            className="grid md:grid-cols-3 gap-6 transition-all duration-700"
            style={{ opacity: pricingInView ? 1 : 0, transform: pricingInView ? 'translateY(0)' : 'translateY(32px)', transitionDelay: '150ms' }}
          >
            <PricingCard
              tier="Starter"
              price="Free"
              priceNote="No credit card needed"
              features={[
                '10 ads per month',
                '5 product mockups',
                'Basic scene presets',
                'Library (up to 50 items)',
                'Social scheduling',
              ]}
              cta="Start Free"
            />
            <PricingCard
              tier="Pro"
              price="$29"
              priceNote="Per month, billed monthly"
              features={[
                'Unlimited ad generation',
                'All 50+ scene presets',
                '5× batch generation',
                'Video animation',
                'Analytics dashboard',
                'AI content suggestions',
                'Priority queue',
              ]}
              cta="Start Pro"
              highlighted
            />
            <PricingCard
              tier="Team"
              price="$79"
              priceNote="Per month, billed monthly"
              features={[
                'Everything in Pro',
                'Up to 5 team members',
                'Shared brand library',
                'Team scheduling',
                'Advanced analytics',
                'Custom integrations',
              ]}
              cta="Start Team"
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 bg-forest relative overflow-hidden" style={forestGrid}>
        {/* Large background "88" watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span className="font-mono font-bold text-paper/[0.03] select-none" style={{ fontSize: '22rem', lineHeight: 1 }}>88</span>
        </div>

        {/* Blobs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-sage/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-rust/5 blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block bg-rust/15 border border-rust/25 text-rust font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
            Get Started Today
          </span>
          <h2 className="font-mono text-4xl lg:text-5xl font-bold text-paper mb-5 leading-tight">
            Ready to run<br />better experiments?
          </h2>
          <p className="font-sans text-paper/50 text-lg mb-10 leading-relaxed">
            Join founders and marketers using AdLab 88 to create, schedule,
            and scale their best-performing ads.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="bg-rust text-white font-mono text-xs uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-rust/90 transition-all hover:shadow-2xl hover:shadow-rust/25 hover:-translate-y-1"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/login"
              className="bg-paper/8 border border-paper/15 text-paper font-mono text-xs uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-paper/12 transition-all"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-5 font-mono text-[9px] uppercase tracking-widest text-paper/20">
            No credit card required. Free forever plan available.
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-forest border-t border-paper/10 py-14" style={forestGrid}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rust flex items-center justify-center">
                  <span className="font-mono text-white font-bold text-xs">88</span>
                </div>
                <span className="font-mono font-bold text-paper text-sm tracking-widest uppercase">AdLab 88</span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-paper/20">Run Better Experiments.</p>
              <p className="font-sans text-sm text-paper/35 max-w-xs leading-relaxed">
                AI-powered ad creative platform for founders, marketers, and creative teams.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-16">
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[8px] uppercase tracking-widest text-paper/25 mb-1">Product</p>
                {['Product Mockup', 'Ad Generation', 'Animate', 'Scheduling', 'Analytics'].map(link => (
                  <Link key={link} href="/login" className="font-sans text-sm text-paper/40 hover:text-paper/70 transition-colors">
                    {link}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[8px] uppercase tracking-widest text-paper/25 mb-1">Account</p>
                {['Sign In', 'Sign Up', 'Pricing', 'Brand Setup'].map(link => (
                  <Link key={link} href="/login" className="font-sans text-sm text-paper/40 hover:text-paper/70 transition-colors">
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-paper/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-mono text-[8px] uppercase tracking-widest text-paper/15">
              © 2024 AdLab 88. All rights reserved.
            </p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-paper/15">
              Powered by Claude · Gemini · Flux · Grok
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

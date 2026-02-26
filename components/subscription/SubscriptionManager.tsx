'use client'

import { useState } from 'react'
import type { SubscriptionTier } from '@/types/database'

type Plan = {
  id: SubscriptionTier
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlight: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with AI-powered ad creation.',
    features: [
      '10 ad generations / month',
      '1 brand profile',
      '5 reference image uploads',
      'Basic copy frameworks',
      'PNG export',
    ],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For creators and small teams scaling their output.',
    features: [
      '100 ad generations / month',
      '3 brand profiles',
      'Unlimited reference images',
      'All copy frameworks',
      'PNG + JPG export',
      'Priority generation queue',
      'Social scheduling',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$99',
    period: 'per month',
    description: 'For agencies and teams with high volume needs.',
    features: [
      'Unlimited ad generations',
      'Unlimited brand profiles',
      'Unlimited reference images',
      'All copy frameworks',
      'All export formats',
      'Priority generation queue',
      'Social scheduling',
      'Team collaboration',
      'Dedicated support',
    ],
    cta: 'Upgrade to Business',
    highlight: false,
  },
]

type Props = {
  currentTier: SubscriptionTier
}

export default function SubscriptionManager({ currentTier }: Props) {
  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionTier | null>(null)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleUpgrade = (tier: SubscriptionTier) => {
    if (tier === currentTier) return
    setUpgradeTarget(tier)
    setShowComingSoon(true)
    setTimeout(() => {
      setShowComingSoon(false)
      setUpgradeTarget(null)
    }, 3000)
  }

  const currentPlan = PLANS.find((p) => p.id === currentTier) ?? PLANS[0]

  return (
    <div className="flex flex-col gap-8">

      {/* Current plan banner */}
      <div className="border border-outline bg-white p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Current Plan</p>
          <p className="text-2xl font-mono font-bold text-graphite uppercase">{currentPlan.name}</p>
          <p className="text-sm font-mono text-gray-500 mt-1">{currentPlan.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-mono font-bold text-rust">{currentPlan.price}</p>
          <p className="text-xs font-mono uppercase text-gray-400">{currentPlan.period}</p>
        </div>
      </div>

      {/* Coming soon notice */}
      {showComingSoon && upgradeTarget && (
        <div className="border border-rust bg-rust/5 p-4">
          <p className="text-sm font-mono uppercase tracking-wide text-rust">
            Billing integration coming soon — {PLANS.find((p) => p.id === upgradeTarget)?.name} plan selected.
          </p>
        </div>
      )}

      {/* Plan grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === currentTier
          const isLast = i === PLANS.length - 1

          return (
            <div
              key={plan.id}
              className={[
                'flex flex-col p-6 border-outline',
                !isLast ? 'border-b md:border-b-0 md:border-r' : '',
                plan.highlight ? 'bg-forest text-paper' : 'bg-white',
              ].join(' ')}
            >
              {/* Plan header */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className={`text-xs font-mono uppercase tracking-widest ${plan.highlight ? 'text-paper/60' : 'text-gray-400'}`}>
                    {plan.name}
                  </p>
                  {isCurrent && (
                    <span className="text-xs font-mono uppercase bg-rust text-white px-2 py-0.5">
                      Active
                    </span>
                  )}
                  {plan.highlight && !isCurrent && (
                    <span className="text-xs font-mono uppercase border border-rust text-rust px-2 py-0.5">
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-3xl font-mono font-bold ${plan.highlight ? 'text-paper' : 'text-graphite'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-xs font-mono pb-1 ${plan.highlight ? 'text-paper/60' : 'text-gray-400'}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-xs font-mono ${plan.highlight ? 'text-paper/70' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`text-xs font-mono flex items-start gap-2 ${plan.highlight ? 'text-paper/80' : 'text-graphite'}`}
                  >
                    <span className="text-rust flex-shrink-0 mt-0.5">—</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent}
                className={[
                  'w-full py-3 text-xs font-mono uppercase tracking-wide border transition-colors',
                  isCurrent
                    ? 'border-gray-300 text-gray-400 cursor-default'
                    : plan.highlight
                      ? 'bg-rust border-rust text-white hover:bg-[#9a4429]'
                      : 'border-outline text-graphite hover:bg-gray-100',
                ].join(' ')}
              >
                {isCurrent ? 'Current Plan' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Billing portal placeholder (only shown if not on free) */}
      {currentTier !== 'free' && (
        <div className="border border-outline bg-white p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">Billing</p>
          <p className="text-sm font-mono text-graphite mb-4">
            Manage your payment method, download invoices, or cancel your subscription.
          </p>
          <button
            onClick={() => {
              setShowComingSoon(true)
              setTimeout(() => setShowComingSoon(false), 3000)
            }}
            className="btn-secondary text-xs px-4 py-2"
          >
            Open Billing Portal
          </button>
        </div>
      )}

    </div>
  )
}

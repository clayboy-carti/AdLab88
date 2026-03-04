import Link from 'next/link'

const CONTENT_TYPES = [
  {
    href: '/create/ad',
    tag: '[ AD GENERATION ]',
    title: 'Ad',
    description:
      'AI-written copy paired with a generated image. Powered by positioning frameworks — best for promotions, campaigns, and brand awareness.',
    badge: 'Single · Batch ×5',
  },
  {
    href: '/create/product-mockup',
    tag: '[ PRODUCT MOCKUP ]',
    title: 'Product Mockup',
    description:
      'Upload a product photo. Describe a scene. Gemini places your product there with photorealistic quality — ready for social or your site.',
    badge: 'Single · Batch ×6',
  },
  {
    href: '/create/animate',
    tag: '[ ANIMATE ]',
    title: 'Animate',
    description:
      'Pick any image from your library or upload a new one. Add a motion prompt and Grok Video turns it into a 5-second cinematic clip.',
    badge: 'Grok Video · 5s',
  },
  {
    href: '/create/compose',
    tag: '[ PROMPT COMPOSER ]',
    title: 'Prompt Composer',
    description:
      'Combine your brand intelligence profile, brand assets, and campaign goal into a precise image generation prompt — ready to use in Ad Generation.',
    badge: 'AI · Brand-aware',
  },
  {
    href: '/create/reverse',
    tag: '[ REVERSE ENGINEER ]',
    title: 'Reverse Engineer',
    description:
      'Upload or link a winning ad. Extract its style DNA, copy formula, and 3 ready-to-use variant prompts — then apply them to your brand.',
    badge: 'Vision · 3+ Variants',
  },
  {
    href: '/create/concepts',
    tag: '[ CONCEPT GENERATOR ]',
    title: 'Concept Generator',
    description:
      'Describe your campaign context and get 5 distinct creative directions — each with a format type, audience stage, strategic angle, and a ready-to-use prompt.',
    badge: '5 Concepts · AI',
  },
  {
    href: '/create/campaign',
    tag: '[ CAMPAIGN BUILDER ]',
    title: 'Campaign Builder',
    description:
      'Select intelligence profiles and brand assets, set a campaign goal, and generate a full batch of strategic ads — one per persona angle.',
    badge: 'Multi-ad · Batch',
  },
]

export default function CreatePage() {
  return (
    <div className="w-full p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-mono header-accent">The Lab Bench</h1>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-1">
          Select a content type to begin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {CONTENT_TYPES.map((ct) => (
          <Link
            key={ct.href}
            href={ct.href}
            className="group block bg-white rounded-2xl border border-forest/50 shadow-sm hover:shadow-md hover:border-forest/70 transition-all p-6"
          >
            <div className="inline-flex items-center bg-paper border border-forest/25 rounded-full px-3 py-1 mb-5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-forest/60">{ct.tag}</span>
            </div>
            <h2 className="font-mono text-xl font-semibold text-graphite mb-2 group-hover:text-rust transition-colors">
              {ct.title}
            </h2>
            <p className="font-mono text-sm text-graphite/60 leading-relaxed mb-6">
              {ct.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wide text-forest/50 bg-paper border border-forest/20 rounded-full px-3 py-1">
                {ct.badge}
              </span>
              <span className="font-mono text-xs font-medium text-rust group-hover:translate-x-0.5 transition-transform inline-block">
                START →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

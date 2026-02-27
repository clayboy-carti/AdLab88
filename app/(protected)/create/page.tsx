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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {CONTENT_TYPES.map((ct) => (
          <Link
            key={ct.href}
            href={ct.href}
            className="group block bg-white rounded-2xl border border-forest/50 shadow-sm hover:shadow-md hover:border-forest/70 transition-all p-6"
          >
            <div className="inline-flex items-center bg-paper border border-forest/25 rounded-full px-3 py-1 mb-5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-forest/60">{ct.tag}</span>
            </div>
            <h2 className="font-sans text-xl font-semibold text-graphite mb-2 group-hover:text-rust transition-colors">
              {ct.title}
            </h2>
            <p className="font-sans text-sm text-graphite/60 leading-relaxed mb-6">
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

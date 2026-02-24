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
    badge: 'Single',
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {CONTENT_TYPES.map((ct) => (
          <Link
            key={ct.href}
            href={ct.href}
            className="group block border border-outline hover:border-rust transition-colors bg-white"
          >
            <div className="bg-[#e4dcc8] border-b border-outline px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-widest">{ct.tag}</span>
            </div>
            <div className="p-5">
              <h2 className="font-mono text-lg font-bold mb-2 group-hover:text-rust transition-colors">
                {ct.title}
              </h2>
              <p className="font-mono text-xs text-gray-500 leading-relaxed mb-5">
                {ct.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5">
                  {ct.badge}
                </span>
                <span className="font-mono text-xs text-rust group-hover:translate-x-0.5 transition-transform inline-block">
                  START →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

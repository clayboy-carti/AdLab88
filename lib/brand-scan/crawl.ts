/**
 * Crawls a URL and extracts brand-relevant content from the HTML.
 * Uses native fetch with a timeout. No external HTML parser needed.
 */

export type CrawledContent = {
  url: string
  title: string
  description: string
  bodyText: string
  themeColor?: string
}

const FETCH_TIMEOUT_MS = 10_000

/** Strips HTML tags and collapses whitespace */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMeta(html: string, ...names: string[]): string {
  for (const name of names) {
    // Match <meta name="..." content="..."> or <meta property="..." content="...">
    const pattern = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name.replace('.', '\\.')}["'][^>]*content=["']([^"']+)["']`,
      'i'
    )
    const m = html.match(pattern)
    if (m?.[1]) return m[1].trim()

    // Also match reversed attribute order: content="..." name="..."
    const pattern2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name.replace('.', '\\.')}["']`,
      'i'
    )
    const m2 = html.match(pattern2)
    if (m2?.[1]) return m2[1].trim()
  }
  return ''
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1]?.trim() ?? ''
}

function extractBodyText(html: string, maxChars = 3000): string {
  // Try to grab the <main> or <article> section first for signal density
  const mainMatch = html.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i)
  const source = mainMatch ? mainMatch[1] : html
  const text = stripHtml(source)
  return text.slice(0, maxChars)
}

export async function crawlURL(url: string): Promise<CrawledContent> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let html: string
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AdLab88-BrandScanner/1.0 (brand analysis bot)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching ${url}`)
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      throw new Error(`URL did not return HTML (got: ${contentType})`)
    }

    html = await res.text()
  } finally {
    clearTimeout(timer)
  }

  const title = extractTitle(html)
  const description = extractMeta(
    html,
    'description',
    'og:description',
    'twitter:description'
  )
  const themeColor = extractMeta(html, 'theme-color') || undefined
  const bodyText = extractBodyText(html)

  return { url, title, description, bodyText, themeColor }
}

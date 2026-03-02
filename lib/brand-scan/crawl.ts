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
  cssColors?: string[]
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

function normalizeHex(hex: string): string {
  hex = hex.toUpperCase()
  if (hex.length === 4) {
    // #RGB → #RRGGBB
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }
  return hex
}

// Known framework/CMS default colors that are never brand colors
const FRAMEWORK_COLOR_BLOCKLIST = new Set([
  '#0099FF', // WordPress Gutenberg editor blue
  '#FF2244', // WooCommerce validation red
  '#FF0000', // Generic error red
  '#00FF00', // Generic green
  '#0000FF', // Pure blue
  '#FF6900', // WordPress orange
  '#FCB900', // WordPress yellow
  '#00D084', // WordPress green
  '#8ED1FC', // WordPress light blue
  '#ABB8C3', // WordPress grey
  '#EB144C', // WordPress red
  '#9900EF', // WordPress purple
])

function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  // Near white
  if (r > 220 && g > 220 && b > 220) return true
  // Near black
  if (r < 30 && g < 30 && b < 30) return true
  // Very low saturation (grey)
  if (max - min < 30) return true
  return false
}

function isUsableColor(hex: string): boolean {
  return !isNeutral(hex) && !FRAMEWORK_COLOR_BLOCKLIST.has(hex)
}

/** Extracts brand colors from <style> blocks and inline style attributes */
function extractCSSColors(html: string): string[] {
  // Collect all CSS text from <style> blocks
  const cssParts: string[] = []
  const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let m: RegExpExecArray | null
  while ((m = styleBlockRegex.exec(html)) !== null) {
    cssParts.push(m[1])
  }
  // Collect inline style attributes
  const inlineRegex = /style=["']([^"']+)["']/gi
  while ((m = inlineRegex.exec(html)) !== null) {
    cssParts.push(m[1])
  }
  const cssText = cssParts.join('\n')

  const priorityColors: string[] = []
  const colorFreq: Map<string, number> = new Map()

  // First pass: CSS custom properties with brand-related names (highest signal)
  const brandVarRegex =
    /--(?:[a-z-]*(?:primary|brand|accent|main|color|theme)[a-z-]*)\s*:\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})\b/gi
  while ((m = brandVarRegex.exec(cssText)) !== null) {
    const hex = normalizeHex(m[1])
    if (isUsableColor(hex) && !priorityColors.includes(hex)) {
      priorityColors.push(hex)
    }
  }

  // Second pass: all hex colors by frequency
  const hexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g
  while ((m = hexRegex.exec(cssText)) !== null) {
    const hex = normalizeHex(m[0])
    if (isUsableColor(hex)) {
      colorFreq.set(hex, (colorFreq.get(hex) ?? 0) + 1)
    }
  }

  const allCandidates = Array.from(colorFreq.entries()).sort((a, b) => b[1] - a[1])
  console.log('[BrandScan] All color candidates (hex: count):', allCandidates.slice(0, 20))

  const byFrequency = allCandidates.map(([c]) => c)

  // Merge: priority CSS vars first, then most-frequent repeated colors
  const result: string[] = [...priorityColors]
  for (const c of byFrequency) {
    if (!result.includes(c)) result.push(c)
    if (result.length >= 5) break
  }

  return result.slice(0, 5)
}

/** Fetches up to 3 external stylesheets linked in the HTML and returns their combined CSS text */
async function fetchLinkedStylesheets(html: string, baseUrl: string): Promise<string> {
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi
  const hrefs: string[] = []
  let m: RegExpExecArray | null
  while ((m = linkRegex.exec(html)) !== null && hrefs.length < 3) {
    hrefs.push(m[1])
  }

  const base = new URL(baseUrl)
  const parts: string[] = []

  await Promise.all(
    hrefs.map(async (href) => {
      try {
        const absolute = href.startsWith('http') ? href : new URL(href, base).toString()
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 5_000)
        const res = await fetch(absolute, { signal: controller.signal, redirect: 'follow' })
        clearTimeout(timer)
        if (res.ok) {
          const text = await res.text()
          parts.push(text.slice(0, 50_000)) // cap per stylesheet
        }
      } catch {
        // silently skip failed stylesheet fetches
      }
    })
  )

  return parts.join('\n')
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

  // Fetch external stylesheets and append to HTML for color extraction
  const externalCss = await fetchLinkedStylesheets(html, url)
  const htmlWithExternalCss = html + `<style>${externalCss}</style>`

  const title = extractTitle(html)
  const description = extractMeta(
    html,
    'description',
    'og:description',
    'twitter:description'
  )
  const themeColor = extractMeta(html, 'theme-color') || undefined
  const bodyText = extractBodyText(html)
  const cssColors = extractCSSColors(htmlWithExternalCss)

  console.log('[BrandScan] CSS colors extracted:', cssColors)

  return { url, title, description, bodyText, themeColor, cssColors: cssColors.length ? cssColors : undefined }
}

/**
 * URL security validation for brand scanning.
 * Prevents SSRF attacks by blocking private/loopback IPs and non-HTTP schemes.
 */

const BLOCKED_HOSTNAMES = [
  'localhost',
  '0.0.0.0',
]

// Private / loopback IPv4 ranges
const PRIVATE_IP_PATTERNS = [
  /^127\./,          // 127.0.0.0/8 loopback
  /^10\./,           // 10.0.0.0/8 private
  /^192\.168\./,     // 192.168.0.0/16 private
  /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12 private
  /^169\.254\./,     // 169.254.0.0/16 link-local (AWS metadata etc.)
  /^100\.(6[4-9]|[7-9]\d|1([01]\d|2[0-7]))\./,  // 100.64.0.0/10 carrier-grade NAT
]

export class URLSecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'URLSecurityError'
  }
}

export function validateScanURL(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    throw new URLSecurityError('Invalid URL format')
  }

  // Only allow HTTP and HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new URLSecurityError('Only HTTP and HTTPS URLs are allowed')
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block known bad hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new URLSecurityError('URL hostname is not allowed')
  }

  // Block IPv6 loopback/link-local
  if (hostname === '::1' || hostname.startsWith('fe80:') || hostname === '[::1]') {
    throw new URLSecurityError('URL hostname is not allowed')
  }

  // Block raw private IPv4 addresses
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new URLSecurityError('URL hostname is not allowed')
    }
  }

  return parsed
}

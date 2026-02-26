const LATE_API_BASE = 'https://getlate.dev/api/v1'

function authHeaders() {
  const key = process.env.LATE_API_KEY
  if (!key) throw new Error('LATE_API_KEY is not configured')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

export interface LateAccount {
  _id: string
  platform: string
  displayName: string
  username: string
}

export interface LatePlatform {
  platform: string
  accountId: string
}

export interface LatePost {
  _id: string
  id?: string   // handle both shapes in case API returns either
  status: string
}

export async function fetchLateAccounts(): Promise<LateAccount[]> {
  const res = await fetch(`${LATE_API_BASE}/accounts`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Late API ${res.status}: ${body}`)
  }
  const data = await res.json()
  // API may return { accounts: [...] } or a raw array
  return Array.isArray(data) ? data : (data.accounts ?? data.data ?? [])
}

export interface LateMediaItem {
  type: 'image' | 'video'
  url: string
}

export async function createLatePost(params: {
  content: string
  scheduledFor: string    // ISO 8601 e.g. "2026-02-25T12:00:00Z"
  timezone?: string
  platforms: LatePlatform[]
  imageUrl?: string       // Supabase signed URL — Late auto-proxies Supabase URLs
  videoUrl?: string       // Supabase signed URL for video media
  mediaItems?: LateMediaItem[]  // carousel: multiple items; takes priority over imageUrl/videoUrl
}): Promise<LatePost> {
  const body: Record<string, unknown> = {
    content: params.content,
    scheduledFor: params.scheduledFor,
    timezone: params.timezone ?? 'UTC',
    platforms: params.platforms,
  }

  // mediaItems is required for Instagram; field name is mediaItems (not mediaUrls)
  // carousel passes mediaItems directly; single-post falls back to imageUrl/videoUrl
  if (params.mediaItems && params.mediaItems.length > 0) {
    body.mediaItems = params.mediaItems
  } else if (params.videoUrl) {
    body.mediaItems = [{ type: 'video', url: params.videoUrl }]
  } else if (params.imageUrl) {
    body.mediaItems = [{ type: 'image', url: params.imageUrl }]
  }

  const bodyStr = JSON.stringify(body)
  console.log('[Late] POST /posts request:', bodyStr)

  const res = await fetch(`${LATE_API_BASE}/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: bodyStr,
  })

  const text = await res.text()
  console.log('[Late] POST /posts response', res.status, ':', text)

  if (!res.ok) throw new Error(`Late API ${res.status}: ${text}`)

  const raw = JSON.parse(text)
  // Late may return the post directly or wrapped under a key like { post: {...} } or { data: {...} }
  const post = (raw._id || raw.id) ? raw : (raw.post ?? raw.data ?? raw)
  console.log('[Late] resolved post object:', JSON.stringify(post))
  return post
}

export async function deleteLatePost(latePostId: string): Promise<void> {
  const res = await fetch(`${LATE_API_BASE}/posts/${latePostId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const text = await res.text()
  console.log('[Late] DELETE /posts/' + latePostId, res.status, ':', text)
  // 404 is fine — post may have already been deleted or published
  if (!res.ok && res.status !== 404) {
    throw new Error(`Late API ${res.status}: ${text}`)
  }
}

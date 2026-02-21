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
  status: string
}

export async function fetchLateAccounts(): Promise<LateAccount[]> {
  const res = await fetch(`${LATE_API_BASE}/accounts`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Late API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.accounts ?? []
}

export async function createLatePost(params: {
  content: string
  scheduledFor: string   // ISO 8601 datetime e.g. "2026-02-25T12:00:00.000Z"
  platforms: LatePlatform[]
  mediaUrls?: string[]
}): Promise<LatePost> {
  const res = await fetch(`${LATE_API_BASE}/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Late API ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function deleteLatePost(latePostId: string): Promise<void> {
  const res = await fetch(`${LATE_API_BASE}/posts/${latePostId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  // 404 is fine — post may have already been deleted or published
  if (!res.ok && res.status !== 404) {
    throw new Error(`Late API ${res.status}: ${await res.text()}`)
  }
}

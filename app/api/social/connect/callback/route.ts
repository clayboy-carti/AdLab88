import { NextRequest, NextResponse } from 'next/server'

// GET /api/social/connect/callback
// Late redirects here after OAuth is complete.
// We immediately redirect the user back to the profile page with a status flag.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl

  const error = searchParams.get('error')
  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?connect_error=${encodeURIComponent(error)}`, origin)
    )
  }

  // Late may pass ?platform= or ?account= — capture anything useful for the toast
  const platform = searchParams.get('platform') ?? searchParams.get('account') ?? 'account'

  return NextResponse.redirect(
    new URL(`/profile?connected=${encodeURIComponent(platform)}`, origin)
  )
}

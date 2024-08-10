import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { checkRequiredSettings, getSettingsPage } from './utils/helpers'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/settings`)

  if (res.ok) {
    const settings = await res.json()
    const missingSetting = checkRequiredSettings(settings)

    if (missingSetting) {
      const redirectPage = getSettingsPage(missingSetting)

      if (redirectPage && pathname !== redirectPage) {
        return NextResponse.redirect(
          new URL(redirectPage, process.env.NEXT_PUBLIC_SITE_URL),
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

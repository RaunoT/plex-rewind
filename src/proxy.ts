import { Settings } from '@/types/settings'
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import {
  getSettingsPage,
  isInitialSetup,
  isPostUpdateMissingSettings,
} from './utils/helpers'

// The middleware reads settings from the app's own API. Fetching the public
// URL (NEXT_PUBLIC_SITE_URL) makes the container round-trip back through any
// reverse proxy (e.g. Cloudflare tunnel), which can return an HTML challenge or
// error page with a 200 status and break JSON parsing (see issue #359). Always
// hit the server over the internal loopback address instead. The Docker image
// sets PORT=8383; locally Next.js defaults to 3000 when PORT is unset.
const INTERNAL_BASE_URL = `http://127.0.0.1:${process.env.PORT || '3000'}`

// Safely parse a fetch response as JSON. A reverse proxy can return HTML with a
// 200 status, so guard against non-JSON bodies instead of throwing.
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)

    if (!res.ok) {
      return null
    }

    const contentType = res.headers.get('content-type') || ''

    if (!contentType.includes('application/json')) {
      console.warn(
        `[PROXY] - Expected JSON from ${url} but received "${contentType}". Skipping settings check for this request.`,
      )

      return null
    }

    return await res.json()
  } catch (error) {
    console.error(`[PROXY] - Failed to fetch ${url}!`, error)

    return null
  }
}

export default withAuth(
  async function proxy(req) {
    const { pathname } = req.nextUrl
    const settings = await fetchJson<Settings>(
      `${INTERNAL_BASE_URL}/api/settings`,
    )
    const missingSetting = await fetchJson<string>(
      `${INTERNAL_BASE_URL}/api/missing-setting`,
    )

    if (missingSetting && settings) {
      const isSettingsPage = pathname.includes('settings')
      const isAdmin = req.nextauth?.token?.isAdmin
      const isInitialSetupMode = isInitialSetup(settings)
      const isPostUpdateMode = isPostUpdateMissingSettings(settings)

      // During initial setup, allow access to settings pages for any user (including unauthenticated)
      if (isInitialSetupMode && isSettingsPage) {
        return NextResponse.next()
      }

      // For post-update missing settings, only allow admin access
      if (isPostUpdateMode && !isAdmin) {
        if (pathname !== '/') {
          return NextResponse.redirect(
            new URL('/', process.env.NEXT_PUBLIC_SITE_URL),
          )
        }

        return NextResponse.next()
      }

      // Handle redirects for missing settings
      let redirectPage = getSettingsPage(missingSetting)

      if (missingSetting.startsWith('connection')) {
        redirectPage = getSettingsPage('connection')
      }

      if (
        redirectPage &&
        pathname !== redirectPage &&
        !pathname.includes('settings')
      ) {
        return NextResponse.redirect(
          new URL(redirectPage, process.env.NEXT_PUBLIC_SITE_URL),
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
)

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

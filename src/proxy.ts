import { Settings } from '@/types/settings'
import { decode } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { recheckServerUser } from './lib/auth'
import { createNonce, getContentSecurityPolicy } from './utils/csp'
import getSettings from './utils/getSettings'
import {
  checkRequiredSettings,
  getSettingsPage,
  isInitialSetup,
  isPostUpdateMissingSettings,
} from './utils/helpers'

// The proxy runs on the Node.js runtime, so it reads the settings file
// directly instead of going through an HTTP round trip.
function readSettings(): Settings | null {
  try {
    return getSettings()
  } catch (error) {
    console.error('[PROXY] - Failed to read settings!', error)

    return null
  }
}

// Next.js reads the nonce from the request's CSP header and adds it to the
// scripts it renders, so the request and the response carry the same policy.
function nextWithCsp(req: NextRequest): NextResponse {
  const nonce = createNonce()
  const policy = getContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === 'development',
  )
  const headers = new Headers(req.headers)

  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', policy)

  const response = NextResponse.next({ request: { headers } })

  response.headers.set('Content-Security-Policy', policy)

  return response
}

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl
    const settings = readSettings()
    const missingSetting = settings ? checkRequiredSettings(settings) : null

    if (missingSetting && settings) {
      const isSettingsPage = pathname.includes('settings')
      const isAdmin = req.nextauth?.token?.isAdmin
      const isInitialSetupMode = isInitialSetup(settings)
      const isPostUpdateMode = isPostUpdateMissingSettings(settings)

      // During initial setup, allow access to settings pages for any user (including unauthenticated)
      if (isInitialSetupMode && isSettingsPage) {
        return nextWithCsp(req)
      }

      // For post-update missing settings, only allow admin access
      if (isPostUpdateMode && !isAdmin) {
        if (pathname !== '/') {
          return NextResponse.redirect(new URL('/', req.nextUrl))
        }

        return nextWithCsp(req)
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
        return NextResponse.redirect(new URL(redirectPage, req.nextUrl))
      }
    }

    return nextWithCsp(req)
  },
  {
    callbacks: {
      authorized: () => true,
    },
    // withAuth only decodes the cookie, so the token gets the same re-check as
    // getServerSession. A removed user's re-check throws, which leaves no token.
    jwt: {
      decode: async (params) => {
        const token = await decode(params)

        return token && recheckServerUser(token)
      },
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
     * - files with an extension (sw.js, manifest.json, images, ...)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
}

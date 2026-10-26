import { Settings } from '@/types/settings'
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
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
        return NextResponse.next()
      }

      // For post-update missing settings, only allow admin access
      if (isPostUpdateMode && !isAdmin) {
        if (pathname !== '/') {
          return NextResponse.redirect(new URL('/', req.nextUrl))
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
        return NextResponse.redirect(new URL(redirectPage, req.nextUrl))
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
     * - files with an extension (sw.js, manifest.json, images, ...)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)',
  ],
}

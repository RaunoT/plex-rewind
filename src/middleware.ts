import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import {
  getSettingsPage,
  isInitialSetup,
  isPostUpdateMissingSettings,
} from './utils/helpers'

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const settingsRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/settings`,
    )
    const settings = settingsRes.ok ? await settingsRes.json() : null
    const missingSettingRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/missing-setting`,
    )

    if (missingSettingRes.ok && settings) {
      const missingSetting = await missingSettingRes.json()

      if (missingSetting) {
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

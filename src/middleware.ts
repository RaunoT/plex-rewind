import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import getSettings from './utils/getSettings'
import {
  getSettingsPage,
  isInitialSetup,
  isPostUpdateMissingSettings,
} from './utils/helpers'

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const settings = getSettings()
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/missing-setting`,
    )

    if (res.ok) {
      const missingSetting = await res.json()

      if (missingSetting) {
        const isSettingsPage = pathname.includes('settings')
        const isAdmin = req.nextauth?.token?.isAdmin
        const isInitialSetupMode = isInitialSetup(settings)
        const isPostUpdateMode = isPostUpdateMissingSettings(settings)

        // During initial setup, allow access to settings pages regardless of admin status
        if (isInitialSetupMode && !isAdmin && isSettingsPage) {
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

        if (isAdmin) {
          // Admin users can access settings and get redirected to the appropriate settings page
          let redirectPage = getSettingsPage(missingSetting)

          if (missingSetting.startsWith('connection')) {
            redirectPage = getSettingsPage('connection')

            if (pathname !== redirectPage && redirectPage) {
              return NextResponse.redirect(
                new URL(redirectPage, process.env.NEXT_PUBLIC_SITE_URL),
              )
            }
          } else {
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
        } else {
          // Non-admin users with missing settings should be redirected to home
          if (pathname !== '/') {
            return NextResponse.redirect(
              new URL('/', process.env.NEXT_PUBLIC_SITE_URL),
            )
          }
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

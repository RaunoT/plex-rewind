import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { getSettingsPage } from './utils/helpers'

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/missing-setting`,
    )

    if (res.ok) {
      const missingSetting = await res.json()

      if (missingSetting) {
        if (
          req.nextauth?.token?.isAdmin ||
          missingSetting === 'connection.tautulliUrl' ||
          missingSetting === 'connection.tautulliApiKey'
        ) {
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

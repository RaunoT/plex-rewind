import { authOptions } from '@/lib/auth'
import '@/styles/globals.css'
import {
  ACTIVITY_DETAILS_COOKIE_NAME,
  APP_NAME,
  getSiteUrl,
  META_DESCRIPTION,
} from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import {
  canViewFeature,
  checkRequiredSettings,
  getViewer,
  sortByActiveLibraries,
} from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { getReachableLibraries } from '@/utils/statsSource'
import { SerwistProvider } from '@serwist/next/react'
import { Metadata, Viewport } from 'next'
import { getServerSession } from 'next-auth'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { ReactNode } from 'react'
import AppProvider from './_components/AppProvider'
import GoogleAnalytics from './_components/GoogleAnalytics'
import SessionProviderWrapper from './_components/SessionProvider'

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings()
  const serverName = settings.general.serverName
  const baseTitle = serverName ? `${serverName}` : APP_NAME
  const titleTemplate = serverName ? `%s | ${serverName}` : `%s | ${APP_NAME}`

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: baseTitle,
    title: {
      default: baseTitle,
      template: titleTemplate,
    },
    description: META_DESCRIPTION,
    manifest: '/manifest.json',
    appleWebApp: {
      title: baseTitle,
      statusBarStyle: 'black',
    },
    openGraph: {
      type: 'website',
      siteName: baseTitle,
      title: {
        default: baseTitle,
        template: titleTemplate,
      },
      description: META_DESCRIPTION,
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: baseTitle,
        template: titleTemplate,
      },
      description: META_DESCRIPTION,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#000000',
}

type Props = {
  children: ReactNode
}

export default async function RootLayout({ children }: Props) {
  const settings = getSettings()
  const version = await getVersion()
  const locale = await getLocale()
  const missingSetting = checkRequiredSettings(settings)
  const session = await getServerSession(authOptions)
  // Set by the proxy. Reading it also keeps every page dynamically rendered,
  // which the nonce needs: a static page would have none.
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const detailsCookie = (await cookies()).get(
    ACTIVITY_DETAILS_COOKIE_NAME,
  )?.value
  // For the sidebar, which lists the libraries only while the dashboard is on.
  // Not awaited, so a slow source doesn't hold up every page.
  const libraries =
    !missingSetting && canViewFeature(settings, 'dashboard', getViewer(session))
      ? getReachableLibraries().then(
          (libraries) =>
            libraries && sortByActiveLibraries(libraries, settings),
        )
      : Promise.resolve([])

  return (
    <html lang={locale}>
      <body className='h-full min-h-dvh bg-black text-white'>
        <SerwistProvider
          swUrl='/sw.js'
          disable={process.env.NODE_ENV === 'development'}
        >
          <NextIntlClientProvider>
            {settings.general.googleAnalyticsId && (
              <GoogleAnalytics
                id={settings.general.googleAnalyticsId}
                isSignedIn={!!session}
                nonce={nonce}
              />
            )}
            <SessionProviderWrapper session={session}>
              <AppProvider
                missingSetting={missingSetting}
                version={version}
                libraries={libraries}
                settings={toPublicSettings(settings)}
                canBrowse={!!session || settings.general.isOutsideAccess}
                isActivityDetailsHidden={
                  detailsCookie ? detailsCookie !== 'shown' : undefined
                }
              >
                {children}
              </AppProvider>
            </SessionProviderWrapper>
          </NextIntlClientProvider>
        </SerwistProvider>
      </body>
    </html>
  )
}

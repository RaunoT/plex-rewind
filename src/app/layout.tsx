import { authOptions } from '@/lib/auth'
import '@/styles/globals.css'
import { APP_URL, META_DESCRIPTION } from '@/utils/constants'
import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import { checkRequiredSettings, sortByActiveLibraries } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { SerwistProvider } from '@serwist/next/react'
import { Metadata, Viewport } from 'next'
import { getServerSession } from 'next-auth'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { PublicEnvScript } from 'next-runtime-env'
import { ReactNode } from 'react'
import AppProvider from './_components/AppProvider'
import GoogleAnalytics from './_components/GoogleAnalytics'
import SessionProviderWrapper from './_components/SessionProvider'

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings()
  const serverName = settings.general.serverName
  const baseTitle = serverName ? `${serverName}` : 'Plex Rewind'
  const titleTemplate = serverName ? `%s | ${serverName}` : '%s | Plex Rewind'

  return {
    metadataBase: new URL(APP_URL),
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
  themeColor: '#262626',
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
  // For the sidebar, which lists the libraries a visitor can open
  const libraries =
    !missingSetting && (session || settings.general.isOutsideAccess)
      ? sortByActiveLibraries(await getLibraries(), settings)
      : []

  return (
    <html lang={locale}>
      <head>
        <PublicEnvScript />
      </head>
      <body className='h-full min-h-dvh bg-black text-white'>
        <SerwistProvider
          swUrl='/sw.js'
          disable={process.env.NODE_ENV === 'development'}
        >
          <NextIntlClientProvider>
            {settings.general.googleAnalyticsId && (
              <GoogleAnalytics id={settings.general.googleAnalyticsId} />
            )}
            <SessionProviderWrapper session={session}>
              <AppProvider
                missingSetting={missingSetting}
                version={version}
                libraries={libraries}
                settings={toPublicSettings(settings)}
                canBrowse={!!session || settings.general.isOutsideAccess}
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

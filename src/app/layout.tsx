import '@/styles/globals.css'
import { APP_URL, META_DESCRIPTION } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import { Metadata, Viewport } from 'next'
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
  const baseTitle = serverName ? `${serverName} Rewind` : 'Plex Rewind'
  const titleTemplate = serverName
    ? `%s | ${serverName} Rewind`
    : '%s | Plex Rewind'

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
      card: 'summary',
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

  return (
    <html lang={locale}>
      <head>
        <PublicEnvScript />
      </head>
      <body className='h-full min-h-dvh bg-black text-white'>
        <NextIntlClientProvider>
          {settings.general.googleAnalyticsId && (
            <GoogleAnalytics id={settings.general.googleAnalyticsId} />
          )}
          <SessionProviderWrapper>
            <AppProvider settings={settings} version={version}>
              {children}
            </AppProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

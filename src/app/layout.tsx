import '@/styles/globals.css'
import {
  APP_URL,
  META_DESCRIPTION,
  META_TITLE,
  META_TITLE_TEMPLATE,
} from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { PublicEnvScript } from 'next-runtime-env'
import { ReactNode } from 'react'
import AppProvider from './_components/AppProvider'
import GoogleAnalytics from './_components/GoogleAnalytics'
import SessionProviderWrapper from './_components/SessionProvider'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: META_TITLE,
  title: {
    default: META_TITLE,
    template: META_TITLE_TEMPLATE,
  },
  description: META_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    title: META_TITLE,
    statusBarStyle: 'black',
  },
  openGraph: {
    type: 'website',
    siteName: META_TITLE,
    title: {
      default: META_TITLE,
      template: META_TITLE_TEMPLATE,
    },
    description: META_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: META_TITLE,
      template: META_TITLE_TEMPLATE,
    },
    description: META_DESCRIPTION,
  },
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
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <PublicEnvScript />
      </head>
      <body className='h-full min-h-dvh bg-black text-white'>
        <NextIntlClientProvider messages={messages}>
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

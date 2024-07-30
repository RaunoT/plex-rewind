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
    capable: true,
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

  return (
    <html lang='en'>
      <head>
        <PublicEnvScript />
      </head>
      <body className='h-full min-h-dvh bg-black text-white'>
        {settings.features.googleAnalyticsId && (
          <GoogleAnalytics id={settings.features.googleAnalyticsId} />
        )}
        <SessionProviderWrapper>
          <AppProvider settings={settings} version={version}>
            {children}
          </AppProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}

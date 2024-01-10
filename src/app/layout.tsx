import '@/styles/globals.css'
import { googleAnalyticsId } from '@/utils/config'
import {
  META_DESCRIPTION,
  META_TITLE,
  META_TITLE_TEMPLATE,
} from '@/utils/constants'
import { Metadata, Viewport } from 'next'
import AppProvider from '../components/AppProvider'
import GoogleAnalytics from '../components/GoogleAnalytics'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || ''),
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
    statusBarStyle: 'default',
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
  themeColor: '#171717',
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang='en'>
      <body className='min-h-dvh bg-black text-white'>
        {googleAnalyticsId && <GoogleAnalytics id={googleAnalyticsId} />}

        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}

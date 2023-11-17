import '@/styles/globals.css'
import { metaDescription } from '@/utils/constants'
import { Metadata, Viewport } from 'next'
import GoogleAnalytics from './_components/GoogleAnalytics'
import Wrapper from './_components/Wrapper'

export const metadata: Metadata = {
  title: 'Plex rewind',
  description: metaDescription,
}

export const viewport: Viewport = {
  themeColor: '#312e81',
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang='en'>
      <body className='min-height-screen bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900 text-white'>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}

        <Wrapper>{children}</Wrapper>
      </body>
    </html>
  )
}

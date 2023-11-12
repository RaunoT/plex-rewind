import GoogleAnalytics from '@/components/GoogleAnalytics'
import '@/styles/globals.css'
import { Viewport } from 'next'
import Wrapper from './wrapper'

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

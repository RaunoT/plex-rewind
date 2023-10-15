import '@/styles/globals.css'
import Wrapper from './wrapper'

export const metadata = {
  themeColor: '#312e81',
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang='en'>
      <body className='text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900 min-height-screen'>
        <Wrapper>{children}</Wrapper>
      </body>
    </html>
  )
}
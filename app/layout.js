// FIXME: Remove this
'use client'

import { usePathname } from 'next/navigation'
import '../styles/globals.css'
import cx from 'classnames'

export default function RootLayout({ children }) {
  const pathname = usePathname()

  return (
    <html>
      <head />
      <body className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900">
        <main
          className={cx(
            'container flex flex-col items-center justify-center py-8',
            // TODO: Pretty sure we can one-line this
            { 'min-h-screen': pathname === '/' },
            { 'sm:min-h-screen': pathname !== '/' },
          )}
        >
          {children}
        </main>
      </body>
    </html>
  )
}

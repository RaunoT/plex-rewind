'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import '../styles/globals.css'

export default function RootLayout({ children }) {
  const pathname = usePathname()

  return (
    <html>
      <head />
      <body className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900">
        <main
          className={clsx(
            'container flex flex-col items-center justify-center py-8',
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

'use client'

import { Analytics } from '@vercel/analytics/react'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { createContext, useState } from 'react'
import '../styles/globals.css'

export const CardContext = createContext()

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const [prevPage, setPrevPage] = useState('')
  const [nextPage, setNextPage] = useState('')

  return (
    <html>
      <head />
      <CardContext.Provider
        value={{
          prevPageState: [prevPage, setPrevPage],
          nextPageState: [nextPage, setNextPage],
        }}
      >
        <body className="text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900 min-height-screen">
          <main
            className={clsx(
              'flex flex-col items-center px-4 py-8 overflow-x-hidden min-height-screen sm:justify-center',
              { 'justify-center': pathname === '/' },
            )}
          >
            {children}
          </main>

          <Analytics />
        </body>
      </CardContext.Provider>
    </html>
  )
}

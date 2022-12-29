'use client'

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
        <body className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-neutral-800 to-neutral-900">
          <main
            className={clsx(
              'container flex flex-col items-center justify-center py-8 overflow-x-hidden',
              { 'min-h-screen': pathname === '/' },
              { 'sm:min-h-screen': pathname !== '/' },
            )}
          >
            {children}
          </main>
        </body>
      </CardContext.Provider>
    </html>
  )
}

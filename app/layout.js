'use client'

import { createContext, useState } from 'react'
import '../styles/globals.css'

export const CardContext = createContext()

export default function RootLayout({ children }) {
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
          <main className="container flex flex-col items-center justify-center py-8 overflow-x-hidden min-height-screen">
            {children}
          </main>
        </body>
      </CardContext.Provider>
    </html>
  )
}

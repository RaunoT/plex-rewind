"use client"

import clsx from "clsx"
import { SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"

type Props = {
  children: React.ReactNode
}

export default function AppProvider({ children }: Props) {
  const pathname = usePathname()

  return (
    <SessionProvider>
      <main
        className={clsx(
          "min-height-screen flex flex-col items-center overflow-x-hidden px-4 py-8 sm:justify-center",
          { "justify-center": pathname === "/" },
        )}
      >
        {children}
      </main>
    </SessionProvider>
  )
}

'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export default function Wrapper({ children }: Props) {
  const pathname = usePathname()

  return (
    <main
      className={clsx(
        'flex flex-col items-center px-4 py-8 overflow-x-hidden min-height-screen sm:justify-center',
        { 'justify-center': pathname === '/' }
      )}
    >
      {children}
    </main>
  )
}

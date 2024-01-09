'use client'

import { CogIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { SessionProvider } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import FOG from 'vanta/dist/vanta.fog.min'

type Props = {
  children: React.ReactNode
}

export default function AppProvider({ children }: Props) {
  const pathname = usePathname()
  const [background, setBackground] = useState<VantaEffect>(null)
  const backgroundRef = useRef(null)

  useEffect(() => {
    if (!background) {
      setBackground(
        FOG({
          el: backgroundRef.current,
          THREE: THREE,
          lowlightColor: 0x16166f,
          midtoneColor: 0x211e1d,
          highlightColor: 0x0b5336,
          baseColor: 0x000000,
          blurFactor: 0.6,
          zoom: 1,
          speed: 1,
        }),
      )
    }

    return () => {
      if (background) {
        background.destroy()
      }
    }
  }, [background])

  return (
    <SessionProvider>
      <main
        className={clsx(
          'flex min-h-dvh flex-col items-center overflow-x-hidden px-4 py-8 sm:justify-center',
          { 'justify-center': pathname === '/' },
        )}
      >
        <div ref={backgroundRef} className='fixed inset-0 -z-10 h-screen' />
        <Link
          href='/settings'
          className='absolute right-3 top-3 sm:right-4 sm:top-4'
        >
          {pathname !== '/settings' && <CogIcon className='size-5 lg:size-6' />}
        </Link>

        {children}
      </main>
    </SessionProvider>
  )
}

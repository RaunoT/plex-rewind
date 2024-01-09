'use client'

import clsx from 'clsx'
import { SessionProvider } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import FOG from 'vanta/dist/vanta.fog.min'
import Settings from './Settings/Settings'

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
        <Settings />

        {children}
      </main>
    </SessionProvider>
  )
}

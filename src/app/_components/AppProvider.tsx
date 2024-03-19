'use client'

import githubSvg from '@/assets/github.svg'
import clsx from 'clsx'
import { SessionProvider } from 'next-auth/react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createContext, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import FOG from 'vanta/dist/vanta.fog.min'

type Props = {
  children: React.ReactNode
  authToken?: string
}

export const AuthTokenContext = createContext<string | undefined>(undefined)

export default function AppProvider({ children, authToken }: Props) {
  const pathname = usePathname()
  const [background, setBackground] = useState<VantaEffect>(null)
  const backgroundRef = useRef(null)

  useEffect(() => {
    if (!background) {
      setBackground(
        FOG({
          el: backgroundRef.current,
          THREE: THREE, // seems to not work properly > 0.151.3
          highlightColor: 0xb5336,
          midtoneColor: 0x211e1d,
          lowlightColor: 0x16166f,
          baseColor: 0x0,
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
        <div
          ref={backgroundRef}
          className='fixed inset-0 -z-10 h-screen after:absolute after:inset-0 after:bg-black/25 after:content-[""]'
        />
        <a href='https://github.com/RaunoT/plex-rewind' target='_blank'>
          <Image
            src={githubSvg}
            alt='GitHub'
            className='absolute right-4 top-4 size-4 sm:size-6'
          />
        </a>

        <AuthTokenContext.Provider value={authToken}>
          {children}
        </AuthTokenContext.Provider>
      </main>
    </SessionProvider>
  )
}

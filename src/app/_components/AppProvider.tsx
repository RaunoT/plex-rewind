'use client'

import githubSvg from '@/assets/github.svg'
import clsx from 'clsx'
import { SessionProvider } from 'next-auth/react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three/build/three.module.js'
import FOG from 'vanta/dist/vanta.fog.min'

type Props = {
  children: React.ReactNode
}

export default function AppProvider({ children }: Props) {
  const pathname = usePathname()
  const [background, setBackground] = useState(0)
  const backgroundRef = useRef(null)

  useEffect(() => {
    if (!background) {
      setBackground(
        FOG({
          el: backgroundRef.current,
          THREE: THREE,
          highlightColor: 0xb5336,
          midtoneColor: 0x211e1d,
          lowlightColor: 0x16166f,
          baseColor: 0x0,
          speed: 0.5,
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
      <main ref={backgroundRef}>
        <div
          className={clsx(
            'flex min-h-dvh flex-col items-center overflow-x-hidden px-4 py-8 sm:justify-center',
            { 'justify-center': pathname === '/' },
          )}
        >
          <a href='https://github.com/RaunoT/plex-rewind' target='_blank'>
            <Image
              src={githubSvg}
              alt='GitHub'
              className='absolute right-4 top-4 size-4 lg:size-6'
            />
          </a>

          {children}
        </div>
      </main>
    </SessionProvider>
  )
}

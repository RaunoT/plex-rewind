'use client'

import { Settings, Version } from '@/types'
import {
  ArrowPathIcon,
  CogIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect, usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import stars from '../_assets/stars.png'

type Props = {
  children: ReactNode
  settings: Settings
  version: Version
}

export default function AppProvider({ children, settings, version }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isSettings, setIsSettings] = useState(pathname.startsWith('/settings'))

  useEffect(() => {
    setIsSettings(pathname.startsWith('/settings'))
  }, [pathname])

  if (!settings.test && pathname !== '/settings/connection') {
    redirect('/settings/connection')
  }

  return (
    <main
      className={clsx(
        'flex h-full min-h-dvh flex-col items-center overflow-x-hidden px-4 py-8 sm:justify-center',
        { 'justify-center': pathname === '/' },
      )}
    >
      <div className='fixed inset-0 -z-10 select-none overflow-hidden bg-black after:absolute after:inset-0 after:bg-black/50 after:content-[""]'>
        <div className='relative h-screen w-screen'>
          <Image
            src={stars}
            alt='Stars background layer'
            className='object-cover'
            fill
            priority
          />
        </div>
        <div className='bg-twinkling' />
        <div className='bg-clouds sm:opacity-50' />
      </div>

      <div className='absolute right-3 top-3 flex items-center gap-3 sm:right-4 sm:top-4'>
        {version.hasUpdate && session?.user?.isAdmin && (
          <a
            href='https://github.com/RaunoT/plex-rewind/releases'
            aria-label='Update available'
            target='_blank'
            className='link-light'
          >
            <ArrowPathIcon className='size-6' />
          </a>
        )}
        {settings.test && session?.user?.isAdmin && (
          <Link
            href={isSettings ? '/' : '/settings/features'}
            aria-label={isSettings ? 'Close settings' : 'Open settings'}
            className='link-light'
          >
            {isSettings ? (
              <XCircleIcon className='size-6' />
            ) : (
              <CogIcon className='size-6' />
            )}
          </Link>
        )}
      </div>

      {children}
    </main>
  )
}

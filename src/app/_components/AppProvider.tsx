'use client'

import { Settings } from '@/types'
import { CogIcon, XCircleIcon } from '@heroicons/react/24/outline'
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
}

export default function AppProvider({ children, settings }: Props) {
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
      <div className='fixed inset-0 -z-10 overflow-hidden bg-black after:absolute after:inset-0 after:bg-black/50 after:content-[""]'>
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

      {settings.test && session?.user?.isAdmin && (
        <Link
          href={isSettings ? '/' : '/settings/features'}
          className='absolute right-3 top-3 sm:right-4 sm:top-4'
          aria-label={isSettings ? 'Close settings' : 'Open settings'}
        >
          {isSettings ? (
            <XCircleIcon className='size-5 lg:size-6' />
          ) : (
            <CogIcon className='size-5 lg:size-6' />
          )}
        </Link>
      )}

      {children}
    </main>
  )
}

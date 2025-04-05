'use client'

import { Version } from '@/types'
import { Settings } from '@/types/settings'
import { checkRequiredSettings } from '@/utils/helpers'
import {
  ArrowPathIcon,
  CogIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import stars from '../_assets/stars.png'
import GlobalContextProvider from './GlobalContextProvider'
import LocaleSelect from './LocaleSelect'

type Props = {
  children: ReactNode
  settings: Settings
  version: Version
}

export default function AppProvider({ children, settings, version }: Props) {
  const pathname = usePathname()
  const missingSetting = checkRequiredSettings(settings)
  const { data: session } = useSession()
  const [isSettings, setIsSettings] = useState<boolean>(
    pathname.startsWith('/settings'),
  )
  const [settingsLink, setSettingsLink] = useState<string>('/settings/general')
  const t = useTranslations('AppProvider')

  useEffect(() => {
    switch (true) {
      case pathname.startsWith('/dashboard'):
        setSettingsLink('/settings/dashboard')
        break
      case pathname.startsWith('/rewind'):
        setSettingsLink('/settings/rewind')
        break
      default:
        setSettingsLink('/settings/general')
        break
    }

    setIsSettings(pathname.startsWith('/settings'))
  }, [pathname])

  return (
    <GlobalContextProvider>
      <main
        className={clsx(
          'flex h-full min-h-dvh flex-col items-center overflow-x-hidden px-4 py-8 sm:justify-center',
          { 'justify-center': pathname === '/' || pathname === '/~offline' },
        )}
      >
        <div className='fixed inset-0 -z-10 select-none overflow-hidden bg-black after:absolute after:inset-0 after:bg-black/50 after:content-[""]'>
          <div className='relative h-screen w-screen'>
            <Image
              src={stars}
              alt={t('starsAlt')}
              className='object-cover'
              fill
              priority
            />
          </div>
          <div className='bg-twinkling' />
          <div className='bg-clouds sm:opacity-50' />
        </div>

        <div className='absolute right-3 top-3 flex items-center gap-3 sm:right-4 sm:top-4'>
          {version.hasUpdate && session?.user.isAdmin && (
            <a
              href='https://github.com/RaunoT/plex-rewind/releases'
              aria-label={t('updateAvailable')}
              target='_blank'
              className='link-light'
            >
              <ArrowPathIcon className='size-6' />
            </a>
          )}
          {!missingSetting && session?.user.isAdmin && (
            <Link
              href={isSettings ? '/' : settingsLink}
              aria-label={isSettings ? t('closeSettings') : t('openSettings')}
              className='link-light'
            >
              {isSettings ? (
                <XCircleIcon className='size-6' />
              ) : (
                <CogIcon className='size-6' />
              )}
            </Link>
          )}
          <LocaleSelect />
        </div>

        {children}
      </main>
    </GlobalContextProvider>
  )
}

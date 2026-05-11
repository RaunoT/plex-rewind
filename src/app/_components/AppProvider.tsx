'use client'

import { Version } from '@/types'
import { Settings } from '@/types/settings'
import { checkRequiredSettings } from '@/utils/helpers'
import {
  ArrowPathIcon,
  CogIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import stars from '../_assets/stars.png'
import GlobalContextProvider from './GlobalContextProvider'
import LocaleSelect from './LocaleSelect'

type Props = {
  children: ReactNode
  settings: Settings
  version: Version
}

const queryClient = new QueryClient()

export default function AppProvider({ children, settings, version }: Props) {
  const pathname = usePathname()
  const missingSetting = checkRequiredSettings(settings)
  const { data: session, status } = useSession()
  const t = useTranslations('AppProvider')
  const isSettings = pathname.startsWith('/settings')
  const settingsLink = pathname.startsWith('/dashboard')
    ? '/settings/dashboard'
    : pathname.startsWith('/rewind')
      ? '/settings/rewind'
      : pathname.startsWith('/activity')
        ? '/settings/activity'
        : '/settings/general'

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalContextProvider>
        <main
          className={clsx(
            'flex h-full min-h-dvh flex-col items-center overflow-x-hidden px-4 pt-10 pb-8 sm:justify-center sm:pt-8',
            { 'justify-center': pathname === '/' || pathname === '/~offline' },
          )}
        >
          <div className='fixed inset-0 -z-10 overflow-hidden bg-black select-none after:absolute after:inset-0 after:bg-black/50 after:content-[""]'>
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

          <div className='absolute top-3 right-3 flex items-center gap-3 sm:top-4 sm:right-4'>
            {version.hasUpdate &&
              status === 'authenticated' &&
              session?.user.isAdmin && (
                <a
                  href='https://github.com/RaunoT/plex-rewind/releases'
                  aria-label={t('updateAvailable')}
                  target='_blank'
                  className='link-light'
                >
                  <ArrowPathIcon className='size-6' />
                </a>
              )}
            {!missingSetting &&
              status === 'authenticated' &&
              session?.user.isAdmin && (
                <Link
                  href={isSettings ? '/' : settingsLink}
                  aria-label={
                    isSettings ? t('closeSettings') : t('openSettings')
                  }
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
    </QueryClientProvider>
  )
}

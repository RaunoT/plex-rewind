'use client'

import { Version } from '@/types'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { checkRequiredSettings } from '@/utils/helpers'
import {
  ArrowPathIcon,
  CogIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, ReactNode, useEffect, useState } from 'react'
import stars from '../_assets/stars.png'

type GlobalContextProps = {
  isDashboardPersonal: boolean
  setIsDashboardPersonal: (isDashboardPersonal: boolean) => void
  period: DashboardSearchParams['period']
  setPeriod: (period: DashboardSearchParams['period']) => void
}

export const GlobalContext = createContext<GlobalContextProps>({
  isDashboardPersonal: false,
  setIsDashboardPersonal: () => {},
  period: 'custom',
  setPeriod: () => {},
})

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
  const [isDashboardPersonal, setIsDashboardPersonal] = useState<boolean>(
    () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('dashboardPersonal') === 'true'
      }

      return false
    },
  )
  const [period, setPeriod] = useState<DashboardSearchParams['period']>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(
        'dashboardPeriod',
      ) as DashboardSearchParams['period']
    }

    return undefined
  })

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

  useEffect(() => {
    localStorage.setItem('dashboardPersonal', isDashboardPersonal.toString())
  }, [isDashboardPersonal])

  useEffect(() => {
    localStorage.setItem('dashboardPeriod', period || '')
  }, [period])

  return (
    <GlobalContext.Provider
      value={{
        isDashboardPersonal,
        setIsDashboardPersonal,
        period,
        setPeriod,
      }}
    >
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
          {!missingSetting && session?.user?.isAdmin && (
            <Link
              href={isSettings ? '/' : settingsLink}
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
    </GlobalContext.Provider>
  )
}

'use client'

import { Version } from '@/types'
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext } from 'react'
import AccountMenu from './AccountMenu'

type AppInfo = {
  missingSetting: string | null
  version: Version
}

export const AppInfoContext = createContext<AppInfo>({
  missingSetting: null,
  version: {
    hasUpdate: false,
    latestVersion: '',
    currentVersion: '',
    channel: 'stable',
  },
})

type Props = {
  className?: string
}

// Opens the settings for the section being viewed
export function getSettingsLink(pathname: string) {
  return pathname.startsWith('/dashboard')
    ? '/settings/dashboard'
    : pathname.startsWith('/rewind')
      ? '/settings/rewind'
      : pathname.startsWith('/activity')
        ? '/settings/activity'
        : '/settings/general'
}

export default function HeaderControls({ className }: Props) {
  const { missingSetting, version } = useContext(AppInfoContext)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const t = useTranslations('AppProvider')
  const isAdmin = status === 'authenticated' && session?.user.isAdmin
  const isSettings = pathname.startsWith('/settings')

  return (
    <div className={clsx('icon-button-group', className)}>
      {version.hasUpdate && isAdmin && (
        <a
          href='https://github.com/RaunoT/plex-rewind/releases'
          aria-label={t('updateAvailable')}
          target='_blank'
          className='icon-button'
        >
          <ArrowPathIcon className='size-5' />
        </a>
      )}
      {!missingSetting && isAdmin && (
        <Link
          href={isSettings ? '/' : getSettingsLink(pathname)}
          aria-label={isSettings ? t('closeSettings') : t('openSettings')}
          className='icon-button'
        >
          {isSettings ? (
            <XMarkIcon className='size-5' />
          ) : (
            <Cog6ToothIcon className='size-5' />
          )}
        </Link>
      )}
      <AccountMenu isCompact />
    </div>
  )
}

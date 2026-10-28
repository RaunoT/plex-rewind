'use client'

import { Version } from '@/types'
import { SETTINGS_HREF } from '@/utils/constants'
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
import { createContext, useContext, useEffect, useState } from 'react'
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

// The last page outside settings, where closing the settings goes back to
export const SETTINGS_RETURN_KEY = 'settingsReturnTo'

function getSettingsReturn() {
  try {
    const path = sessionStorage.getItem(SETTINGS_RETURN_KEY)

    // Only a path on this site
    return path?.startsWith('/') && !path.startsWith('//') ? path : '/'
  } catch {
    return '/'
  }
}

export default function HeaderControls({ className }: Props) {
  const { missingSetting, version } = useContext(AppInfoContext)
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const t = useTranslations('AppProvider')
  const isAdmin = status === 'authenticated' && session?.user.isAdmin
  const isSettings = pathname.startsWith('/settings')
  const [settingsReturn, setSettingsReturn] = useState('/')

  useEffect(() => {
    if (isSettings) {
      // Read after mount so the first client render matches the server HTML
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettingsReturn(getSettingsReturn())
    }
  }, [isSettings])

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
          href={isSettings ? settingsReturn : SETTINGS_HREF}
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

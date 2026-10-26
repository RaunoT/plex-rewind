'use client'

import { PublicSettings } from '@/types/settings'
import { SETTINGS_PAGES } from '@/utils/constants'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  settings: PublicSettings
  missingSetting: string | null
}

export default function SettingsNav({ settings, missingSetting }: Props) {
  const pathname = usePathname()
  const t = useTranslations('Settings.Nav')

  return (
    <nav className='mb-3' aria-label={t('label')}>
      <ul className='nav'>
        {SETTINGS_PAGES.map(({ href, key }) => {
          const isComplete =
            settings[key as keyof Omit<PublicSettings, 'setupComplete'>]
              .complete
          const isConnectionIncomplete = !settings.connection.complete
          const shouldDisable = isConnectionIncomplete && key !== 'connection'

          return (
            <li key={key}>
              <Link
                href={href}
                className={clsx(
                  'nav-link',
                  missingSetting &&
                    (isComplete ? 'text-green-600!' : 'text-red-500!'),
                  missingSetting && 'hover:opacity-80!',
                  missingSetting && pathname === href && 'opacity-80',
                )}
                aria-current={pathname === href && 'page'}
                aria-disabled={shouldDisable && 'true'}
              >
                {missingSetting &&
                  (isComplete ? (
                    <CheckCircleIcon className='mr-1 inline size-4 align-text-bottom' />
                  ) : (
                    <ExclamationCircleIcon className='mr-1 inline size-4 align-text-bottom' />
                  ))}
                {t(key)}
                {missingSetting && (
                  <span className='sr-only'>
                    {' '}
                    {isComplete ? t('complete') : t('incomplete')}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

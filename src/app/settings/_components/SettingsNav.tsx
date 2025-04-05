'use client'

import { Settings } from '@/types/settings'
import { SETTINGS_PAGES } from '@/utils/constants'
import { checkRequiredSettings } from '@/utils/helpers'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  settings: Settings
}

export default function SettingsNav({ settings }: Props) {
  const pathname = usePathname()
  const missingSetting = checkRequiredSettings(settings)
  const t = useTranslations('Settings.Nav')

  return (
    <nav className='mb-3' aria-label={t('label')}>
      <ul className='nav'>
        {SETTINGS_PAGES.map(({ href, key }) => {
          const isComplete = settings[key as keyof Settings].complete
          const isConnectionIncomplete = !settings.connection.complete
          const shouldDisable = isConnectionIncomplete && key !== 'connection'

          return (
            <li key={key}>
              <Link
                href={href}
                className={clsx(
                  'nav-link',
                  missingSetting &&
                    (isComplete ? '!text-green-600' : '!text-red-500'),
                  missingSetting && 'hover:!opacity-80',
                  missingSetting && pathname === href && 'opacity-80',
                )}
                aria-current={pathname === href && 'page'}
                aria-disabled={shouldDisable && 'true'}
              >
                {t(key)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

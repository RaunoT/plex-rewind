'use client'

import TitleMenu from '@/components/TitleMenu'
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
  isMenu?: boolean
}

export default function SettingsNav({
  settings,
  missingSetting,
  isMenu,
}: Props) {
  const pathname = usePathname()
  const t = useTranslations('Settings.Nav')

  if (isMenu) {
    return (
      <TitleMenu
        label={t('label')}
        items={SETTINGS_PAGES.map(({ href, key }) => {
          const isComplete =
            settings[key as keyof Omit<PublicSettings, 'setupComplete'>]
              .complete

          return {
            href,
            label: t(key),
            isCurrent: pathname === href,
            isDisabled: !settings.connection.complete && key !== 'connection',
            icon:
              missingSetting &&
              (isComplete ? (
                <CheckCircleIcon className='size-4! text-green-400!' />
              ) : (
                <ExclamationCircleIcon className='size-4! text-red-400!' />
              )),
          }
        })}
      />
    )
  }

  return (
    <nav aria-label={t('label')}>
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
                    (isComplete ? 'text-green-400!' : 'text-red-400!'),
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

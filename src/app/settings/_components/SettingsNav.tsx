'use client'

import { Settings } from '@/types/settings'
import { SETTINGS_PAGES } from '@/utils/constants'
import { checkRequiredSettings } from '@/utils/helpers'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  settings: Settings
}

export default function SettingsNav({ settings }: Props) {
  const pathname = usePathname()
  const missingSetting = checkRequiredSettings(settings)

  return (
    <nav className='mb-3'>
      <h2 className='sr-only'>Settings navigation</h2>
      <ul className='nav'>
        {SETTINGS_PAGES.map(({ href, label, key }) => {
          const isComplete = settings[key as keyof Settings].complete
          const isConnectionIncomplete = !settings.connection.complete
          const shouldDisable = isConnectionIncomplete && key !== 'connection'

          return (
            <li key={key}>
              <Link
                href={href}
                className={clsx('nav-link', {
                  'text-green-600': isComplete && missingSetting,
                })}
                aria-current={pathname === href && 'page'}
                aria-disabled={shouldDisable && 'true'}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

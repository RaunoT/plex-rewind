'use client'

import { Settings } from '@/types/settings'
import { SETTINGS_PAGES } from '@/utils/constants'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  settings: Settings
}

export default function SetupNav({ settings }: Props) {
  const pathname = usePathname()
  const settingKey = pathname.split('/')[2] as keyof Settings
  const allowContinue = settings[settingKey].complete

  return (
    <nav>
      <ul className='mt-4 flex flex-wrap justify-center gap-3'>
        {SETTINGS_PAGES.map((href, index) => {
          const isCurrentPage = pathname === href
          const isNextPage = SETTINGS_PAGES.indexOf(pathname) === index - 1
          const isComplete =
            settings[SETTINGS_PAGES[index].split('/')[2] as keyof Settings]
              .complete

          return (
            <li key={index}>
              <Link
                className={clsx(
                  'flex size-8 items-center justify-center rounded-full border aria-disabled:pointer-events-none aria-disabled:opacity-50',
                  isComplete ? 'border-green-600' : 'border-neutral-500',
                )}
                href={href}
                aria-disabled={
                  !isCurrentPage && (!allowContinue || !isNextPage)
                }
                aria-current={isCurrentPage && 'page'}
              >
                {index + 1}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

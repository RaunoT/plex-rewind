'use client'

import TitleMenu from '@/components/TitleMenu'
import { PublicSettings } from '@/types/settings'
import { SETTINGS_PAGES } from '@/utils/constants'
import { isSettingsPageLocked } from '@/utils/helpers'
import { CheckCircleIcon } from '@heroicons/react/16/solid'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId } from 'react'

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
  const hintId = useId()
  const hasLockedPages = SETTINGS_PAGES.some(({ key }) =>
    isSettingsPageLocked(key, settings),
  )

  if (isMenu) {
    return (
      <TitleMenu
        label={t('label')}
        items={SETTINGS_PAGES.map(({ href, key }, index) => {
          const isComplete =
            settings[key as keyof Omit<PublicSettings, 'setupComplete'>]
              .complete
          const isLocked = isSettingsPageLocked(key, settings)

          return {
            href,
            label: t(key),
            isCurrent: pathname === href,
            isDisabled: isLocked,
            icon: missingSetting && (
              <StepIcon step={index + 1} isComplete={isComplete} />
            ),
          }
        })}
      />
    )
  }

  return (
    <nav aria-label={t('label')}>
      <ul className='nav'>
        {SETTINGS_PAGES.map(({ href, key }, index) => {
          const isComplete =
            settings[key as keyof Omit<PublicSettings, 'setupComplete'>]
              .complete
          const isLocked = isSettingsPageLocked(key, settings)

          return (
            <li key={key}>
              <Link
                href={href}
                className='nav-link inline-flex items-center gap-1.5'
                aria-current={pathname === href && 'page'}
                // Still focusable, so screen readers can reach the reason
                aria-disabled={isLocked || undefined}
                aria-describedby={isLocked ? hintId : undefined}
                prefetch={isLocked ? false : undefined}
                onClick={isLocked ? (e) => e.preventDefault() : undefined}
              >
                {missingSetting && (
                  <StepIcon step={index + 1} isComplete={isComplete} />
                )}
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
      {hasLockedPages && (
        <p id={hintId} className='sr-only'>
          {t('connectionRequired')}
        </p>
      )}
    </nav>
  )
}

// While the setup is unfinished, the pages read as numbered steps
function StepIcon({ step, isComplete }: { step: number; isComplete: boolean }) {
  if (isComplete) {
    return <CheckCircleIcon className='size-4! shrink-0 text-green-400!' />
  }

  return (
    <span
      className='inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[0.625rem] leading-none ring-1 ring-current'
      aria-hidden
    >
      {step}
    </span>
  )
}

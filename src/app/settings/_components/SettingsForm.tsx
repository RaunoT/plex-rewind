'use client'

import { AppInfoContext } from '@/app/_components/HeaderControls'
import { SettingsFormInitialState } from '@/types/settings'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { ReactNode, useContext } from 'react'
import SettingsSaveButton from './SettingsSaveButton'

type Props = {
  children: ReactNode
  formState: SettingsFormInitialState<unknown>
  formAction: (payload: FormData) => void
  hideSubmit?: boolean
  isSetup?: boolean
}

export default function SettingsForm({
  children,
  formState,
  formAction,
  hideSubmit,
  isSetup,
}: Props) {
  const t = useTranslations('Settings')
  const { version } = useContext(AppInfoContext)

  return (
    <form className='glass-sheet' action={formAction}>
      <div className='grid gap-4'>
        {children}
        <div className='flex flex-col items-center gap-2 sm:flex-row sm:gap-4'>
          <a
            href='https://github.com/RaunoT/plex-rewind/releases'
            target='_blank'
            className='link order-last font-mono text-xs sm:order-first sm:mr-auto sm:self-end'
          >
            {version.hasUpdate
              ? `${t('updateAvailable')}: ${version.currentVersion} → ${version.latestVersion}`
              : version.currentVersion}
          </a>
          {!hideSubmit && (
            <>
              {!formState.message && isSetup && (
                <p className='text-neutral-300'>{t('initialSetup')}</p>
              )}
              <p
                aria-live='polite'
                role='status'
                className={clsx(
                  formState.status === 'success'
                    ? 'text-green-400'
                    : 'text-red-300',
                  !formState.message && 'sr-only',
                )}
              >
                {formState.message}
              </p>

              <SettingsSaveButton />
            </>
          )}
        </div>
      </div>
    </form>
  )
}

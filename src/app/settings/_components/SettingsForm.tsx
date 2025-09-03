'use client'

import { SettingsFormInitialState } from '@/types/settings'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
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

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        {children}
        {!hideSubmit && (
          <div className='flex flex-col items-center justify-end gap-2 sm:flex-row sm:gap-4'>
            {formState.message ? (
              <p
                aria-live='polite'
                role='status'
                className={
                  formState.status === 'success'
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {formState.message}
              </p>
            ) : (
              isSetup && <p className='text-neutral-400'>{t('initialSetup')}</p>
            )}

            <SettingsSaveButton />
          </div>
        )}
      </div>
    </form>
  )
}

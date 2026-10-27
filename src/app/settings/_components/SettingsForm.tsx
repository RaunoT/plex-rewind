'use client'

import { toastQueue } from '@/components/Toasts'
import { SettingsFormInitialState } from '@/types/settings'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useRef } from 'react'
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
  const toastKey = useRef<string>(null)

  // Each save returns a new state, so this runs once per save. A new result
  // replaces the last one rather than stacking up.
  useEffect(() => {
    if (!formState.message) {
      return
    }

    if (toastKey.current) {
      toastQueue.close(toastKey.current)
    }

    const isSuccess = formState.status === 'success'

    toastKey.current = toastQueue.add(
      { message: formState.message, status: isSuccess ? 'success' : 'error' },
      // Errors stay until dismissed, so they can be read
      isSuccess ? { timeout: 5000 } : undefined,
    )
  }, [formState])

  return (
    <form className='glass-sheet' action={formAction}>
      <div className='grid gap-4'>
        {children}
        {!hideSubmit && (
          <div className='flex flex-col items-center gap-2 sm:flex-row sm:justify-end sm:gap-4'>
            {isSetup && <p className='text-neutral-300'>{t('initialSetup')}</p>}
            <SettingsSaveButton />
          </div>
        )}
      </div>
    </form>
  )
}

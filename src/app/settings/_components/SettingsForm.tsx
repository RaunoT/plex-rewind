'use client'

import { SettingsFormInitialState } from '@/types/settings'
import { ReactNode } from 'react'
import SettingsSaveButton from './SettingsSaveButton'

type Props = {
  children: ReactNode
  formState: SettingsFormInitialState<unknown>
  formAction: (payload: FormData) => void
  hideSubmit?: boolean
}

export default function SettingsForm({
  children,
  formState,
  formAction,
  hideSubmit,
}: Props) {
  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        {children}
        {!hideSubmit && (
          <div className='flex flex-col items-center justify-end gap-2 sm:flex-row sm:gap-4'>
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

            <SettingsSaveButton />
          </div>
        )}
      </div>
    </form>
  )
}

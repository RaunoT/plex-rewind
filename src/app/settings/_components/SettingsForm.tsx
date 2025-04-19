'use client'

import { Settings } from '@/types/settings'
import { ReactNode, useActionState } from 'react'
import SettingsSaveButton from './SettingsSaveButton'

type Props = {
  children: ReactNode
  settings: Settings
  // TODO: define action type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
  hideSubmit?: boolean
}

export default function SettingsForm({
  children,
  settings,
  action,
  hideSubmit,
}: Props) {
  const initialState = {
    message: '',
    status: '',
    fields: settings,
  }
  const [formState, formAction] = useActionState(action, initialState)

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

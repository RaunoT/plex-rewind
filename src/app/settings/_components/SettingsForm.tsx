'use client'

import { Settings } from '@/types/settings'
import { ReactNode, useEffect, useState } from 'react'
import { useFormState } from 'react-dom'
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
  const [formState, formAction] = useFormState(action, initialState)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (formState.status === 'success') {
      setShowSuccessMessage(true)

      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setShowSuccessMessage(false)
    }
  }, [formState.status])

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        {children}
        {!hideSubmit && (
          <div className='flex flex-col items-center justify-end gap-2 sm:flex-row sm:gap-4'>
            {(showSuccessMessage || formState.status === 'error') && (
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
            )}
            <SettingsSaveButton />
          </div>
        )}
      </div>
    </form>
  )
}

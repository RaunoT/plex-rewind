'use client'

import { settings as allSettings } from '@/config/config'
import { ConnectionSettings, FeaturesSettings } from '@/types'
import Link from 'next/link'
import { ReactNode } from 'react'
import { useFormState } from 'react-dom'
import SettingsSaveButton from './SaveButton'

type Props = {
  children: ReactNode
  settings: ConnectionSettings | FeaturesSettings
  // TODO: define action type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
}

// TODO: clear form status if dirty
export default function SettingsForm({ children, settings, action }: Props) {
  const initialState = {
    message: '',
    status: '',
    fields: settings,
  }
  const [formState, formAction] = useFormState(action, initialState)

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        {children}
        <div className='mt-6 flex flex-col items-center justify-end gap-3 sm:flex-row sm:gap-4'>
          <p
            aria-live='polite'
            role='status'
            className={
              formState.status === 'success' ? 'text-green-500' : 'text-red-500'
            }
          >
            {formState.message}
          </p>

          <SettingsSaveButton />
          {allSettings.test && (
            <Link className='button button--plex' href='/'>
              Go to app
            </Link>
          )}
        </div>
      </div>
    </form>
  )
}

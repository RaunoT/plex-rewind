'use client'

import { saveConnectionSettings } from '@/actions/update-connection-settings'
import Loader from '@/components/Loader'
import { ConnectionSettings } from '@/types'
import { useFormState, useFormStatus } from 'react-dom'

type Props = {
  settings: ConnectionSettings
}

export default function ConnectionSettingsForm({ settings }: Props) {
  const initialState = {
    message: '',
    status: '',
    fields: settings,
  }
  const [formState, formAction] = useFormState(
    saveConnectionSettings,
    initialState,
  )

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://localhost:8383'
            required
            name='applicationUrl'
            defaultValue={settings?.applicationUrl || 'http://localhost:8383'}
          />
          <span className='label'>Application URL</span>
        </label>
        {/* <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='nextAuthSecret'
            required
            defaultValue={settings?.nextAuthSecret}
          />
          <span className='label'>Next Auth secret</span>
        </label> */}
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:8181'
            name='tautulliUrl'
            required
            defaultValue={settings?.tautulliUrl}
          />
          <span className='label'>Tautulli URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='tautulliApiKey'
            required
            defaultValue={settings?.tautulliApiKey}
          />
          <span className='label'>Tautulli API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:5055'
            name='overseerrUrl'
            defaultValue={settings?.overseerrUrl}
          />
          <span className='label'>Overseerr URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='overseerrApiKey'
            defaultValue={settings?.overseerrApiKey}
          />
          <span className='label'>Overseerr API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='tmdbApiKey'
            defaultValue={settings?.tmdbApiKey}
          />
          <span className='label'>TMDB API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            placeholder='localhost'
            name='plexHostname'
            required
            defaultValue={settings?.plexHostname || 'localhost'}
          />
          <span className='label'>Plex hostname</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='number'
            className='input'
            placeholder='32400'
            name='plexPort'
            required
            defaultValue={settings?.plexPort || '32400'}
          />
          <span className='label'>Plex port</span>
        </label>
      </div>

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

        <SaveButton />
      </div>
    </form>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className='button flex w-full min-w-28 justify-center sm:w-fit'
      type='submit'
      disabled={pending}
    >
      {pending ? <Loader size={6} /> : 'Save'}
    </button>
  )
}

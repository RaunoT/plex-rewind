'use client'

import { FormState, Settings } from '@/types'
import { saveConnectionSettings } from '@/utils/settings'
import { useFormState, useFormStatus } from 'react-dom'

type Props = {
  formInitialState: Settings | null
}

const initialState: FormState = {
  message: '',
  status: '',
}

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button className='button w-full sm:w-fit' type='submit' disabled={pending}>
      Save
    </button>
  )
}

export default function ConnectionSettingsForm({ formInitialState }: Props) {
  const [state, formAction] = useFormState(saveConnectionSettings, initialState)
  console.log(formInitialState)

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
          />
          <span className='label'>Application URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='nextAuthSecret'
            required
          />
          <span className='label'>Next Auth secret</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:8181'
            name='tautulliUrl'
            required
          />
          <span className='label'>Tautulli URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='tautulliApiKey'
            required
          />
          <span className='label'>Tautulli API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:5055'
            name='overseerrUrl'
            required
          />
          <span className='label'>Overseerr URL</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            name='overseerrApiKey'
            required
          />
          <span className='label'>Overseerr API key</span>
        </label>
        <label className='input-wrapper'>
          <input type='password' className='input' name='tmdbApiKey' required />
          <span className='label'>TMDB API key</span>
        </label>
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            placeholder='localhost'
            name='plexHostname'
            required
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
          />
          <span className='label'>Plex port</span>
        </label>
      </div>

      <div className='mt-6 flex flex-col items-center justify-end gap-3 sm:flex-row sm:gap-4'>
        <p
          aria-live='polite'
          role='status'
          className={
            state?.status === 'success' ? 'text-green-500' : 'text-red-500'
          }
        >
          {state?.message}
        </p>

        <SaveButton />
      </div>
    </form>
  )
}

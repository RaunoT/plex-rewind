'use client'

import { saveConnectionSettings } from '@/actions/update-connection-settings'
import { ConnectionSettings } from '@/types'
import SettingsForm from '../../_components/SettingsForm'

type Props = {
  settings: ConnectionSettings
}

export default function ConnectionSettingsForm({ settings }: Props) {
  return (
    <SettingsForm settings={settings} action={saveConnectionSettings}>
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
    </SettingsForm>
  )
}

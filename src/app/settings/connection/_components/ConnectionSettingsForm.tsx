'use client'

import {
  ConnectionSettings,
  Settings,
  SettingsFormInitialState,
} from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import SettingsForm from '../../_components/SettingsForm'
import saveConnectionSettings from '../_actions/updateConnectionSettings'

type Props = {
  settings: Settings
}

type ConnectionFormState = SettingsFormInitialState<ConnectionSettings>

export default function ConnectionSettingsForm({ settings }: Props) {
  const t = useTranslations('Settings')
  const initialState: ConnectionFormState = {
    message: '',
    status: '',
    fields: {
      ...settings.connection,
    },
  }
  const [formState, formAction] = useActionState<ConnectionFormState, FormData>(
    saveConnectionSettings,
    initialState,
  )
  const connectionSettings = {
    ...settings.connection,
    ...formState.fields,
  }

  return (
    <SettingsForm
      formState={formState}
      formAction={formAction}
      isSetup={!connectionSettings.complete}
    >
      <section className='group-settings group'>
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <h2 className='heading-settings'>Tautulli</h2>
        <label className='input-wrapper'>
          <input
            key={`tautulli-url-${connectionSettings.tautulliUrl}`}
            type='url'
            className='input'
            placeholder='http://192.168.1.2:8181'
            name='tautulliUrl'
            required
            defaultValue={connectionSettings.tautulliUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
          </span>
        </label>
        <label className='input-wrapper'>
          <input
            key={`tautulli-api-key-${connectionSettings.tautulliApiKey}`}
            type='password'
            className='input'
            name='tautulliApiKey'
            required
            defaultValue={connectionSettings.tautulliApiKey}
          />
          <span className='label'>
            <span className='label-wrapper'>{t('apiKey')}</span>
          </span>
        </label>
      </section>
      <section className='group-settings group'>
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <h2 className='heading-settings'>Plex</h2>
        <label className='input-wrapper'>
          <input
            key={`plex-url-${connectionSettings.plexUrl}`}
            type='url'
            className='input'
            placeholder='http://192.168.1.2:32400'
            name='plexUrl'
            required
            defaultValue={connectionSettings.plexUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
          </span>
        </label>
      </section>
      <section className='group-settings group'>
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <h2 className='heading-settings'>Overseerr</h2>
        <label className='input-wrapper'>
          <input
            key={`overseerr-url-${connectionSettings.overseerrUrl}`}
            type='url'
            className='input'
            placeholder='http://192.168.1.2:5055'
            name='overseerrUrl'
            defaultValue={connectionSettings.overseerrUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
          </span>
        </label>
        <label className='input-wrapper'>
          <input
            key={`overseerr-api-key-${connectionSettings.overseerrApiKey}`}
            type='password'
            className='input'
            name='overseerrApiKey'
            defaultValue={connectionSettings.overseerrApiKey}
          />
          <span className='label'>
            <span className='label-wrapper'>{t('apiKey')}</span>
          </span>
        </label>
      </section>
    </SettingsForm>
  )
}

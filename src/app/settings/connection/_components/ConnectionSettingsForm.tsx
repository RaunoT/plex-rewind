'use client'

import {
  ConnectionSettings,
  Settings,
  SettingsFormInitialState,
  StatisticsSource,
} from '@/types/settings'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
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
  const [statisticsSource, setStatisticsSource] = useState<StatisticsSource>(
    connectionSettings.statisticsSource,
  )
  const isTracearr = statisticsSource === 'tracearr'

  return (
    <SettingsForm
      formState={formState}
      formAction={formAction}
      isSetup={!connectionSettings.complete}
    >
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('Connection.statistics')}</h2>
        <label className='input-wrapper'>
          <span className='select-wrapper'>
            <select
              className='input'
              name='statisticsSource'
              value={statisticsSource}
              onChange={(e) =>
                setStatisticsSource(e.target.value as StatisticsSource)
              }
            >
              {/* eslint-disable-next-line react/jsx-no-literals */}
              <option value='tautulli'>Tautulli</option>
              {/* eslint-disable-next-line react/jsx-no-literals */}
              <option value='tracearr'>Tracearr</option>
            </select>
          </span>
          <span className='label'>
            <span className='label-wrapper'>{t('Connection.source')}</span>
            {isTracearr && <small>{t('Connection.tracearrDescription')}</small>}
          </span>
        </label>
      </section>
      <section className={clsx('group-settings group', { hidden: isTracearr })}>
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <h2 className='heading-settings'>Tautulli</h2>
        <label className='input-wrapper'>
          <input
            key={`tautulli-url-${connectionSettings.tautulliUrl}`}
            type='url'
            className='input'
            placeholder='http://192.168.1.2:8181'
            name='tautulliUrl'
            required={!isTracearr}
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
            required={!isTracearr}
            defaultValue={connectionSettings.tautulliApiKey}
          />
          <span className='label'>
            <span className='label-wrapper'>{t('apiKey')}</span>
          </span>
        </label>
      </section>
      <section
        className={clsx('group-settings group', { hidden: !isTracearr })}
      >
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <h2 className='heading-settings'>Tracearr</h2>
        <label className='input-wrapper'>
          <input
            key={`tracearr-url-${connectionSettings.tracearrUrl}`}
            type='url'
            className='input'
            placeholder='http://192.168.1.2:3000'
            name='tracearrUrl'
            required={isTracearr}
            defaultValue={connectionSettings.tracearrUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
          </span>
        </label>
        <label className='input-wrapper'>
          <input
            key={`tracearr-api-key-${connectionSettings.tracearrApiKey}`}
            type='password'
            className='input'
            placeholder='trr_pub_…'
            name='tracearrApiKey'
            required={isTracearr}
            defaultValue={connectionSettings.tracearrApiKey}
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

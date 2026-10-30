'use client'

import { HistoryStatus } from '@/types/playHistory'
import {
  ConnectionSettings,
  MediaServerType,
  Settings,
  SettingsFormInitialState,
  StatisticsSource,
} from '@/types/settings'
import { TracearrServerOption } from '@/types/tracearr'
import { getMediaServerName } from '@/utils/mediaServerName'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import SettingsForm from '../../_components/SettingsForm'
import saveConnectionSettings from '../_actions/updateConnectionSettings'
import PlayHistory from './PlayHistory'

type Props = {
  settings: Settings
  tracearrServers: TracearrServerOption[]
  // Null until the connection is saved
  historyStatus: HistoryStatus | null
}

type ConnectionFormState = SettingsFormInitialState<ConnectionSettings> & {
  tracearrServers?: TracearrServerOption[]
}

export default function ConnectionSettingsForm({
  settings,
  tracearrServers: initialTracearrServers,
  historyStatus,
}: Props) {
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
  // The page's settings are from before any save made since it loaded
  const savedConnection =
    formState.status === 'success'
      ? { ...settings.connection, ...formState.fields }
      : settings.connection
  // Each source keeps its history, so it shows for any source whose
  // connection was saved, not only the one in use
  const hasSavedConnection = isTracearr
    ? !!(savedConnection.tracearrUrl && savedConnection.tracearrApiKey)
    : !!(savedConnection.tautulliUrl && savedConnection.tautulliApiKey)
  // Saving returns the servers when several need a choice.
  const tracearrServers = formState.tracearrServers ?? initialTracearrServers
  // Until another is picked, the saved one
  const [chosenServerId, setChosenServerId] = useState<string | null>(null)
  const tracearrServerId = chosenServerId ?? connectionSettings.tracearrServerId
  // The chosen server's, or the only one's. Tautulli only tracks Plex.
  const mediaServerType: MediaServerType = isTracearr
    ? ((
        tracearrServers.find(
          (server) => server.server_id === tracearrServerId,
        ) ?? (tracearrServers.length === 1 ? tracearrServers[0] : undefined)
      )?.server_type ?? connectionSettings.mediaServerType)
    : 'plex'
  const isJellyfin = mediaServerType === 'jellyfin'
  const mediaServerName = getMediaServerName(mediaServerType)

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
              key={`statistics-source-${connectionSettings.statisticsSource}`}
              className='input'
              name='statisticsSource'
              defaultValue={connectionSettings.statisticsSource}
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
          </span>
        </label>
        {connectionSettings.complete && hasSavedConnection && (
          <PlayHistory
            key={statisticsSource}
            initialStatus={
              statisticsSource === settings.connection.statisticsSource
                ? historyStatus
                : null
            }
            source={statisticsSource}
            refreshOn={formState}
          />
        )}
      </section>
      <section className={clsx('group-settings group', { hidden: isTracearr })}>
        {/* eslint-disable-next-line react/jsx-no-literals */}
        <h2 className='heading-settings'>Tautulli</h2>
        <label className='input-wrapper'>
          <input
            key={`tautulli-url-${connectionSettings.tautulliUrl}`}
            type='url'
            className='input'
            placeholder='https://tautulli.example.com'
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
            placeholder='https://tracearr.example.com'
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
            name='tracearrApiKey'
            required={isTracearr}
            defaultValue={connectionSettings.tracearrApiKey}
          />
          <span className='label'>
            <span className='label-wrapper'>{t('apiKey')}</span>
          </span>
        </label>
        {tracearrServers.length > 1 && (
          <label className='input-wrapper'>
            <span className='select-wrapper'>
              <select
                key={`tracearr-server-${tracearrServers.length}-${connectionSettings.tracearrServerId}`}
                className='input'
                name='tracearrServerId'
                required={isTracearr}
                defaultValue={connectionSettings.tracearrServerId}
                onChange={(e) => setChosenServerId(e.target.value)}
              >
                <option value='' disabled>
                  {t('Connection.chooseServer')}
                </option>
                {tracearrServers.map((server) => (
                  <option key={server.server_id} value={server.server_id}>
                    {`${server.server_name} (${getMediaServerName(server.server_type)})`}
                  </option>
                ))}
              </select>
            </span>
            <span className='label'>
              <span className='label-wrapper'>{t('Connection.server')}</span>
            </span>
          </label>
        )}
      </section>
      <section
        className={clsx('group-settings group', { hidden: !isTracearr })}
      >
        <h2 className='heading-settings'>
          {isJellyfin
            ? mediaServerName
            : t('Connection.optionalService', { service: mediaServerName })}
        </h2>
        {/* Each server keeps its own URL, so switching back keeps it */}
        <label className={clsx('input-wrapper', { hidden: isJellyfin })}>
          <input
            key={`plex-url-${connectionSettings.plexUrl}`}
            type='url'
            className='input'
            placeholder='https://plex.example.com'
            name='plexUrl'
            defaultValue={connectionSettings.plexUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
            <small>{t('Connection.plexUrlHelp')}</small>
          </span>
        </label>
        <label className={clsx('input-wrapper', { hidden: !isJellyfin })}>
          <input
            key={`jellyfin-url-${connectionSettings.jellyfinUrl}`}
            type='url'
            className='input'
            placeholder='https://jellyfin.example.com'
            name='jellyfinUrl'
            required={isTracearr && isJellyfin}
            defaultValue={connectionSettings.jellyfinUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
            <small>{t('Connection.jellyfinUrlHelp')}</small>
          </span>
        </label>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>
          {t('Connection.optionalService', { service: 'Seerr' })}
        </h2>
        <label className='input-wrapper'>
          <input
            key={`seerr-url-${connectionSettings.seerrUrl}`}
            type='url'
            className='input'
            placeholder='https://seerr.example.com'
            name='seerrUrl'
            defaultValue={connectionSettings.seerrUrl}
          />
          <span className='label'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='label-wrapper'>URL</span>
          </span>
        </label>
        <label className='input-wrapper'>
          <input
            key={`seerr-api-key-${connectionSettings.seerrApiKey}`}
            type='password'
            className='input'
            name='seerrApiKey'
            defaultValue={connectionSettings.seerrApiKey}
          />
          <span className='label'>
            <span className='label-wrapper'>{t('apiKey')}</span>
          </span>
        </label>
      </section>
    </SettingsForm>
  )
}

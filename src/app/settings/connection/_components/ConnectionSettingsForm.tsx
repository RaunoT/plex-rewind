'use client'

import { Settings } from '@/types/settings'
import { useTranslations } from 'next-intl'
import SettingsForm from '../../_components/SettingsForm'
import saveConnectionSettings from '../_actions/updateConnectionSettings'

type Props = {
  settings: Settings
}

export default function ConnectionSettingsForm({ settings }: Props) {
  const connectionSettings = settings.connection
  const t = useTranslations('Settings')
  const tCommon = useTranslations('Common')

  return (
    <SettingsForm settings={settings} action={saveConnectionSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('tautulli')}</h2>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:8181'
            name='tautulliUrl'
            required
            defaultValue={connectionSettings.tautulliUrl}
          />
          <span className='label'>
            <span className='label-wrapper'>{tCommon('url')}</span>
          </span>
        </label>
        <label className='input-wrapper'>
          <input
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
        <h2 className='heading-settings'>{tCommon('plex')}</h2>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:32400'
            name='plexUrl'
            required
            defaultValue={connectionSettings.plexUrl}
          />
          <span className='label'>
            <span className='label-wrapper'>{tCommon('url')}</span>
          </span>
        </label>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('overseerr')}</h2>
        <label className='input-wrapper'>
          <input
            type='url'
            className='input'
            placeholder='http://192.168.1.2:5055'
            name='overseerrUrl'
            defaultValue={connectionSettings.overseerrUrl}
          />
          <span className='label'>
            <span className='label-wrapper'>{tCommon('url')}</span>
          </span>
        </label>
        <label className='input-wrapper'>
          <input
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
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('chat')}</h2>
        <label className='input-wrapper'>
          <input
            type='password'
            className='input'
            placeholder='AI*************'
            name='aiApiKey'
            defaultValue={connectionSettings.aiApiKey}
          />
          <span className='label'>
            <span className='label-wrapper'>{t('Connection.aiApiKey')}</span>
          </span>
        </label>
      </section>
    </SettingsForm>
  )
}

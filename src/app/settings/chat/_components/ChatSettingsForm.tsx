'use client'

import DatePicker from '@/components/DatePicker'
import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { useTranslations } from 'next-intl'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveChatSettings from '../_actions/updateChatSettings'

type Props = {
  settings: Settings
}

export default function ChatSettingsForm({ settings }: Props) {
  const t = useTranslations('Settings.Chat')
  const chatSettings = settings.chat

  return (
    <SettingsForm settings={settings} action={saveChatSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('privacy')}</h2>
        <Switch
          className='switch items-start'
          name='adminOnly'
          defaultSelected={chatSettings.adminOnly}
        >
          <div className='indicator'></div>
          <span className='label'>
            <span className='label-wrapper'>{t('adminOnly')}</span>
            <small>
              {t('adminOnlyDescription1')}
              <br />
              {t('adminOnlyDescription2')}
            </small>
          </span>
        </Switch>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('knowledge')}</h2>
        <DatePicker
          label='Start date'
          helperText='Defaults to all time.'
          name='startDate'
          defaultValue={
            chatSettings.startDate || DEFAULT_SETTINGS.chat.startDate
          }
        />
        <DatePicker
          label='End date'
          helperText='Defaults to today.'
          name='endDate'
          defaultValue={chatSettings.endDate || DEFAULT_SETTINGS.chat.endDate}
        />
      </section>
    </SettingsForm>
  )
}

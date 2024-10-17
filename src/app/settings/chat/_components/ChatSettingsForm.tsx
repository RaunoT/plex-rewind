'use client'

import DatePicker from '@/components/DatePicker'
import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveChatSettings from '../_actions/updateChatSettings'

type Props = {
  settings: Settings
}

export default function ChatSettingsForm({ settings }: Props) {
  const chatSettings = settings.chat

  return (
    <SettingsForm settings={settings} action={saveChatSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Privacy</h2>
        <Switch
          className='switch items-start'
          name='adminOnly'
          defaultSelected={chatSettings.adminOnly}
        >
          <div className='indicator'></div>
          <span className='label'>
            <span className='label-wrapper'>Restrict to admins</span>
            <small>
              Login is always required.
              <br /> AI has knowledge of all users.
            </small>
          </span>
        </Switch>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Knowledge</h2>
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

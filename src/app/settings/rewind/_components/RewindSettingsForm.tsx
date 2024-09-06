'use client'

import DatePicker from '@/components/DatePicker'
import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveRewindSettings from '../_actions/updateRewindSettings'

type Props = {
  settings: Settings
}

export default function RewindSettingsForm({ settings }: Props) {
  const rewindSettings = settings.rewind
  const [isActive, setIsActive] = useState<boolean>(rewindSettings.isActive)

  return (
    <SettingsForm settings={settings} action={saveRewindSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Status</h2>
        <Switch
          className='switch'
          name='isActive'
          isSelected={isActive}
          onChange={setIsActive}
        >
          <div className='indicator' />
          <span className='label'>
            <span className='label-wrapper'>Enabled</span>
          </span>
        </Switch>
      </section>
      {isActive && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Cards</h2>
            <Switch
              className='switch items-start'
              name='isLibrariesSizeAndCountActive'
              defaultSelected={rewindSettings.isLibrariesSizeAndCountActive}
            >
              <div className='indicator' />
              <span className='label'>
                <span className='label-wrapper'>
                  Libraries size & count card
                </span>
                <small>
                  Disable if you don&apos;t want to rely on Tautulli for these
                  stats.
                </small>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Defaults</h2>
            <DatePicker
              label='Start date'
              helperText='Defaults to 365 days ago.'
              name='startDate'
              defaultValue={
                rewindSettings.startDate || DEFAULT_SETTINGS.rewind.startDate
              }
            />
            <DatePicker
              label='End date'
              helperText='Defaults to today.'
              name='endDate'
              defaultValue={
                rewindSettings.endDate || DEFAULT_SETTINGS.rewind.endDate
              }
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

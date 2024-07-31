'use client'

import { Settings } from '@/types'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveRewindSettings from '../_actions/updateRewindSettings'

type Props = {
  settings: Settings
}

export default function RewindSettingsForm({ settings }: Props) {
  const rewindSettings = settings.rewind

  return (
    <SettingsForm settings={settings} action={saveRewindSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Status</h2>
        <Switch
          className='switch'
          name='isActive'
          defaultSelected={rewindSettings.isActive}
        >
          <div className='indicator' />
          <span className='label'>Enabled</span>
        </Switch>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Cards</h2>
        <Switch
          className='switch items-start'
          name='isLibrariesSizeAndCountActive'
          defaultSelected={rewindSettings.isLibrariesSizeAndCountActive}
        >
          <div className='indicator' />
          <span className='label'>
            Libraries size & count card
            <small>
              Disable if you don&apos;t want to rely on Tautulli for these
              stats.
            </small>
          </span>
        </Switch>
      </section>
    </SettingsForm>
  )
}

'use client'

import { Settings } from '@/types/settings'
import { TautulliUser } from '@/types/tautulli'
import Link from 'next/link'
import { useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveRewindSettings from '../_actions/updateRewindSettings'

type Props = {
  settings: Settings
  users: TautulliUser[] | undefined
}

export default function RewindSettingsForm({ settings, users }: Props) {
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
          <span className='label'>Enabled</span>
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
                Libraries size & count card
                <small>
                  Disable if you don&apos;t want to rely on Tautulli for these
                  stats.
                </small>
              </span>
            </Switch>
          </section>
          {users?.length && rewindSettings.complete && (
            <section className='group-settings group'>
              <h2 className='heading-settings'>Users Rewinds</h2>
              <ul className='flex flex-wrap gap-2 sm:ml-48'>
                {users.map((user) => (
                  <li key={user.user_id}>
                    <Link
                      href={`/rewind?userId=${user.user_id}`}
                      className='button button-sm'
                    >
                      {user.friendly_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </SettingsForm>
  )
}

'use client'

import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { kebabCase } from 'lodash'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveGeneralSettings from '../_actions/updateGeneralSettings'

type Props = {
  settings: Settings
  libraries: TautulliLibrary[]
}

export default function GeneralSettingsForm({ settings, libraries }: Props) {
  const generalSettings = settings.general

  return (
    <SettingsForm
      settings={settings}
      action={saveGeneralSettings}
      hideSubmit={!libraries.length}
      settingKey='general'
    >
      <section className='group-settings group'>
        <h2 className='heading-settings'>Libraries</h2>
        {libraries.length ? (
          <CheckboxGroup
            className='input-wrapper'
            name='activeLibraries'
            defaultValue={generalSettings.activeLibraries}
          >
            <div className='peer mr-auto flex flex-wrap gap-2'>
              {libraries.map((library) => (
                <Checkbox
                  key={library.section_id}
                  value={kebabCase(library.section_name)}
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {library.section_name}
                </Checkbox>
              ))}
            </div>
            <Label className='label label--start'>Active libraries</Label>
          </CheckboxGroup>
        ) : (
          <p
            aria-live='polite'
            role='status'
            className='text-center text-neutral-400'
          >
            Please create a library in Plex to proceed. <br />
            Plex Rewind requires at least one library to function.
          </p>
        )}
      </section>
      {libraries.length > 0 && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Media</h2>
            <Switch
              className='switch items-start'
              name='isPostersTmdbOnly'
              defaultSelected={generalSettings.isPostersTmdbOnly}
            >
              <div className='indicator'></div>
              <span className='label'>
                TMDB only posters
                <small>
                  Ignore Plex posters for tv/movies.
                  <br /> By default, TMDB is a fallback.
                </small>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Privacy</h2>
            <Switch
              className='switch items-start'
              name='isOutsideAccess'
              defaultSelected={generalSettings.isOutsideAccess}
            >
              <div className='indicator'></div>
              <span className='label'>
                Allow outside access
                <small>Access without login.</small>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Analytics</h2>
            <label className='input-wrapper'>
              <input
                type='text'
                className='input'
                name='googleAnalyticsId'
                defaultValue={generalSettings.googleAnalyticsId}
                placeholder='G-XXXXXXXXXX'
              />
              <span className='label'>Google Analytics ID</span>
            </label>
          </section>
        </>
      )}
    </SettingsForm>
  )
}

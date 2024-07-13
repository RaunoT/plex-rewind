'use client'

import { saveFeaturesSettings } from '@/actions/update-feature-settings'
import { Library, Settings } from '@/types'
import { kebabCase } from 'lodash'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'

type Props = {
  settings: Settings
  libraries: Library[]
}

export default function FeaturesSettingsForm({ settings, libraries }: Props) {
  const featuresSettings = settings.features

  return (
    <SettingsForm settings={settings} action={saveFeaturesSettings}>
      <Switch
        className='switch'
        name='isRewindActive'
        defaultSelected={featuresSettings?.isRewindActive}
      >
        <div className='indicator' />
        <span className='label'>Rewind</span>
      </Switch>
      <Switch
        className='switch'
        name='isDashboardActive'
        defaultSelected={featuresSettings?.isDashboardActive}
      >
        <div className='indicator'></div>
        <span className='label'>Dashboard</span>
      </Switch>
      <Switch
        className='switch'
        name='isUsersPageActive'
        defaultSelected={featuresSettings?.isUsersPageActive}
      >
        <div className='indicator'></div>
        <span className='label'>Users page</span>
      </Switch>
      <CheckboxGroup
        className='input-wrapper'
        name='activeLibraries'
        defaultValue={featuresSettings?.activeLibraries}
      >
        <div className='mr-auto flex flex-wrap gap-2'>
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
        <Label className='label label--start'>Libraries</Label>
      </CheckboxGroup>
      <CheckboxGroup
        className='input-wrapper'
        name='activeDashboardStatistics'
        defaultValue={
          featuresSettings?.activeDashboardStatistics || [
            'year',
            'rating',
            'duration',
            'plays',
            'users',
            'requests',
          ]
        }
      >
        <div className='mr-auto flex flex-wrap gap-2'>
          <Checkbox value='year' className='checkbox-wrapper'>
            <div className='checkbox' aria-hidden='true'></div>
            Year
          </Checkbox>
          <Checkbox value='rating' className='checkbox-wrapper'>
            <div className='checkbox' aria-hidden='true'></div>
            Rating
          </Checkbox>
          <Checkbox value='duration' className='checkbox-wrapper'>
            <div className='checkbox' aria-hidden='true'></div>
            Duration
          </Checkbox>
          <Checkbox value='plays' className='checkbox-wrapper'>
            <div className='checkbox' aria-hidden='true'></div>
            Plays
          </Checkbox>
          <Checkbox value='users' className='checkbox-wrapper'>
            <div className='checkbox' aria-hidden='true'></div>
            Users
          </Checkbox>
          {settings.connection.overseerrUrl &&
            settings.connection.overseerrApiKey && (
              <Checkbox value='requests' className='checkbox-wrapper'>
                <div className='checkbox' aria-hidden='true'></div>
                Requests
              </Checkbox>
            )}
        </div>
        <Label className='label label--start'>Dashboard statistics</Label>
      </CheckboxGroup>
      <label className='input-wrapper'>
        <input
          type='text'
          className='input'
          name='googleAnalyticsId'
          defaultValue={featuresSettings?.googleAnalyticsId}
        />
        <span className='label'>Google Analytics ID</span>
      </label>
    </SettingsForm>
  )
}

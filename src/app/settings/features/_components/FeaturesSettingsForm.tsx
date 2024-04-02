'use client'

import { saveFeaturesSettings } from '@/actions/update-feature-settings'
import { settings as allSettings } from '@/config/config'
import { FeaturesSettings, Library } from '@/types'
import { parseDate } from '@internationalized/date'
import { kebabCase } from 'lodash'
import {
  Checkbox,
  CheckboxGroup,
  DateField,
  DateInput,
  DateSegment,
  I18nProvider,
  Label,
  Switch,
} from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'

type Props = {
  settings: FeaturesSettings
  libraries: Library[]
}

export default function FeaturesSettingsForm({ settings, libraries }: Props) {
  return (
    <SettingsForm settings={settings} action={saveFeaturesSettings}>
      <Switch
        className='switch'
        name='isRewindActive'
        defaultSelected={settings?.isRewindActive}
      >
        <div className='indicator' />
        <span className='label'>Rewind</span>
      </Switch>
      <Switch
        className='switch'
        name='isDashboardActive'
        defaultSelected={settings?.isDashboardActive}
      >
        <div className='indicator'></div>
        <span className='label'>Dashboard</span>
      </Switch>
      <Switch
        className='switch'
        name='isUsersPageActive'
        defaultSelected={settings?.isUsersPageActive}
      >
        <div className='indicator'></div>
        <span className='label'>Users page</span>
      </Switch>
      <CheckboxGroup
        className='input-wrapper'
        name='activeLibraries'
        defaultValue={settings?.activeLibraries}
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
          settings?.activeDashboardStatistics || [
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
          {allSettings.connection.overseerrUrl &&
            allSettings.connection.overseerrApiKey && (
              <Checkbox value='requests' className='checkbox-wrapper'>
                <div className='checkbox' aria-hidden='true'></div>
                Requests
              </Checkbox>
            )}
        </div>
        <Label className='label label--start'>Dashboard statistics</Label>
      </CheckboxGroup>
      <I18nProvider locale='en-GB'>
        <DateField
          className='input-wrapper'
          defaultValue={
            settings?.statisticsStartDate
              ? parseDate(settings.statisticsStartDate)
              : parseDate('2018-01-01')
          }
          name='statisticsStartDate'
        >
          <DateInput className='datefield'>
            {(segment) => (
              <DateSegment segment={segment} className='datefield-segment' />
            )}
          </DateInput>
          <Label className='label'>Statistics start date</Label>
        </DateField>
      </I18nProvider>
      <label className='input-wrapper'>
        <input
          type='text'
          className='input'
          name='googleAnalyticsId'
          defaultValue={settings?.googleAnalyticsId}
        />
        <span className='label'>Google Analytics ID</span>
      </label>
    </SettingsForm>
  )
}

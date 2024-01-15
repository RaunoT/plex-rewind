'use client'

import { saveFeaturesSettings } from '@/actions/update-feature-settings'
import { FeaturesSettings, Library } from '@/types'
import { parseDate } from '@internationalized/date'
import { snakeCase } from 'lodash'
import { useEffect, useState } from 'react'
import {
  Checkbox,
  CheckboxGroup,
  DateField,
  DateInput,
  DateSegment,
  Label,
  Switch,
} from 'react-aria-components'
import { useFormState } from 'react-dom'
import SettingsSaveButton from '../../_components/SaveButton'

type Props = {
  settings: FeaturesSettings
  libraries: Library[]
}

export default function FeaturesSettingsForm({ settings, libraries }: Props) {
  const initialState = {
    message: '',
    status: '',
    fields: settings,
  }
  const [formState, formAction] = useFormState(
    saveFeaturesSettings,
    initialState,
  )
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    setStatusMessage(formState?.message)
    const timeout = setTimeout(() => {
      setStatusMessage('')
    }, 2500)

    return () => clearTimeout(timeout)
  }, [formState])

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
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
                value={snakeCase(library.section_name)}
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
            <Checkbox value='requests' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Requests
            </Checkbox>
          </div>
          <Label className='label label--start'>Dashboard statistics</Label>
        </CheckboxGroup>
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
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            name='googleAnalyticsId'
            defaultValue={settings?.googleAnalyticsId}
          />
          <span className='label'>Google Analytics ID</span>
        </label>
      </div>

      <div className='mt-6 flex flex-col items-center justify-end gap-3 sm:flex-row sm:gap-4'>
        <p
          aria-live='polite'
          role='status'
          className={
            formState?.status === 'success' ? 'text-green-500' : 'text-red-500'
          }
        >
          {statusMessage}
        </p>

        <SettingsSaveButton />
      </div>
    </form>
  )
}

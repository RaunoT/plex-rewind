'use client'

import { saveFeaturesSettings } from '@/actions/update-feature-settings'
import Loader from '@/components/Loader'
import { FeaturesSettings, Library } from '@/types'
import { parseDate } from '@internationalized/date'
import { snakeCase } from 'lodash'
import {
  Checkbox,
  CheckboxGroup,
  DateField,
  DateInput,
  DateSegment,
  Label,
  Switch,
} from 'react-aria-components'
import { useFormState, useFormStatus } from 'react-dom'

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
  const [state, formAction] = useFormState(saveFeaturesSettings, initialState)

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
          defaultValue={settings?.activeDashboardStatistics}
        >
          <div className='mr-auto flex flex-wrap gap-2'>
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
            state?.status === 'success' ? 'text-green-500' : 'text-red-500'
          }
        >
          {state?.message}
        </p>

        <SaveButton />
      </div>
    </form>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className='button flex w-full min-w-28 justify-center sm:w-fit'
      type='submit'
      disabled={pending}
    >
      {pending ? <Loader size={6} /> : 'Save'}
    </button>
  )
}

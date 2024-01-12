'use client'

import { saveFeaturesSettings } from '@/actions/update-settings'
import { FormState, Settings } from '@/types'
import { parseDate } from '@internationalized/date'
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
  formInitialState: Settings | null
}

const initialState: FormState = {
  message: '',
  status: '',
}

export function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <button className='button w-full sm:w-fit' type='submit' disabled={pending}>
      Save
    </button>
  )
}

export default function FeaturesSettings({ formInitialState }: Props) {
  const [state, formAction] = useFormState(saveFeaturesSettings, initialState)
  console.log(formInitialState)

  return (
    <form className='glass-sheet pb-6' action={formAction}>
      <div className='grid gap-4'>
        <Switch className='switch' name='isRewindActive' defaultSelected>
          <div className='indicator' />
          <span className='label'>Rewind</span>
        </Switch>
        <Switch className='switch' name='isDashboardActive' defaultSelected>
          <div className='indicator'></div>
          <span className='label'>Dashboard</span>
        </Switch>
        <Switch className='switch' name='isUsersPageActive' defaultSelected>
          <div className='indicator'></div>
          <span className='label'>Users page</span>
        </Switch>
        <CheckboxGroup className='input-wrapper' name='activeLibraries'>
          <div className='mr-auto flex flex-wrap gap-2'>
            <Checkbox value='movies' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Movies
            </Checkbox>
            <Checkbox value='tv_shows' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              TV Shows
            </Checkbox>
          </div>
          <Label className='label'>Libraries</Label>
        </CheckboxGroup>
        <CheckboxGroup
          className='input-wrapper'
          name='activeDashboardStatistics'
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
          <Label className='label'>Dashboard statistics</Label>
        </CheckboxGroup>
        <DateField
          className='input-wrapper'
          defaultValue={parseDate('2018-01-01')}
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
          <input type='text' className='input' name='googleAnalyticsId' />
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

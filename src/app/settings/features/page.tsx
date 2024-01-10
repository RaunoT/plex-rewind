'use client'

import { parseDate } from '@internationalized/date'
import { useState } from 'react'
import {
  Checkbox,
  CheckboxGroup,
  DateField,
  DateInput,
  DateSegment,
  Label,
  Switch,
} from 'react-aria-components'

export default function FeaturesSettings() {
  const [formData, setFormData] = useState({
    rewind: 'true',
    dashboard: 'true',
    dashboard_users_page: 'true',
    google_analytics_id: '',
    dashboard_statistics: 'duration,plays,users,requests',
    libraries: '',
    statistics_start_date: parseDate('2018-01-01'),
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    console.log(JSON.stringify(formData))

    // const res = await fetch('/api/settings', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData),
    // })

    // const data = await res.json()
    // console.log(data)
  }

  function handleSwitchChange(name: string, isSelected: boolean) {
    setFormData({
      ...formData,
      [name]: String(isSelected),
    })
  }

  function handleCheckboxGroupChange(values: string[]) {
    setFormData({
      ...formData,
      dashboard_statistics: values.join(','),
    })
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  return (
    <form className='glass-sheet pb-6' onSubmit={handleSubmit}>
      <div className='grid gap-4'>
        <Switch
          className='switch'
          name='rewind'
          defaultSelected
          value={formData.rewind}
          onChange={(isSelected) => handleSwitchChange('rewind', isSelected)}
        >
          <div className='indicator' />
          <span className='label'>Rewind</span>
        </Switch>
        <Switch
          className='switch'
          name='dashboard'
          defaultSelected
          value={formData.dashboard}
          onChange={(isSelected) => handleSwitchChange('dashboard', isSelected)}
        >
          <div className='indicator'></div>
          <span className='label'>Dashboard</span>
        </Switch>
        <Switch
          className='switch'
          name='dashboard_users_page'
          defaultSelected
          value={formData.dashboard_users_page}
          onChange={(isSelected) =>
            handleSwitchChange('dashboard_users_page', isSelected)
          }
        >
          <div className='indicator'></div>
          <span className='label'>Users page</span>
        </Switch>
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            name='libraries'
            value={formData.libraries}
            onChange={handleInputChange}
          />
          <span className='label'>Libraries</span>
        </label>
        <CheckboxGroup
          className='input-wrapper'
          onChange={handleCheckboxGroupChange}
          value={formData.dashboard_statistics.split(',')}
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
          // value={formData.statistics_start_date}
          defaultValue={formData.statistics_start_date}
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
            name='google_analytics_id'
            value={formData.google_analytics_id}
            onChange={handleInputChange}
          />
          <span className='label'>Google Analytics ID</span>
        </label>
      </div>

      <button className='button ml-auto mt-6 w-full sm:w-fit' type='submit'>
        Save
      </button>
    </form>
  )
}

'use client'

import DatePicker from '@/components/DatePicker'
import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { useState } from 'react'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveDashboardSettings from '../_actions/updateDashboardSettings'

type Props = {
  settings: Settings
}

export default function DashboardSettingsForm({ settings }: Props) {
  const dashboardSettings = settings.dashboard
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey
  const [isActive, setIsActive] = useState<boolean>(dashboardSettings.isActive)

  return (
    <SettingsForm settings={settings} action={saveDashboardSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Status</h2>
        <Switch
          className='switch'
          name='isActive'
          isSelected={isActive}
          onChange={setIsActive}
        >
          <div className='indicator'></div>
          <span className='label'>Enabled</span>
        </Switch>
        {isActive && (
          <Switch
            className='switch'
            name='isUsersPageActive'
            defaultSelected={dashboardSettings.isUsersPageActive}
          >
            <div className='indicator'></div>
            <span className='label'>Users page</span>
          </Switch>
        )}
      </section>
      {isActive && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Statistics</h2>
            <CheckboxGroup
              className='input-wrapper'
              name='activeItemStatistics'
              defaultValue={
                dashboardSettings.activeItemStatistics ||
                DEFAULT_SETTINGS.dashboard.activeItemStatistics
              }
            >
              <div className='peer mr-auto flex flex-wrap gap-2'>
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
                {isOverseerrActive && (
                  <Checkbox value='requests' className='checkbox-wrapper'>
                    <div className='checkbox' aria-hidden='true'></div>
                    Requests
                  </Checkbox>
                )}
              </div>
              <Label className='label label--start'>Item statistics</Label>
            </CheckboxGroup>
            <CheckboxGroup
              className='input-wrapper'
              name='activeTotalStatistics'
              defaultValue={
                dashboardSettings.activeTotalStatistics ||
                DEFAULT_SETTINGS.dashboard.activeTotalStatistics
              }
            >
              <div className='peer mr-auto flex flex-wrap gap-2'>
                <Checkbox value='size' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  Size
                </Checkbox>
                <Checkbox value='duration' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  Duration
                </Checkbox>
                <Checkbox value='count' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  Count
                </Checkbox>
                {isOverseerrActive && (
                  <Checkbox value='requests' className='checkbox-wrapper'>
                    <div className='checkbox' aria-hidden='true'></div>
                    Requests
                  </Checkbox>
                )}
              </div>
              <Label className='label label--start'>Totals statistics</Label>
            </CheckboxGroup>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>Defaults</h2>
            <label className='input-wrapper'>
              <input
                type='number'
                className='input'
                name='customPeriod'
                defaultValue={
                  dashboardSettings.customPeriod ||
                  DEFAULT_SETTINGS.dashboard.customPeriod
                }
                placeholder='30'
                min='1'
                max='3000'
                required
              />
              <span className='label'>Custom period</span>
            </label>
            <DatePicker
              label='Start date'
              helperText='Used for the all time period.'
              name='startDate'
              defaultValue={
                dashboardSettings.startDate ||
                DEFAULT_SETTINGS.dashboard.startDate
              }
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

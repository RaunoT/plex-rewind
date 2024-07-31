'use client'

import { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/utils/constants'
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

  return (
    <SettingsForm settings={settings} action={saveDashboardSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Status</h2>
        <Switch
          className='switch'
          name='isActive'
          defaultSelected={dashboardSettings.isActive}
        >
          <div className='indicator'></div>
          <span className='label'>Enabled</span>
        </Switch>
        <Switch
          className='switch'
          name='isUsersPageActive'
          defaultSelected={dashboardSettings.isUsersPageActive}
        >
          <div className='indicator'></div>
          <span className='label'>Users page</span>
        </Switch>
      </section>
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
        <div className='input-wrapper'>
          <div className='select-wrapper'>
            <select
              className='input'
              name='defaultStyle'
              defaultValue={
                dashboardSettings.defaultStyle ||
                DEFAULT_SETTINGS.dashboard.defaultStyle
              }
              required
            >
              <option value='general'>General</option>
              <option value='personal'>Personal</option>
            </select>
          </div>
          <span className='label required'>Default style</span>
        </div>
        <div className='input-wrapper'>
          <div className='select-wrapper'>
            <select
              className='input'
              name='defaultPeriod'
              defaultValue={
                dashboardSettings.defaultPeriod ||
                DEFAULT_SETTINGS.dashboard.defaultPeriod
              }
              required
            >
              <option value='7days'>7 days</option>
              <option value='custom'>Custom period</option>
              <option value='pastYear'>Past year</option>
              <option value='allTime'>All time</option>
            </select>
          </div>
          <span className='label required'>Default period</span>
        </div>
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
      </section>
    </SettingsForm>
  )
}

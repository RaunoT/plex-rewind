'use client'

import DatePicker from '@/components/DatePicker'
import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('Settings.Dashboard')
  const tCommon = useTranslations('Common')

  return (
    <SettingsForm settings={settings} action={saveDashboardSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('status')}</h2>
        <Switch
          className='switch'
          name='isActive'
          isSelected={isActive}
          onChange={setIsActive}
        >
          <div className='indicator'></div>
          <span className='label'>
            <span className='label-wrapper'>{tCommon('enabled')}</span>
          </span>
        </Switch>
        {isActive && (
          <Switch
            className='switch'
            name='isUsersPageActive'
            defaultSelected={dashboardSettings.isUsersPageActive}
          >
            <div className='indicator'></div>
            <span className='label'>
              <span className='label-wrapper'>{t('usersPage')}</span>
            </span>
          </Switch>
        )}
      </section>
      {isActive && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('statistics')}</h2>
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
                  {tCommon('year')}
                </Checkbox>
                <Checkbox value='rating' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('rating')}
                </Checkbox>
                <Checkbox value='duration' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('duration')}
                </Checkbox>
                <Checkbox value='plays' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('plays')}
                </Checkbox>
                <Checkbox value='users' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('users')}
                </Checkbox>
                {isOverseerrActive && (
                  <Checkbox value='requests' className='checkbox-wrapper'>
                    <div className='checkbox' aria-hidden='true'></div>
                    {tCommon('requests')}
                  </Checkbox>
                )}
              </div>
              <Label className='label label--start'>
                <span className='label-wrapper'>{t('itemStatistics')}</span>
              </Label>
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
                  {tCommon('size')}
                </Checkbox>
                <Checkbox value='duration' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('duration')}
                </Checkbox>
                <Checkbox value='count' className='checkbox-wrapper'>
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('count')}
                </Checkbox>
                {isOverseerrActive && (
                  <Checkbox value='requests' className='checkbox-wrapper'>
                    <div className='checkbox' aria-hidden='true'></div>
                    {tCommon('requests')}
                  </Checkbox>
                )}
              </div>
              <Label className='label label--start'>
                <span className='label-wrapper'>{t('totalStatistics')}</span>
              </Label>
            </CheckboxGroup>
            <Switch
              className='switch'
              name='isSortByPlaysActive'
              defaultSelected={dashboardSettings.isSortByPlaysActive}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{t('sortByPlaysFilter')}</span>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{tCommon('defaults')}</h2>
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
              <span className='label'>
                <span className='label-wrapper'>{t('customPeriod')}</span>
                <small>{t('inDays')}</small>
              </span>
            </label>
            <DatePicker
              label={tCommon('startDate')}
              helperText={t('startDateHelperText')}
              name='startDate'
              defaultValue={
                dashboardSettings.startDate ||
                DEFAULT_SETTINGS.dashboard.startDate
              }
              required
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

'use client'

import DatePicker from '@/components/DatePicker'
import {
  DashboardSettings,
  Settings,
  SettingsFormInitialState,
} from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveDashboardSettings from '../_actions/updateDashboardSettings'

type Props = {
  settings: Settings
}

type DashboardFormState = SettingsFormInitialState<Partial<DashboardSettings>>

export default function DashboardSettingsForm({ settings }: Props) {
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey
  const t = useTranslations('Settings.Dashboard')
  const tCommon = useTranslations('Common')
  const [isActive, setIsActive] = useState<boolean>(settings.dashboard.isActive)
  const initialState: DashboardFormState = {
    message: '',
    status: '',
    fields: {
      ...settings.dashboard,
    },
  }
  const [formState, formAction] = useActionState<DashboardFormState, FormData>(
    saveDashboardSettings,
    initialState,
  )
  const dashboardSettings = {
    ...settings.dashboard,
    ...formState.fields,
  }

  return (
    <SettingsForm formState={formState} formAction={formAction}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('status')}</h2>
        <Switch
          key={`is-active-${isActive}`}
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
            key={`users-page-${dashboardSettings.isUsersPageActive}`}
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
              key={`item-stats-${JSON.stringify(
                dashboardSettings.activeItemStatistics,
              )}`}
              className='input-wrapper'
              name='activeItemStatistics'
              defaultValue={dashboardSettings.activeItemStatistics}
            >
              <div className='peer mr-auto flex flex-wrap gap-2'>
                <Checkbox
                  key='item-year'
                  value='year'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('year')}
                </Checkbox>
                <Checkbox
                  key='item-rating'
                  value='rating'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('rating')}
                </Checkbox>
                <Checkbox
                  key='item-duration'
                  value='duration'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('duration')}
                </Checkbox>
                <Checkbox
                  key='item-plays'
                  value='plays'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('plays')}
                </Checkbox>
                <Checkbox
                  key='item-users'
                  value='users'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('users')}
                </Checkbox>
                {isOverseerrActive && (
                  <Checkbox
                    key='item-requests'
                    value='requests'
                    className='checkbox-wrapper'
                  >
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
              key={`total-stats-${JSON.stringify(
                dashboardSettings.activeTotalStatistics,
              )}`}
              className='input-wrapper'
              name='activeTotalStatistics'
              defaultValue={dashboardSettings.activeTotalStatistics}
            >
              <div className='peer mr-auto flex flex-wrap gap-2'>
                <Checkbox
                  key='total-size'
                  value='size'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('size')}
                </Checkbox>
                <Checkbox
                  key='total-duration'
                  value='duration'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('duration')}
                </Checkbox>
                <Checkbox
                  key='total-count'
                  value='count'
                  className='checkbox-wrapper'
                >
                  <div className='checkbox' aria-hidden='true'></div>
                  {tCommon('count')}
                </Checkbox>
                {isOverseerrActive && (
                  <Checkbox
                    key='total-requests'
                    value='requests'
                    className='checkbox-wrapper'
                  >
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
              key={`sort-plays-${dashboardSettings.isSortByPlaysActive}`}
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
                key={`custom-period-${dashboardSettings.customPeriod}`}
                type='number'
                className='input'
                name='customPeriod'
                defaultValue={dashboardSettings.customPeriod}
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
              key={`start-date-${dashboardSettings.startDate}`}
              label={tCommon('startDate')}
              helperText={t('startDateHelperText')}
              name='startDate'
              defaultValue={dashboardSettings.startDate}
              required
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

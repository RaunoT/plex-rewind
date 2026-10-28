'use client'

import DatePicker from '@/components/DatePicker'
import {
  DashboardSettings,
  PublicSettings,
  SettingsFormInitialState,
} from '@/types/settings'
import { sortByLabel } from '@/utils/helpers'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveDashboardSettings from '../_actions/updateDashboardSettings'

type Props = {
  settings: PublicSettings
}

type DashboardFormState = SettingsFormInitialState<Partial<DashboardSettings>>

export default function DashboardSettingsForm({ settings }: Props) {
  const isSeerrActive = settings.connection.isSeerrActive
  const t = useTranslations('Settings.Dashboard')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const totalStatisticOptions = sortByLabel(
    [
      { value: 'size', label: tCommon('size') },
      { value: 'duration', label: tCommon('duration') },
      { value: 'count', label: tCommon('count') },
      ...(isSeerrActive
        ? [{ value: 'requests', label: tCommon('requests') }]
        : []),
    ],
    locale,
  )
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
    <SettingsForm
      formState={formState}
      formAction={formAction}
      isSetup={!dashboardSettings.complete}
    >
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
          <>
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
            <Switch
              key={`admin-only-${dashboardSettings.isAdminOnly}`}
              className='switch items-start'
              name='isAdminOnly'
              defaultSelected={dashboardSettings.isAdminOnly}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{tCommon('adminOnly')}</span>
              </span>
            </Switch>
          </>
        )}
      </section>
      {isActive && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('statistics')}</h2>
            <CheckboxGroup
              key={`total-stats-${dashboardSettings.activeTotalStatistics.join(
                ',',
              )}`}
              className='input-wrapper'
              name='activeTotalStatistics'
              defaultValue={dashboardSettings.activeTotalStatistics}
            >
              <div className='peer checkbox-grid'>
                {totalStatisticOptions.map(({ value, label }) => (
                  <Checkbox
                    key={`total-${value}`}
                    value={value}
                    className='checkbox-wrapper'
                  >
                    <div className='checkbox' aria-hidden='true'></div>
                    {label}
                  </Checkbox>
                ))}
              </div>
              <Label className='label label--start'>
                <span className='label-wrapper'>{t('totals')}</span>
              </Label>
            </CheckboxGroup>
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
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

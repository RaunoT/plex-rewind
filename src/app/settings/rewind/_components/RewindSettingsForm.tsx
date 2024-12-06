'use client'

import DatePicker from '@/components/DatePicker'
import { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveRewindSettings from '../_actions/updateRewindSettings'

type Props = {
  settings: Settings
}

export default function RewindSettingsForm({ settings }: Props) {
  const rewindSettings = settings.rewind
  const [isActive, setIsActive] = useState<boolean>(rewindSettings.isActive)
  const t = useTranslations('Settings.Rewind')
  const tCommon = useTranslations('Common')

  return (
    <SettingsForm settings={settings} action={saveRewindSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('status')}</h2>
        <Switch
          className='switch'
          name='isActive'
          isSelected={isActive}
          onChange={setIsActive}
        >
          <div className='indicator' />
          <span className='label'>
            <span className='label-wrapper'>{tCommon('enabled')}</span>
          </span>
        </Switch>
      </section>
      {isActive && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('cards')}</h2>
            <Switch
              className='switch items-start'
              name='isLibrariesSizeAndCountActive'
              defaultSelected={rewindSettings.isLibrariesSizeAndCountActive}
            >
              <div className='indicator' />
              <span className='label'>
                <span className='label-wrapper'>
                  {t('librariesSizeAndCountCard')}
                </span>
                <small>{t('librariesSizeAndCountCardDescription')}</small>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{tCommon('defaults')}</h2>
            <DatePicker
              label={tCommon('startDate')}
              helperText={t('startDateHelperText')}
              name='startDate'
              defaultValue={
                rewindSettings.startDate || DEFAULT_SETTINGS.rewind.startDate
              }
            />
            <DatePicker
              label={tCommon('endDate')}
              helperText={t('endDateHelperText')}
              name='endDate'
              defaultValue={
                rewindSettings.endDate || DEFAULT_SETTINGS.rewind.endDate
              }
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

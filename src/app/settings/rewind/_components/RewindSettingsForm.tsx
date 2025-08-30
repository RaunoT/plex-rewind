'use client'

import DatePicker from '@/components/DatePicker'
import {
  RewindSettings,
  Settings,
  SettingsFormInitialState,
} from '@/types/settings'
import { isInitialSetup } from '@/utils/helpers'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveRewindSettings from '../_actions/updateRewindSettings'

type Props = {
  settings: Settings
}

type RewindFormState = SettingsFormInitialState<Partial<RewindSettings>>

export default function RewindSettingsForm({ settings }: Props) {
  const initialSetupMode = isInitialSetup(settings)
  const [isActive, setIsActive] = useState<boolean>(settings.rewind.isActive)
  const t = useTranslations('Settings.Rewind')
  const tCommon = useTranslations('Common')
  const initialState: RewindFormState = {
    message: '',
    status: '',
    fields: {
      ...settings.rewind,
    },
  }
  const [formState, formAction] = useActionState<RewindFormState, FormData>(
    saveRewindSettings,
    initialState,
  )
  const rewindSettings = {
    ...settings.rewind,
    ...formState.fields,
  }

  return (
    <SettingsForm
      formState={formState}
      formAction={formAction}
      isSetup={!rewindSettings.complete && initialSetupMode}
    >
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('status')}</h2>
        <Switch
          key={`is-active-${isActive}`}
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
              key={`libraries-size-count-${rewindSettings.isLibrariesSizeAndCountActive}`}
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
              key={`start-date-${rewindSettings.startDate}`}
              label={tCommon('startDate')}
              helperText={t('startDateHelperText')}
              name='startDate'
              defaultValue={rewindSettings.startDate}
            />
            <DatePicker
              key={`end-date-${rewindSettings.endDate}`}
              label={tCommon('endDate')}
              helperText={t('endDateHelperText')}
              name='endDate'
              defaultValue={rewindSettings.endDate}
            />
          </section>
        </>
      )}
    </SettingsForm>
  )
}

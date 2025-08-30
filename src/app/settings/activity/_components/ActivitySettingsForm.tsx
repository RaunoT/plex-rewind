'use client'

import {
  ActivitySettings,
  Settings,
  SettingsFormInitialState,
} from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveActivitySettings from '../_actions/updateActivitySettings'

type Props = {
  settings: Settings
}

type ActivityFormState = SettingsFormInitialState<ActivitySettings>

export default function ActivitySettingsForm({ settings }: Props) {
  const [isActive, setIsActive] = useState<boolean>(settings.activity.isActive)
  const t = useTranslations('Settings.Activity')
  const tCommon = useTranslations('Common')
  const initialState: ActivityFormState = {
    message: '',
    status: '',
    fields: {
      ...settings.activity,
    },
  }
  const [formState, formAction] = useActionState<ActivityFormState, FormData>(
    saveActivitySettings,
    initialState,
  )
  const activitySettings = {
    ...settings.activity,
    ...formState.fields,
  }

  return (
    <SettingsForm
      formState={formState}
      formAction={formAction}
      isComplete={activitySettings.complete}
    >
      <section className='group-settings group'>
        <h2 className='heading-settings'>{tCommon('status')}</h2>
        <Switch
          key={`is-active-${activitySettings.isActive}`}
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
      </section>
      {isActive && (
        <section className='group-settings group'>
          <h2 className='heading-settings'>{t('privacy')}</h2>
          <Switch
            key={`anonymized-${activitySettings.isAnonymized}`}
            className='switch items-start'
            name='isAnonymized'
            defaultSelected={activitySettings.isAnonymized}
          >
            <div className='indicator'></div>
            <span className='label'>
              <span className='label-wrapper'>{t('anonymize')}</span>
              <small>{t('anonymizeDescription')}</small>
            </span>
          </Switch>
        </section>
      )}
    </SettingsForm>
  )
}

'use client'

import {
  ActivitySettings,
  Settings,
  SettingsFormInitialState,
} from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveActivitySettings from '../_actions/updateActivitySettings'

type Props = {
  settings: Settings
}

type ActivityFormState = SettingsFormInitialState<ActivitySettings>

export default function ActivitySettingsForm({ settings }: Props) {
  const t = useTranslations('Settings.Activity')
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
        <h2 className='heading-settings'>{t('config')}</h2>
        <Switch
          key={`activity-active-${activitySettings.isActive}`}
          className='switch items-start'
          name='isActive'
          defaultSelected={activitySettings.isActive}
        >
          <div className='indicator'></div>
          <span className='label'>
            <span className='label-wrapper'>{t('enableActivityPage')}</span>
            <small>{t('enableActivityPageDescription')}</small>
          </span>
        </Switch>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('privacy')}</h2>
        <Switch
          key={`activity-anonymized-${activitySettings.isAnonymized}`}
          className='switch items-start'
          name='isAnonymized'
          defaultSelected={activitySettings.isAnonymized}
        >
          <div className='indicator'></div>
          <span className='label'>
            <span className='label-wrapper'>{t('anonymizeUsers')}</span>
            <small>{t('anonymizeUsersDescription')}</small>
          </span>
        </Switch>
      </section>
    </SettingsForm>
  )
}
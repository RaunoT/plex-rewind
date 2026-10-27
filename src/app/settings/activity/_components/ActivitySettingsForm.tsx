'use client'

import {
  ActivitySettings,
  PublicSettings,
  SettingsFormInitialState,
} from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveActivitySettings from '../_actions/updateActivitySettings'

type Props = {
  settings: PublicSettings
}

type ActivityFormState = SettingsFormInitialState<Partial<ActivitySettings>>

export default function ActivitySettingsForm({ settings }: Props) {
  const [isActive, setIsActive] = useState<boolean>(settings.activity.isActive)
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
      isSetup={!activitySettings.complete}
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
          <Switch
            key={`admin-only-${activitySettings.isAdminOnly}`}
            className='switch items-start'
            name='isAdminOnly'
            defaultSelected={activitySettings.isAdminOnly}
          >
            <div className='indicator'></div>
            <span className='label'>
              <span className='label-wrapper'>{tCommon('adminOnly')}</span>
            </span>
          </Switch>
        )}
      </section>
    </SettingsForm>
  )
}

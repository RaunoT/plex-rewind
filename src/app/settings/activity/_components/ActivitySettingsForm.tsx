'use client'

import {
  ActivitySettings,
  Settings,
  SettingsFormInitialState,
} from '@/types/settings'
import { isInitialSetup } from '@/utils/helpers'
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
  const initialSetupMode = isInitialSetup(settings)
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
      isSetup={!activitySettings.complete && initialSetupMode}
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
          <div className='indicator'></div>
          <span className='label'>
            <span className='label-wrapper'>{tCommon('enabled')}</span>
          </span>
        </Switch>
      </section>
    </SettingsForm>
  )
}

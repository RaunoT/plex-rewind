'use client'

import DatePicker from '@/components/DatePicker'
import {
  PublicSettings,
  RewindSettings,
  SettingsFormInitialState,
} from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveRewindSettings from '../_actions/updateRewindSettings'
import RewindMusicUpload from './RewindMusicUpload'

type Props = {
  settings: PublicSettings
}

type RewindFormState = SettingsFormInitialState<Partial<RewindSettings>>

export default function RewindSettingsForm({ settings }: Props) {
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
      isSetup={!rewindSettings.complete}
    >
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
        {isActive && (
          <Switch
            key={`admin-only-${rewindSettings.isAdminOnly}`}
            className='switch items-start'
            name='isAdminOnly'
            defaultSelected={rewindSettings.isAdminOnly}
          >
            <div className='indicator' />
            <span className='label'>
              <span className='label-wrapper'>{tCommon('adminOnly')}</span>
            </span>
          </Switch>
        )}
      </section>
      {isActive && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('cards')}</h2>
            <Switch
              key={`libraries-size-count-${rewindSettings.isLibrariesSizeAndCountActive}`}
              className='switch'
              name='isLibrariesSizeAndCountActive'
              defaultSelected={rewindSettings.isLibrariesSizeAndCountActive}
            >
              <div className='indicator' />
              <span className='label'>
                <span className='label-wrapper'>
                  {t('librariesSizeAndCountCard')}
                </span>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('music')}</h2>
            <Switch
              key={`theme-music-${rewindSettings.isThemeMusicActive}`}
              className='switch items-start'
              name='isThemeMusicActive'
              defaultSelected={rewindSettings.isThemeMusicActive}
            >
              <div className='indicator' />
              <span className='label'>
                <span className='label-wrapper'>{t('themeMusic')}</span>
                <small>{t('themeMusicDescription')}</small>
              </span>
            </Switch>
            <RewindMusicUpload initialMusic={settings.rewind.music} />
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('effects')}</h2>
            <Switch
              key={`snow-${rewindSettings.isSnowActive}`}
              className='switch'
              name='isSnowActive'
              defaultSelected={rewindSettings.isSnowActive}
            >
              <div className='indicator' />
              <span className='label'>
                <span className='label-wrapper'>{t('snow')}</span>
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
          </section>
        </>
      )}
    </SettingsForm>
  )
}

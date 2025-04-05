'use client'

import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { Bars2Icon } from '@heroicons/react/24/outline'
import { kebabCase } from 'lodash'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import { ReactSortable } from 'react-sortablejs'
import SettingsForm from '../../_components/SettingsForm'
import saveGeneralSettings from '../_actions/updateGeneralSettings'

type SortableLibrary = TautulliLibrary & { id: TautulliLibrary['section_id'] }

type Props = {
  settings: Settings
  libraries: TautulliLibrary[]
}

export default function GeneralSettingsForm({ settings, libraries }: Props) {
  const generalSettings = settings.general
  const [librariesState, setLibrariesState] = useState<SortableLibrary[]>(
    () => {
      const activeLibraries = generalSettings.activeLibraries
        .map((libName) =>
          libraries.find((lib) => kebabCase(lib.section_name) === libName),
        )
        .filter((lib): lib is TautulliLibrary => !!lib)
      const inactiveLibraries = libraries.filter(
        (lib) =>
          !generalSettings.activeLibraries.includes(
            kebabCase(lib.section_name),
          ),
      )

      return [...activeLibraries, ...inactiveLibraries].map((lib) => ({
        ...lib,
        id: lib.section_id,
      }))
    },
  )
  const t = useTranslations('Settings.General')

  return (
    <SettingsForm
      settings={settings}
      action={saveGeneralSettings}
      hideSubmit={!libraries.length}
    >
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('libraries')}</h2>
        {libraries.length ? (
          <CheckboxGroup
            className='input-wrapper'
            name='activeLibraries'
            defaultValue={generalSettings.activeLibraries}
          >
            <ReactSortable
              list={librariesState}
              setList={setLibrariesState}
              className='peer mr-auto flex flex-wrap gap-2'
              handle='.drag-handle'
              animation={200}
            >
              {librariesState.map((library) => (
                <Checkbox
                  key={library.section_id}
                  value={kebabCase(library.section_name)}
                  className='checkbox-wrapper'
                >
                  <Bars2Icon className='drag-handle size-4 cursor-move' />
                  <div className='checkbox' aria-hidden='true'></div>
                  {library.section_name}
                </Checkbox>
              ))}
            </ReactSortable>
            <Label className='label label--start'>
              <span className='label-wrapper'>{t('activeLibraries')}</span>
            </Label>
          </CheckboxGroup>
        ) : (
          <p
            aria-live='polite'
            role='status'
            className='text-center text-neutral-400'
          >
            {t('noLibrariesMessage1')} <br />
            {t('noLibrariesMessage2')}
          </p>
        )}
      </section>
      {libraries.length > 0 && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('media')}</h2>
            <Switch
              className='switch items-start'
              name='isPostersTmdbOnly'
              defaultSelected={generalSettings.isPostersTmdbOnly}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{t('tmdbOnlyPosters')}</span>
                <small>
                  {t('tmdbOnlyPostersDescription1')}
                  <br /> {t('tmdbOnlyPostersDescription2')}
                </small>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('privacy')}</h2>
            <Switch
              className='switch items-start'
              name='isOutsideAccess'
              defaultSelected={generalSettings.isOutsideAccess}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{t('outsideAccess')}</span>
                <small>{t('outsideAccessDescription')}</small>
              </span>
            </Switch>
            <Switch
              className='switch items-start'
              name='isAnonymized'
              defaultSelected={generalSettings.isAnonymized}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{t('anonymize')}</span>
                <small>{t('anonymizeDescription')}</small>
              </span>
            </Switch>
          </section>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('analytics')}</h2>
            <label className='input-wrapper'>
              <input
                type='text'
                className='input'
                name='googleAnalyticsId'
                defaultValue={generalSettings.googleAnalyticsId}
                placeholder='G-XXXXXXXXXX'
              />
              <span className='label'>
                {/* eslint-disable-next-line react/jsx-no-literals */}
                <span className='label-wrapper'>Google Analytics ID</span>
              </span>
            </label>
          </section>
        </>
      )}
    </SettingsForm>
  )
}

'use client'

import {
  GeneralSettings,
  PublicSettings,
  SettingsFormInitialState,
} from '@/types/settings'
import { TautulliLibrary, TautulliUser } from '@/types/tautulli'
import {
  Bars2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { kebabCase } from 'lodash'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import { ReactSortable } from 'react-sortablejs'
import SettingsForm from '../../_components/SettingsForm'
import saveGeneralSettings from '../_actions/updateGeneralSettings'

type SortableLibrary = TautulliLibrary & { id: TautulliLibrary['section_id'] }

type Props = {
  settings: PublicSettings
  libraries: TautulliLibrary[]
  users: TautulliUser[]
}

type GeneralFormState = SettingsFormInitialState<GeneralSettings>

export default function GeneralSettingsForm({
  settings,
  libraries,
  users,
}: Props) {
  const [librariesState, setLibrariesState] = useState<SortableLibrary[]>(
    () => {
      const activeLibraries = settings.general.activeLibraries
        .map((libName) =>
          libraries.find((lib) => kebabCase(lib.section_name) === libName),
        )
        .filter((lib): lib is TautulliLibrary => !!lib)
      const inactiveLibraries = libraries.filter(
        (lib) =>
          !settings.general.activeLibraries.includes(
            kebabCase(lib.section_name),
          ),
      )

      return [...activeLibraries, ...inactiveLibraries].map((lib) => ({
        ...lib,
        id: lib.section_id,
      }))
    },
  )
  const [moveAnnouncement, setMoveAnnouncement] = useState<string>('')
  const librariesRef = useRef<HTMLDivElement>(null)
  const focusAfterMoveRef = useRef<string | null>(null)
  const t = useTranslations('Settings.General')
  const initialState: GeneralFormState = {
    message: '',
    status: '',
    fields: {
      ...settings.general,
    },
  }
  const [formState, formAction] = useActionState<GeneralFormState, FormData>(
    saveGeneralSettings,
    initialState,
  )
  const generalSettings = {
    ...settings.general,
    ...formState.fields,
  }

  useEffect(() => {
    const focusTarget = focusAfterMoveRef.current

    if (focusTarget) {
      focusAfterMoveRef.current = null
      librariesRef.current
        ?.querySelector<HTMLButtonElement>(`[data-move='${focusTarget}']`)
        ?.focus()
    }
  }, [librariesState])

  function handleSortEnd() {
    setMoveAnnouncement('')
    librariesRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
  }

  function moveLibrary(index: number, offset: -1 | 1) {
    const target = index + offset

    if (target < 0 || target >= librariesState.length) {
      return
    }

    const next = [...librariesState]
    const [moved] = next.splice(index, 1)
    const isAtEdge = target === 0 || target === next.length
    const direction = offset === -1 ? 'up' : 'down'

    next.splice(target, 0, moved)
    focusAfterMoveRef.current = `${moved.section_id}-${
      isAtEdge ? (direction === 'up' ? 'down' : 'up') : direction
    }`
    setLibrariesState(next)
    setMoveAnnouncement(
      t('movedTo', {
        name: moved.section_name,
        position: target + 1,
        total: next.length,
      }),
    )
  }

  return (
    <SettingsForm
      formState={formState}
      formAction={formAction}
      hideSubmit={!libraries.length}
      isSetup={!generalSettings.complete}
    >
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('config')}</h2>
        <label className='input-wrapper'>
          <input
            key={`server-name-${generalSettings.serverName}`}
            type='text'
            className='input'
            name='serverName'
            defaultValue={generalSettings.serverName}
            placeholder='Plex Rewind'
          />
          <span className='label'>
            <span className='label-wrapper'>{t('serverName')}</span>
          </span>
        </label>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>{t('libraries')}</h2>
        {libraries.length ? (
          <CheckboxGroup
            key={`active-libraries-${generalSettings.activeLibraries.join(',')}`}
            ref={librariesRef}
            className='input-wrapper'
            name='activeLibraries'
            defaultValue={generalSettings.activeLibraries}
          >
            <ReactSortable
              list={librariesState}
              setList={setLibrariesState}
              onEnd={handleSortEnd}
              className='peer mr-auto flex flex-col gap-2'
              handle='.drag-handle'
              animation={200}
              // Force the pointer-based fallback on all platforms. React Aria's
              // Checkbox calls preventDefault on pointer events, which blocks the
              // browser's native HTML5 drag on desktop (mobile already uses this
              // fallback, which is why it kept working there).
              forceFallback
              // Append the drag clone to <body> so positioned/transformed
              // ancestors don't offset the ghost from the cursor.
              fallbackOnBody
            >
              {librariesState.map((library, index) => (
                <div
                  key={`library-${library.section_id}`}
                  className='flex items-center gap-1'
                >
                  <div className='drag-handle flex size-8 shrink-0 cursor-move touch-none items-center justify-center sm:size-6'>
                    <Bars2Icon className='size-5' />
                  </div>
                  <Checkbox
                    value={kebabCase(library.section_name)}
                    className='checkbox-wrapper flex-1'
                  >
                    <div className='checkbox' aria-hidden='true'></div>
                    {library.section_name}
                  </Checkbox>
                  <button
                    type='button'
                    className='link-light focus-visible:focus-ring ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg disabled:pointer-events-none disabled:opacity-30 sm:size-6'
                    aria-label={t('moveUp', { name: library.section_name })}
                    data-move={`${library.section_id}-up`}
                    disabled={index === 0}
                    onClick={() => moveLibrary(index, -1)}
                  >
                    <ChevronUpIcon className='size-5' />
                  </button>
                  <button
                    type='button'
                    className='link-light focus-visible:focus-ring flex size-8 shrink-0 items-center justify-center rounded-lg disabled:pointer-events-none disabled:opacity-30 sm:size-6'
                    aria-label={t('moveDown', { name: library.section_name })}
                    data-move={`${library.section_id}-down`}
                    disabled={index === librariesState.length - 1}
                    onClick={() => moveLibrary(index, 1)}
                  >
                    <ChevronDownIcon className='size-5' />
                  </button>
                </div>
              ))}
            </ReactSortable>
            <p aria-live='polite' role='status' className='sr-only'>
              {moveAnnouncement}
            </p>
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
              key={`posters-tmdb-${generalSettings.isPostersTmdbOnly}`}
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
            {users.length > 0 ? (
              <CheckboxGroup
                key={`excluded-users-${generalSettings.excludedUsers.join(',')}`}
                className='input-wrapper'
                name='excludedUsers'
                defaultValue={generalSettings.excludedUsers}
              >
                <div className='peer mr-auto flex flex-wrap gap-2'>
                  {users.map((user) => (
                    <Checkbox
                      key={`user-${user.user_id}`}
                      value={String(user.user_id)}
                      className='checkbox-wrapper'
                    >
                      <div className='checkbox' aria-hidden='true'></div>
                      {user.friendly_name}
                    </Checkbox>
                  ))}
                </div>
                <Label className='label label--start'>
                  <span className='label-wrapper'>{t('excludedUsers')}</span>
                  <small>{t('excludedUsersDescription')}</small>
                </Label>
              </CheckboxGroup>
            ) : (
              // Preserve saved exclusions when the user list can't be loaded so
              // submitting the form doesn't silently clear them.
              generalSettings.excludedUsers.map((userId) => (
                <input
                  key={`excluded-user-${userId}`}
                  type='hidden'
                  name='excludedUsers'
                  value={userId}
                />
              ))
            )}
            <Switch
              key={`outside-access-${generalSettings.isOutsideAccess}`}
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
              key={`anonymized-${generalSettings.isAnonymized}`}
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
                key={`analytics-id-${generalSettings.googleAnalyticsId}`}
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

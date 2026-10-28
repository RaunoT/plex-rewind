'use client'

import SourceUnreachable from '@/components/SourceUnreachable'
import StatusMessage from '@/components/StatusMessage'
import {
  GeneralSettings,
  PublicSettings,
  SettingsFormInitialState,
} from '@/types/settings'
import { TautulliLibrary, TautulliUser } from '@/types/tautulli'
import { EXTERNAL_LINK_NAMES, EXTERNAL_LINKS } from '@/utils/constants'
import { sortByLabel } from '@/utils/helpers'
import { RectangleStackIcon } from '@heroicons/react/24/outline'
import { kebabCase } from 'lodash'
import { Reorder } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'
import saveGeneralSettings from '../_actions/updateGeneralSettings'
import SortableLibrary from './SortableLibrary'

type Props = {
  settings: PublicSettings
  // Null when the source can't be reached
  libraries: TautulliLibrary[] | null
  users: Pick<TautulliUser, 'user_id' | 'friendly_name'>[]
}

type GeneralFormState = SettingsFormInitialState<GeneralSettings>

export default function GeneralSettingsForm({
  settings,
  libraries: sourceLibraries,
  users,
}: Props) {
  const isSourceReachable = sourceLibraries !== null
  const libraries = sourceLibraries ?? []
  // Saving without the library list would clear the chosen libraries
  const hasLibraries = libraries.length > 0
  const [librariesState, setLibrariesState] = useState<TautulliLibrary[]>(
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

      return [...activeLibraries, ...inactiveLibraries]
    },
  )
  const [moveAnnouncement, setMoveAnnouncement] = useState<string>('')
  const librariesRef = useRef<HTMLDivElement>(null)
  const focusAfterMoveRef = useRef<string | null>(null)
  const t = useTranslations('Settings.General')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const isSeerrActive = settings.connection.isSeerrActive
  const externalLinkOptions = sortByLabel(
    EXTERNAL_LINKS.map((site) => ({
      value: site,
      label: EXTERNAL_LINK_NAMES[site],
    })),
    locale,
  )
  const itemStatisticOptions = sortByLabel(
    [
      { value: 'year', label: tCommon('year') },
      { value: 'tmdbRating', label: tCommon('ratingBy', { provider: 'TMDB' }) },
      { value: 'imdbRating', label: tCommon('ratingBy', { provider: 'IMDb' }) },
      {
        value: 'rottenTomatoesRating',
        label: tCommon('rottenTomatoesCritics'),
      },
      {
        value: 'rottenTomatoesAudienceRating',
        label: tCommon('rottenTomatoesAudience'),
      },
      { value: 'duration', label: tCommon('duration') },
      { value: 'plays', label: tCommon('plays') },
      { value: 'users', label: tCommon('users') },
      ...(isSeerrActive
        ? [{ value: 'requests', label: tCommon('requests') }]
        : []),
    ],
    locale,
  )
  const userOptions = sortByLabel(
    users.map((user) => ({
      value: String(user.user_id),
      label: user.friendly_name,
    })),
    locale,
  )
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
      hideSubmit={!hasLibraries}
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
        {!isSourceReachable ? (
          <SourceUnreachable
            source={settings.connection.statisticsSource}
            as='h3'
            isAdmin
            isInCard
          />
        ) : hasLibraries ? (
          <CheckboxGroup
            key={`active-libraries-${generalSettings.activeLibraries.join(',')}`}
            ref={librariesRef}
            className='input-wrapper'
            name='activeLibraries'
            defaultValue={generalSettings.activeLibraries}
          >
            <Reorder.Group
              as='div'
              axis='y'
              values={librariesState}
              onReorder={setLibrariesState}
              className='peer mr-auto flex flex-col gap-2'
            >
              {librariesState.map((library, index) => (
                <SortableLibrary
                  key={`library-${library.section_id}`}
                  library={library}
                  isFirst={index === 0}
                  isLast={index === librariesState.length - 1}
                  onMove={(offset) => moveLibrary(index, offset)}
                  onDragEnd={handleSortEnd}
                />
              ))}
            </Reorder.Group>
            <p aria-live='polite' role='status' className='sr-only'>
              {moveAnnouncement}
            </p>
            <Label className='label label--start'>
              <span className='label-wrapper'>{t('activeLibraries')}</span>
            </Label>
          </CheckboxGroup>
        ) : (
          <StatusMessage
            icon={RectangleStackIcon}
            title={t('noLibrariesMessage1')}
            description={t('noLibrariesMessage2')}
            as='h3'
            isInCard
          />
        )}
      </section>
      {hasLibraries && (
        <>
          <section className='group-settings group'>
            <h2 className='heading-settings'>{t('media')}</h2>
            <Switch
              key={`posters-tmdb-${generalSettings.isPostersTmdbOnly}`}
              className='switch'
              name='isPostersTmdbOnly'
              defaultSelected={generalSettings.isPostersTmdbOnly}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{t('tmdbOnlyPosters')}</span>
              </span>
            </Switch>
            <CheckboxGroup
              key={`external-links-${generalSettings.activeExternalLinks.join(',')}`}
              className='input-wrapper'
              name='activeExternalLinks'
              defaultValue={generalSettings.activeExternalLinks}
            >
              <div className='peer checkbox-grid'>
                {externalLinkOptions.map(({ value, label }) => (
                  <Checkbox
                    key={`external-link-${value}`}
                    value={value}
                    className='checkbox-wrapper'
                  >
                    <div className='checkbox' aria-hidden='true'></div>
                    {label}
                  </Checkbox>
                ))}
              </div>
              <Label className='label label--start'>
                <span className='label-wrapper'>{t('externalLinks')}</span>
                <small>{t('externalLinksDescription')}</small>
              </Label>
            </CheckboxGroup>
            <CheckboxGroup
              key={`item-stats-${generalSettings.activeItemStatistics.join(
                ',',
              )}`}
              className='input-wrapper'
              name='activeItemStatistics'
              defaultValue={generalSettings.activeItemStatistics}
            >
              <div className='peer checkbox-grid'>
                {itemStatisticOptions.map(({ value, label }) => (
                  <Checkbox
                    key={`item-${value}`}
                    value={value}
                    className='checkbox-wrapper'
                  >
                    <div className='checkbox' aria-hidden='true'></div>
                    {label}
                  </Checkbox>
                ))}
              </div>
              <Label className='label label--start'>
                <span className='label-wrapper'>{t('itemStatistics')}</span>
              </Label>
            </CheckboxGroup>
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
                <div className='peer checkbox-grid'>
                  {userOptions.map(({ value, label }) => (
                    <Checkbox
                      key={`user-${value}`}
                      value={value}
                      className='checkbox-wrapper'
                    >
                      <div className='checkbox' aria-hidden='true'></div>
                      {label}
                    </Checkbox>
                  ))}
                </div>
                <Label className='label label--start'>
                  <span className='label-wrapper'>{t('excludedUsers')}</span>
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
              className='switch'
              name='isAnonymized'
              defaultSelected={generalSettings.isAnonymized}
            >
              <div className='indicator'></div>
              <span className='label'>
                <span className='label-wrapper'>{t('anonymizeUsers')}</span>
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

'use client'

import { saveFeaturesSettings } from '@/actions/update-feature-settings'
import { Library, Settings } from '@/types'
import { kebabCase } from 'lodash'
import { Checkbox, CheckboxGroup, Label, Switch } from 'react-aria-components'
import SettingsForm from '../../_components/SettingsForm'

type Props = {
  settings: Settings
  libraries: Library[]
}

export default function FeaturesSettingsForm({ settings, libraries }: Props) {
  const featuresSettings = settings.features
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey

  return (
    <SettingsForm settings={settings} action={saveFeaturesSettings}>
      <section className='group-settings group'>
        <h2 className='heading-settings'>General</h2>
        <CheckboxGroup
          className='input-wrapper'
          name='activeLibraries'
          defaultValue={featuresSettings.activeLibraries}
        >
          <div className='peer mr-auto flex flex-wrap gap-2'>
            {libraries.map((library) => (
              <Checkbox
                key={library.section_id}
                value={kebabCase(library.section_name)}
                className='checkbox-wrapper'
              >
                <div className='checkbox' aria-hidden='true'></div>
                {library.section_name}
              </Checkbox>
            ))}
          </div>
          <Label className='label label--start'>Libraries</Label>
        </CheckboxGroup>
        <Switch
          className='switch items-start'
          name='isPostersTmdbOnly'
          defaultSelected={featuresSettings.isPostersTmdbOnly}
        >
          <div className='indicator'></div>
          <span className='label'>
            TMDB only posters
            <small>
              Ignore Plex posters for tv/movies.
              <br /> By default, TMDB is a fallback.
            </small>
          </span>
        </Switch>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Rewind</h2>
        <Switch
          className='switch'
          name='isRewindActive'
          defaultSelected={featuresSettings.isRewindActive}
        >
          <div className='indicator' />
          <span className='label'>Enabled</span>
        </Switch>
        <Switch
          className='switch items-start'
          name='isRewindLibrariesSizeAndCountActive'
          defaultSelected={featuresSettings.isRewindLibrariesSizeAndCountActive}
        >
          <div className='indicator' />
          <span className='label'>
            Libraries size & count card
            <small>
              Disable, if you don&apos;t want to rely on Tautulli for these
              stats.
            </small>
          </span>
        </Switch>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Dashboard</h2>
        <Switch
          className='switch'
          name='isDashboardActive'
          defaultSelected={featuresSettings.isDashboardActive}
        >
          <div className='indicator'></div>
          <span className='label'>Enabled</span>
        </Switch>
        <Switch
          className='switch'
          name='isUsersPageActive'
          defaultSelected={featuresSettings.isUsersPageActive}
        >
          <div className='indicator'></div>
          <span className='label'>Users page</span>
        </Switch>
        <CheckboxGroup
          className='input-wrapper'
          name='activeDashboardItemStatistics'
          defaultValue={
            featuresSettings.activeDashboardItemStatistics || [
              'year',
              'rating',
              'duration',
              'plays',
              'users',
              'requests',
            ]
          }
        >
          <div className='peer mr-auto flex flex-wrap gap-2'>
            <Checkbox value='year' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Year
            </Checkbox>
            <Checkbox value='rating' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Rating
            </Checkbox>
            <Checkbox value='duration' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Duration
            </Checkbox>
            <Checkbox value='plays' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Plays
            </Checkbox>
            <Checkbox value='users' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Users
            </Checkbox>
            {isOverseerrActive && (
              <Checkbox value='requests' className='checkbox-wrapper'>
                <div className='checkbox' aria-hidden='true'></div>
                Requests
              </Checkbox>
            )}
          </div>
          <Label className='label label--start'>Item statistics</Label>
        </CheckboxGroup>
        <CheckboxGroup
          className='input-wrapper'
          name='activeDashboardTotalStatistics'
          defaultValue={
            featuresSettings.activeDashboardTotalStatistics || [
              'size',
              'duration',
              'count',
              'requests',
            ]
          }
        >
          <div className='peer mr-auto flex flex-wrap gap-2'>
            <Checkbox value='size' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Size
            </Checkbox>
            <Checkbox value='duration' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Duration
            </Checkbox>
            <Checkbox value='count' className='checkbox-wrapper'>
              <div className='checkbox' aria-hidden='true'></div>
              Count
            </Checkbox>
            {isOverseerrActive && (
              <Checkbox value='requests' className='checkbox-wrapper'>
                <div className='checkbox' aria-hidden='true'></div>
                Requests
              </Checkbox>
            )}
          </div>
          <Label className='label label--start'>Totals statistics</Label>
        </CheckboxGroup>
        <div className='input-wrapper'>
          <div className='select-wrapper'>
            <select
              className='input'
              name='dashboardDefaultPeriod'
              defaultValue={featuresSettings.dashboardDefaultPeriod || 'custom'}
              required
            >
              <option value='7days'>7 days</option>
              <option value='custom'>Custom period</option>
              <option value='pastYear'>Past year</option>
              <option value='allTime'>All time</option>
            </select>
          </div>
          <span className='label required'>Default period</span>
        </div>
        <label className='input-wrapper'>
          <input
            type='number'
            className='input'
            name='dashboardCustomPeriod'
            defaultValue={featuresSettings.dashboardCustomPeriod || '30'}
            placeholder='30'
            min='1'
            max='3000'
            required
          />
          <span className='label'>Custom period</span>
        </label>
      </section>
      <section className='group-settings group'>
        <h2 className='heading-settings'>Miscellaneous</h2>
        <label className='input-wrapper'>
          <input
            type='text'
            className='input'
            name='googleAnalyticsId'
            defaultValue={featuresSettings.googleAnalyticsId}
            placeholder='G-XXXXXXXXXX'
          />
          <span className='label'>Google Analytics ID</span>
        </label>
      </section>
    </SettingsForm>
  )
}

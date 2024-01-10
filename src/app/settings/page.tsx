'use client'

import githubSvg from '@/assets/github.svg'
import { parseDate } from '@internationalized/date'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  Checkbox,
  CheckboxGroup,
  DateField,
  DateInput,
  DateSegment,
  Label,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from 'react-aria-components'
import packageJson from '../../../package.json'
import PageTitle from '../_components/PageTitle'

export default function Page() {
  const [formData, setFormData] = useState({
    application_url: 'http://localhost:8383',
    next_auth_secret: '',
    tautulli_url: '',
    tautulli_api_key: '',
    overseerr_url: '',
    overseerr_api_key: '',
    tmdb_api_key: '',
    plex_hostname: 'localhost',
    plex_port: '32400',
    rewind: 'true',
    dashboard: 'true',
    dashboard_users_page: 'true',
    google_analytics_id: '',
    dashboard_statistics: '',
    libraries: '',
    statistics_start_date: parseDate('2018-01-01'),
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    console.log(JSON.stringify(formData))

    // const res = await fetch('/api/settings', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData),
    // })

    // const data = await res.json()
    // console.log(data)
  }

  function handleSwitchChange(name: string, isSelected: boolean) {
    setFormData({
      ...formData,
      [name]: String(isSelected),
    })
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    })
  }

  useEffect(() => {
    console.log(formData)
  }, [formData])

  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle title='Settings' />

      <Tabs defaultSelectedKey='connection'>
        <TabList aria-label='Manage your application' className='nav'>
          <Tab className='nav-link cursor-pointer uppercase' id='connection'>
            Connection
          </Tab>
          <Tab className='nav-link cursor-pointer uppercase' id='features'>
            Features
          </Tab>
        </TabList>

        <form className='my-3' onSubmit={handleSubmit}>
          <TabPanel id='connection'>
            <div className='glass-sheet grid gap-4'>
              <label className='input-wrapper'>
                <span className='label'>Application URL</span>
                <input
                  type='url'
                  className='input'
                  placeholder='http://localhost:8383'
                  required
                  name='application_url'
                  value={formData.application_url}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Next Auth secret</span>
                <input
                  type='password'
                  className='input'
                  name='next_auth_secret'
                  required
                  value={formData.next_auth_secret}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Tautulli URL</span>
                <input
                  type='url'
                  className='input'
                  placeholder='http://192.168.1.2:8181'
                  name='tautulli_url'
                  required
                  value={formData.tautulli_url}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Tautulli API key</span>
                <input
                  type='password'
                  className='input'
                  name='tautulli_api_key'
                  required
                  value={formData.tautulli_api_key}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Overseerr URL</span>
                <input
                  type='url'
                  className='input'
                  placeholder='http://192.168.1.2:5055'
                  name='overseerr_url'
                  required
                  value={formData.overseerr_url}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Overseerr API key</span>
                <input
                  type='password'
                  className='input'
                  name='overseerr_api_key'
                  required
                  value={formData.overseerr_api_key}
                  onChange={handleInputChange}
                />
              </label>

              <label className='input-wrapper'>
                <span className='label'>TMDB API key</span>
                <input
                  type='password'
                  className='input'
                  name='tmdb_api_key'
                  required
                  value={formData.tmdb_api_key}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Plex hostname</span>
                <input
                  type='text'
                  className='input'
                  placeholder='localhost'
                  name='plex_hostname'
                  required
                  value={formData.plex_hostname}
                  onChange={handleInputChange}
                />
              </label>
              <label className='input-wrapper'>
                <span className='label'>Plex port</span>
                <input
                  type='text'
                  className='input'
                  placeholder='32400'
                  name='plex_port'
                  required
                  value={formData.plex_port}
                  onChange={handleInputChange}
                />
              </label>
            </div>
          </TabPanel>
          <TabPanel id='features'>
            <div className='glass-sheet grid gap-4'>
              <Switch
                className='switch'
                name='rewind'
                defaultSelected
                value={formData.rewind}
                onChange={(isSelected) =>
                  handleSwitchChange('rewind', isSelected)
                }
              >
                <div className='indicator' />
                <span className='label'>Rewind</span>
              </Switch>
              <Switch
                className='switch'
                name='dashboard'
                defaultSelected
                value={formData.dashboard}
                onChange={(isSelected) =>
                  handleSwitchChange('dashboard', isSelected)
                }
              >
                <div className='indicator'></div>
                <span className='label'>Dashboard</span>
              </Switch>
              <Switch
                className='switch'
                name='dashboard_users_page'
                defaultSelected
                value={formData.dashboard_users_page}
                onChange={(isSelected) =>
                  handleSwitchChange('dashboard_users_page', isSelected)
                }
              >
                <div className='indicator'></div>
                <span className='label'>Users page</span>
              </Switch>
              <label className='input-wrapper'>
                <span className='label'>Libraries</span>
                <input
                  type='text'
                  className='input'
                  name='libraries'
                  value={formData.libraries}
                  onChange={handleInputChange}
                />
              </label>
              {/* <label className='input-wrapper'>
                <span className='label'>Dashboard statistics</span>
                <input
                  type='text'
                  className='input'
                  name='dashboard_statistics'
                  value={formData.dashboard_statistics}
                  onChange={handleInputChange}
                />
              </label> */}
              <CheckboxGroup className='input-wrapper'>
                <Label className='label'>Dashboard statistics</Label>
                <div className='flex flex-wrap gap-2'>
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
                  <Checkbox value='requests' className='checkbox-wrapper'>
                    <div className='checkbox' aria-hidden='true'></div>
                    Requests
                  </Checkbox>
                </div>
              </CheckboxGroup>

              <DateField
                className='input-wrapper'
                // value={formData.statistics_start_date}
                defaultValue={formData.statistics_start_date}
              >
                <Label className='label'>Statistics start date</Label>
                <DateInput className='datefield'>
                  {(segment) => <DateSegment segment={segment} />}
                </DateInput>
              </DateField>
              <label className='input-wrapper'>
                <span className='label'>Google Analytics ID</span>
                <input
                  type='text'
                  className='input'
                  name='google_analytics_id'
                  value={formData.google_analytics_id}
                  onChange={handleInputChange}
                />
              </label>
            </div>
          </TabPanel>
        </form>
      </Tabs>

      <button className='button ml-auto w-full sm:w-fit' type='submit'>
        Save
      </button>

      <div className='mt-8 flex flex-col gap-2 sm:items-center'>
        <a
          href='https://github.com/RaunoT/plex-rewind/issues'
          target='_blank'
          className='link inline-flex gap-2'
        >
          <Image src={githubSvg} alt='GitHub' className='size-6' />
          If you encounter any issues, please report them on GitHub.
        </a>

        <a
          className='ml-8 w-fit font-mono text-xs text-white/25 sm:ml-0'
          href='https://github.com/RaunoT/plex-rewind/releases'
          target='_blank'
        >
          v{packageJson.version}
        </a>
      </div>
    </div>
  )
}

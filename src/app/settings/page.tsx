'use client'

import githubSvg from '@/assets/github.svg'
import Switch from '@/components/Switch'
import * as Tabs from '@radix-ui/react-tabs'
import Image from 'next/image'
import packageJson from '../../../package.json'
import PageTitle from '../_components/PageTitle'

export default function Page() {
  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle title='Settings' />

      <Tabs.Root defaultValue='configuration'>
        <Tabs.List aria-label='Manage your application' className='nav'>
          <Tabs.Trigger className='link uppercase' value='configuration'>
            Configuration
          </Tabs.Trigger>
          <Tabs.Trigger className='link uppercase' value='features'>
            Features
          </Tabs.Trigger>
        </Tabs.List>

        <div className='my-3'>
          <Tabs.Content value='configuration'>
            <div className='glass-sheet grid gap-4'>
              <label className='input-wrapper' htmlFor='application_url'>
                <span className='label'>Application URL</span>
                <input
                  type='text'
                  className='input'
                  placeholder='http://localhost:8383'
                  required
                  id='application_url'
                  name='application_url'
                />
              </label>
              <label className='input-wrapper' htmlFor='next_auth_secret'>
                <span className='label'>Next Auth secret</span>
                <input
                  type='password'
                  className='input'
                  id='next_auth_secret'
                  name='next_auth_secret'
                  required
                />
              </label>
              <label className='input-wrapper' htmlFor='tautulli_url'>
                <span className='label'>Tautulli URL</span>
                <input
                  type='text'
                  className='input'
                  placeholder='http://192.168.1.2:8181'
                  id='tautulli_url'
                  name='tautulli_url'
                  required
                />
              </label>
              <label className='input-wrapper' htmlFor='tautulli_api_key'>
                <span className='label'>Tautulli API key</span>
                <input
                  type='password'
                  className='input'
                  id='tautulli_api_key'
                  name='tautulli_api_key'
                  required
                />
              </label>
              <label className='input-wrapper' htmlFor='overseerr_url'>
                <span className='label'>Overseerr URL</span>
                <input
                  type='text'
                  className='input'
                  placeholder='http://192.168.1.2:5055'
                  id='overseerr_url'
                  name='overseerr_url'
                  required
                />
              </label>
              <label className='input-wrapper' htmlFor='overseerr_api_key'>
                <span className='label'>Overseerr API key</span>
                <input
                  type='password'
                  className='input'
                  id='overseerr_api_key'
                  name='overseerr_api_key'
                  required
                />
              </label>

              <label className='input-wrapper' htmlFor='tmdb_api_key'>
                <span className='label'>TMDB API key</span>
                <input
                  type='password'
                  className='input'
                  id='tmdb_api_key'
                  name='tmdb_api_key'
                  required
                />
              </label>
              <label className='input-wrapper' htmlFor='plex_hostname'>
                <span className='label'>Plex hostname</span>
                <input
                  type='text'
                  className='input'
                  placeholder='localhost'
                  id='plex_hostname'
                  name='plex_hostname'
                  required
                />
              </label>
              <label className='input-wrapper' htmlFor='plex_port'>
                <span className='label'>Plex port</span>
                <input
                  type='text'
                  className='input'
                  placeholder='32400'
                  id='plex_port'
                  name='plex_port'
                  required
                />
              </label>
            </div>
          </Tabs.Content>
          <Tabs.Content value='features'>
            <div className='glass-sheet grid gap-4'>
              <div className='flex gap-4'>
                <label className='input-wrapper' htmlFor='rewind'>
                  <span className='label'>Rewind</span>
                  <Switch id='rewind' name='rewind' />
                </label>
                <label className='input-wrapper' htmlFor='dashboard'>
                  <span className='label'>Dashboard</span>
                  <Switch id='dashboard' name='dashboard' />
                </label>
                <label className='input-wrapper' htmlFor='dashboard_users_page'>
                  <span className='label'>Users page</span>
                  <Switch
                    id='dashboard_users_page'
                    name='dashboard_users_page'
                  />
                </label>
              </div>
              <label className='input-wrapper' htmlFor='google_analytics_id'>
                <span className='label'>Google Analytics ID</span>
                <input
                  type='text'
                  className='input'
                  id='google_analytics_id'
                  name='google_analytics_id'
                />
              </label>
              <label
                className='input-wrapper'
                htmlFor='excluded_dashboard_statistics'
              >
                <span className='label'>Excluded Dashboard statistics</span>
                <input
                  type='text'
                  className='input'
                  id='excluded_dashboard_statistics'
                  name='excluded_dashboard_statistics'
                />
              </label>
              <label className='input-wrapper' htmlFor='excluded_libraries'>
                <span className='label'>Excluded libraries</span>
                <input
                  type='text'
                  className='input'
                  id='excluded_libraries'
                  name='excluded_libraries'
                />
              </label>
              <label className='input-wrapper' htmlFor='statistics_start_date'>
                <span className='label'>Statistics start date</span>
                <input
                  type='text'
                  className='input'
                  id='statistics_start_date'
                  name='statistics_start_date'
                />
              </label>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>

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

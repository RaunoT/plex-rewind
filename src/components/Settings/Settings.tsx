import githubSvg from '@/assets/github.svg'
import { CogIcon, XCircleIcon } from '@heroicons/react/24/outline'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import Image from 'next/image'
import packageJson from '../../../package.json'

export default function Settings() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className='absolute right-3 top-3 sm:right-4 sm:top-4'>
        <CogIcon className='size-5 lg:size-6' />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 flex items-center justify-center bg-black/75 p-4'>
          <Dialog.Content className='glass-sheet max-h-full w-full max-w-screen-lg overflow-y-auto'>
            <Dialog.Title className='text-2xl sm:mb-2 lg:text-4xl'>
              Settings
            </Dialog.Title>
            <Dialog.Description className='mb-8 text-neutral-300'>
              Adjust your application settings.
            </Dialog.Description>

            <Tabs.Root defaultValue='configuration'>
              <Tabs.List
                aria-label='Manage your application'
                className='nav mb-4 justify-start'
              >
                <Tabs.Trigger className='link uppercase' value='configuration'>
                  Configuration
                </Tabs.Trigger>
                <Tabs.Trigger className='link uppercase' value='features'>
                  Features
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value='configuration' className='form'>
                <label className='block'>
                  <span className='label'>Tautulli URL</span>
                  <input type='text' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>Tautulli API key</span>
                  <input type='password' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>Overseerr URL</span>
                  <input type='text' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>Overseerr API key</span>
                  <input type='password' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>TMDB API key</span>
                  <input type='password' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>Plex hostname</span>
                  <input
                    type='text'
                    className='input'
                    placeholder='localhost'
                  />
                </label>
                <label className='block'>
                  <span className='label'>Plex port</span>
                  <input type='text' className='input' placeholder='32400' />
                </label>
              </Tabs.Content>
              <Tabs.Content value='features' className='form'>
                <label className='block'>
                  <span className='label'>Google Analytics ID</span>
                  <input type='text' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>Disable Rewind</span>
                  <input type='text' className='input' />
                </label>
                <label className='block'>
                  <span className='label'>Disable Dashboard</span>
                  <input type='text' className='input' />
                </label>
              </Tabs.Content>
            </Tabs.Root>

            <div className='flex flex-col justify-between gap-2 sm:flex-row sm:items-end'>
              <a
                href='https://github.com/RaunoT/plex-rewind'
                target='_blank'
                className='link mt-8 inline-flex flex-col gap-2 sm:flex-row'
              >
                <Image src={githubSvg} alt='GitHub' className='size-6' />
                If you encounter any issues, please report them on GitHub.
              </a>
              <a
                className='mt-2 font-mono text-xs text-white/25'
                href='https://github.com/RaunoT/plex-rewind/releases'
                target='_blank'
              >
                v{packageJson.version}
              </a>
            </div>

            <div className='absolute bottom-0 right-3 top-0 sm:right-4'>
              <Dialog.Close className='sticky top-0 '>
                <XCircleIcon className='size-5 lg:size-6' />
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

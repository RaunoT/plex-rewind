import githubSvg from '@/assets/github.svg'
import { CogIcon, XCircleIcon } from '@heroicons/react/24/outline'
import * as Dialog from '@radix-ui/react-dialog'
import Image from 'next/image'

export default function Settings() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className='absolute right-3 top-3 sm:right-4 sm:top-4'>
        <CogIcon className='size-5 lg:size-6' />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 flex items-center justify-center bg-black/75 p-4'>
          <Dialog.Content className='glass-sheet w-full max-w-screen-lg'>
            <Dialog.Title className='text-2xl sm:mb-2 lg:text-4xl'>
              Settings
            </Dialog.Title>
            <Dialog.Description className='mb-5 text-neutral-300'>
              Adjust your application settings.
            </Dialog.Description>

            <p>WIP</p>

            <a
              href='https://github.com/RaunoT/plex-rewind'
              target='_blank'
              className='link mt-6 inline-flex flex-col gap-2 sm:flex-row'
            >
              <Image src={githubSvg} alt='GitHub' className='size-6' />
              In case you encounter any issues, please report them on GitHub.
            </a>
            <Dialog.Close className='absolute right-3 top-3 sm:right-4 sm:top-4'>
              <XCircleIcon className='size-5 lg:size-6' />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

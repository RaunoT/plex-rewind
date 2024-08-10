import githubSvg from '@/assets/github.svg'
import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import { checkRequiredSettings } from '@/utils/helpers'
import { CurrencyEuroIcon, HeartIcon } from '@heroicons/react/24/outline'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'
import SettingsNav from './_components/SettingsNav'
import SetupNav from './_components/SetupNav'

type Props = {
  children: ReactNode
}

export default async function SettingsLayout({ children }: Props) {
  const session = await getServerSession(authOptions)
  const settings = getSettings()
  const version = await getVersion()
  const missingSetting = checkRequiredSettings(settings)

  if (!session?.user?.isAdmin && !missingSetting) {
    redirect('/')
  }

  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle
        title={missingSetting ? "Let's get started" : 'Settings'}
        noBack={!!missingSetting}
      />
      {!missingSetting && <SettingsNav />}
      {children}

      {missingSetting ? (
        <SetupNav settings={settings} />
      ) : (
        <div className='glass-sheet mt-4 flex flex-col flex-wrap justify-between gap-3 py-4 sm:flex-row'>
          <a
            href='https://www.paypal.com/paypalme/raunot'
            target='_blank'
            className='link-light inline-flex items-center gap-2'
          >
            <CurrencyEuroIcon className='size-6 text-yellow-500' />
            Buy me a coffee
          </a>
          <a
            href='https://www.patreon.com/PlexRewind'
            target='_blank'
            className='link-light inline-flex items-center gap-2'
          >
            <HeartIcon className='size-6 text-red-500' />
            Become a sponsor
          </a>
          <a
            href='https://github.com/RaunoT/plex-rewind/issues'
            target='_blank'
            className='link-light inline-flex items-center gap-2'
          >
            <Image src={githubSvg} alt='GitHub' className='size-[24px] p-0.5' />
            Report an issue
          </a>
        </div>
      )}

      <a
        className='link mx-auto mt-4 block w-fit text-center text-sm'
        href='https://github.com/RaunoT/plex-rewind/releases'
        target='_blank'
      >
        {version.hasUpdate && <span className='block'>Update available</span>}
        <span className='font-mono text-xs'>
          {version.currentVersion}
          {version.hasUpdate && ` → ${version.latestVersion}`}
        </span>
      </a>
    </div>
  )
}

import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'
import SettingsNav from './_components/SettingsNav'

type Props = {
  children: ReactNode
}

export default async function SettingsLayout({ children }: Props) {
  const session = await getServerSession(authOptions)
  const settings = await getSettings()
  const version = await getVersion()

  if (!session?.user?.isAdmin && settings.test) {
    redirect('/')
  }

  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle
        title={settings.test ? 'Settings' : "Let's get started"}
        noBack
      />
      {settings.test && <SettingsNav />}
      {children}

      <a
        className='mx-auto mt-4 block w-fit text-center text-sm text-white/25'
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

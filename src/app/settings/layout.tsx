import githubSvg from '@/assets/github.svg'
import { settings } from '@/config/config'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import packageJson from '../../../package.json'
import PageTitle from '../_components/PageTitle'
import SettingsNav from './_components/SettingsNav'

type Props = {
  children: ReactNode
}

export default async function SettingsLayout({ children }: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin && settings.test) {
    redirect('/')
  }

  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle title={settings.test ? 'Settings' : "Let's get started"} />
      {settings.test && <SettingsNav />}
      {children}
      <div className='mt-8 flex flex-col items-center gap-2'>
        <a
          href='https://github.com/RaunoT/plex-rewind/issues'
          target='_blank'
          className='link inline-flex gap-2'
        >
          <Image src={githubSvg} alt='GitHub' className='size-6' />
          Report an issue on GitHub
        </a>

        <a
          className='w-fit font-mono text-xs text-white/25'
          href='https://github.com/RaunoT/plex-rewind/releases'
          target='_blank'
        >
          v{packageJson.version}
        </a>
      </div>
    </div>
  )
}

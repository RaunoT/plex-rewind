import githubSvg from '@/assets/github.svg'
import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import getVersion from '@/utils/getVersion'
import { checkRequiredSettings } from '@/utils/helpers'
import { CurrencyEuroIcon, HeartIcon } from '@heroicons/react/24/outline'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'
import SettingsNav from './_components/SettingsNav'

type Props = {
  children: ReactNode
}

export default async function SettingsLayout({ children }: Props) {
  const session = await getServerSession(authOptions)
  const settings = getSettings()
  const version = await getVersion()
  const missingSetting = checkRequiredSettings(settings)
  const t = await getTranslations('Settings')

  if (
    !session?.user.isAdmin &&
    missingSetting !== 'connection.tautulliUrl' &&
    missingSetting !== 'connection.tautulliApiKey'
  ) {
    return notFound()
  }

  return (
    <div className='mb-auto w-full max-w-screen-sm'>
      <PageTitle
        title={missingSetting ? t('getStarted') : t('title')}
        noBack={!!missingSetting}
      />
      <SettingsNav settings={settings} />
      {children}

      <div className='glass-sheet mt-4 flex flex-col flex-wrap justify-between gap-3 py-4 sm:flex-row'>
        <a
          href='https://www.paypal.com/paypalme/raunot'
          target='_blank'
          className='link-light inline-flex items-center gap-2'
        >
          <CurrencyEuroIcon className='size-6 text-yellow-500' />
          {t('buyMeACoffee')}
        </a>
        <a
          href='https://www.patreon.com/PlexRewind'
          target='_blank'
          className='link-light inline-flex items-center gap-2'
        >
          <HeartIcon className='size-6 text-red-500' />
          {t('becomeASponsor')}
        </a>
        <a
          href='https://github.com/RaunoT/plex-rewind/issues'
          target='_blank'
          className='link-light inline-flex items-center gap-2'
        >
          <Image src={githubSvg} alt='GitHub' className='size-6 p-0.5' />
          {t('reportAnIssue')}
        </a>
      </div>

      <a
        className='link mx-auto mt-4 block w-fit text-center text-sm'
        href='https://github.com/RaunoT/plex-rewind/releases'
        target='_blank'
      >
        {version.hasUpdate && (
          <span className='block'>{t('updateAvailable')}</span>
        )}
        <span className='font-mono text-xs'>
          {version.currentVersion}
          {version.hasUpdate && ` → ${version.latestVersion}`}
        </span>
      </a>
    </div>
  )
}

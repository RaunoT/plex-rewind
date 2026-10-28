import githubSvg from '@/assets/github.svg'
import { canManageSettings } from '@/lib/access'
import getSettings from '@/utils/getSettings'
import { checkRequiredSettings } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { HeartIcon } from '@heroicons/react/24/outline'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ReactNode, SVGProps } from 'react'
import PageTitle from '../_components/PageTitle'
import SettingsNav from './_components/SettingsNav'
import SettingsVersion from './_components/SettingsVersion'

type Props = {
  children: ReactNode
}

export default async function SettingsLayout({ children }: Props) {
  const settings = getSettings()

  // Require admin for settings except during initial setup
  if (!(await canManageSettings(settings))) {
    return redirect('/')
  }

  const missingSetting = checkRequiredSettings(settings)
  const t = await getTranslations('Settings')

  return (
    <div className='page-width-narrow mb-auto'>
      <PageTitle
        title={missingSetting ? t('getStarted') : t('title')}
        isTitleHidden={!!missingSetting}
        noBack
        titleMenu={
          <SettingsNav
            settings={toPublicSettings(settings)}
            missingSetting={missingSetting}
            isMenu
          />
        }
      >
        <SettingsNav
          settings={toPublicSettings(settings)}
          missingSetting={missingSetting}
        />
      </PageTitle>
      {children}

      <div className='glass-sheet mt-4 flex flex-col flex-wrap justify-between gap-3 sm:flex-row'>
        <a
          href='https://buymeacoffee.com/fr9lzfrhdh'
          target='_blank'
          className='link-light inline-flex items-center gap-2'
        >
          <BeerIcon className='size-6 text-amber-400' />
          {t('buyMeABeer')}
        </a>
        <a
          href='https://github.com/sponsors/RaunoT'
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
      <SettingsVersion />
    </div>
  )
}

// Heroicons has no mug, so this one is drawn in its outline style
function BeerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      aria-hidden
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M4.5 6.75a1.75 1.75 0 0 1 3.5 0 1.75 1.75 0 0 1 3.5 0 1.75 1.75 0 0 1 3.5 0M4.5 6.75v10.5a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5V6.75M15 9h1.5a2.25 2.25 0 0 1 2.25 2.25v1.5a2.25 2.25 0 0 1-2.25 2.25H15M8.25 9.75v6m3-6v6'
      />
    </svg>
  )
}

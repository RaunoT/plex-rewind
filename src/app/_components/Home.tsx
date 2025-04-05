'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import usePlexAuth from '@/hooks/usePlexAuth'
import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { checkRequiredSettings } from '@/utils/helpers'
import clsx from 'clsx'
import { kebabCase } from 'lodash'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useContext } from 'react'
import { GlobalContext } from './GlobalContextProvider'

type Props = {
  settings: Settings
  libraries: TautulliLibrary[]
}

export default function Home({ settings, libraries }: Props) {
  const { isLoading, handleLogin } = usePlexAuth()
  const missingSetting = checkRequiredSettings(settings)
  const {
    dashboard: { isPersonal, period, sortBy },
  } = useContext(GlobalContext)
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const dashboardSlug =
    settings.general.activeLibraries.find((libSlug) =>
      libraries.some((lib) => kebabCase(lib.section_name) === libSlug),
    ) || (settings.dashboard.isUsersPageActive ? 'users' : '')
  const showRewind = settings.rewind.isActive && isLoggedIn && !missingSetting
  const showDashboard =
    !missingSetting &&
    settings.dashboard.isActive &&
    (isLoggedIn || settings.general.isOutsideAccess) &&
    dashboardSlug
  const dashboardParams = new URLSearchParams({
    ...(isPersonal && { personal: 'true' }),
    ...(period && { period }),
    ...(sortBy && settings.dashboard.isSortByPlaysActive && { sortBy }),
  })
  const t = useTranslations('Home')
  const tCommon = useTranslations('Common')

  if (isLoading || status === 'loading') {
    return <Loader />
  }

  return (
    <div className='flex flex-col items-center text-center'>
      {session?.user.image && (
        <div className='animate-fade-up relative mb-6 size-24'>
          <Image
            src={session.user.image}
            alt={`${session.user.name} ${tCommon('profilePictureAlt')}`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
      )}

      {missingSetting ? (
        <>
          <h1 className='mb-2 text-3xl font-bold'>{t('setupRequired')}</h1>
          <p className='mb-6'>{t('setupRequiredDescription')}</p>
        </>
      ) : (
        <h1 className='animate-fade-up mb-6 text-[2.5rem] font-bold leading-none animation-delay-300'>
          <Image
            src={plexSvg}
            className='mb-0.5 mr-3 inline h-9 w-auto'
            alt='Plex logo'
            priority
          />
          {/* eslint-disable-next-line react/jsx-no-literals */}
          <span>rewind</span>
        </h1>
      )}

      <div className='animate-fade-in animation-delay-700'>
        {!isLoggedIn && (
          <button
            className='button button-sm button--plex mx-auto mb-4'
            onClick={handleLogin}
          >
            {t('loginWithPlex')}
          </button>
        )}

        {showRewind && (
          <Link href='/rewind' className='button mb-4'>
            {t('rewind')}
          </Link>
        )}

        {showDashboard && (
          <Link
            href={`/dashboard/${dashboardSlug}${dashboardParams.size ? `?${dashboardParams.toString()}` : ''}`}
            className={clsx(
              'mx-auto block',
              !settings.rewind.isActive && isLoggedIn ? 'button' : 'link',
            )}
          >
            {t('dashboard')}
          </Link>
        )}

        {isLoggedIn && (
          <button onClick={() => signOut()} className='link mt-16'>
            {t('signOut')}
          </button>
        )}
      </div>
    </div>
  )
}

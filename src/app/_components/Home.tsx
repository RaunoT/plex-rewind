'use client'

import AppIcon from '@/components/AppIcon'
import Avatar from '@/components/Avatar'
import Loader from '@/components/Loader'
import usePlexAuth from '@/hooks/usePlexAuth'
import { PublicSettings } from '@/types/settings'
import { APP_NAME } from '@/utils/constants'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import JellyfinLoginForm from './JellyfinLoginForm'
import LoginWithPlexLabel from './LoginWithPlexLabel'

type Props = {
  settings: PublicSettings
  missingSetting: string | null
  siteUrl: string
}

// Shown until there's something to browse: before logging in, or while an
// admin still has to finish the setup
export default function Home({ settings, missingSetting, siteUrl }: Props) {
  const { isLoading, error, handleLogin } = usePlexAuth(siteUrl)
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const t = useTranslations('Home')
  const tCommon = useTranslations('Common')

  if (isLoading || status === 'loading') {
    return <Loader />
  }

  return (
    <div className='glass-sheet animate-fade-in flex w-full max-w-sm flex-col items-center text-center'>
      {!session?.user?.image && (
        <AppIcon className='animate-fade-up mb-5 size-16' priority />
      )}
      {session?.user?.image && (
        <div className='animate-fade-up relative mb-5 size-20 overflow-hidden rounded-full shadow-xl ring-1 shadow-black/40 ring-white/20'>
          <Avatar
            src={session.user.image}
            name={session.user.name ?? ''}
            alt={tCommon('profilePictureAlt', {
              name: session.user.name ?? '',
            })}
            sizes='10rem'
            priority
          />
        </div>
      )}

      {missingSetting ? (
        <>
          <h1 className='mb-2 text-2xl font-semibold tracking-tight'>
            {t('setupRequired')}
          </h1>
          <p className='mb-8 text-neutral-300'>
            {t('setupRequiredDescription')}
          </p>
        </>
      ) : (
        <h1 className='animate-fade-up animation-delay-300 mb-4 max-w-full text-[2.5rem] leading-none font-bold tracking-tight text-balance wrap-anywhere'>
          {settings.general.serverName ? settings.general.serverName : APP_NAME}
        </h1>
      )}

      <div className='animate-fade-in animation-delay-700 flex w-full flex-col gap-3'>
        {!isLoggedIn &&
          (settings.connection.mediaServerType === 'jellyfin' ? (
            <JellyfinLoginForm />
          ) : (
            <button
              className='button button--plex w-full'
              onClick={handleLogin}
            >
              <LoginWithPlexLabel />
            </button>
          ))}
        {error && (
          <p role='alert' className='text-danger text-sm'>
            {t(`loginError.${error}`)}
          </p>
        )}
        {isLoggedIn && (
          <button
            onClick={() => signOut()}
            className='link mx-auto w-fit text-sm'
          >
            {t('signOut')}
          </button>
        )}
      </div>
    </div>
  )
}

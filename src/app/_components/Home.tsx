'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import usePlexAuth from '@/hooks/usePlexAuth'
import { PublicSettings } from '@/types/settings'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

type Props = {
  settings: PublicSettings
  missingSetting: string | null
}

// Shown until there's something to browse: before logging in, or while an
// admin still has to finish the setup
export default function Home({ settings, missingSetting }: Props) {
  const { isLoading, handleLogin } = usePlexAuth()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const t = useTranslations('Home')
  const tCommon = useTranslations('Common')

  if (isLoading || status === 'loading') {
    return <Loader />
  }

  return (
    <div className='glass-sheet animate-fade-in flex w-full max-w-sm flex-col items-center text-center'>
      {session?.user?.image && (
        <div className='animate-fade-up relative mb-5 size-20 rounded-full shadow-xl ring-1 shadow-black/40 ring-white/20'>
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
          <h1 className='mb-2 text-2xl font-semibold tracking-tight'>
            {t('setupRequired')}
          </h1>
          <p className='mb-8 text-neutral-300'>
            {t('setupRequiredDescription')}
          </p>
        </>
      ) : (
        <h1 className='animate-fade-up animation-delay-300 mb-8 text-[2.5rem] leading-none font-bold tracking-tight'>
          {settings.general.serverName ? (
            settings.general.serverName
          ) : (
            <>
              <Image src={plexSvg} className='plex-logo' alt='Plex' priority />
              {/* eslint-disable-next-line react/jsx-no-literals */}
              <span>rewind</span>
            </>
          )}
        </h1>
      )}

      <div className='animate-fade-in animation-delay-700 flex w-full flex-col gap-3'>
        {!isLoggedIn && (
          <button className='button button--plex w-full' onClick={handleLogin}>
            {t('loginWithPlex')}
          </button>
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

'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import { createPlexAuthUrl, getPlexAuthToken } from '@/lib/auth'
import { Settings } from '@/types/settings'
import { TautulliLibrary } from '@/types/tautulli'
import { checkRequiredSettings } from '@/utils/helpers'
import clsx from 'clsx'
import { kebabCase } from 'lodash'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  settings: Settings
  libraries: TautulliLibrary[]
}

export default function Home({ settings, libraries }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const missingSetting = checkRequiredSettings(settings)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const hasOutsideAccess = settings.general.isOutsideAccess
  const dashboardSlug = kebabCase(
    libraries[0]?.section_name ||
      (settings.dashboard.isUsersPageActive ? 'users' : ''),
  )
  const showRewind = settings.rewind.isActive && isLoggedIn && !missingSetting
  const showDashboard =
    !missingSetting &&
    settings.dashboard.isActive &&
    (isLoggedIn || hasOutsideAccess) &&
    dashboardSlug

  async function handleLogin() {
    const plexUrl = await createPlexAuthUrl()

    router.push(plexUrl)
  }

  useEffect(() => {
    const plexPinId = searchParams.get('plexPinId')

    async function authUser(plexPinId: string) {
      setIsLoading(true)
      const plexAuthToken = await getPlexAuthToken(plexPinId)

      try {
        const res = await signIn('plex', {
          authToken: plexAuthToken,
          callbackUrl: '/',
        })

        if (res?.error) {
          console.error('[AUTH] - Failed to sign in!', res.error)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('[AUTH] - Error during sign-in!', error)
        setIsLoading(false)
      }
    }

    if (plexPinId) {
      authUser(plexPinId)
    }
  }, [searchParams])

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className='flex flex-col items-center text-center'>
      {session?.user?.image && (
        <div className='animate-fade-up relative mb-6 size-24'>
          <Image
            src={session?.user?.image}
            alt={`${session?.user?.name} profile picture`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
      )}

      {missingSetting ? (
        <>
          <h1 className='mb-2 text-3xl font-bold'>Setup required</h1>
          <p className='mb-6'>
            This application needs to be configured by an administrator.
          </p>
        </>
      ) : (
        <h1 className='animate-fade-up mb-6 text-[2.5rem] font-bold leading-none animation-delay-300'>
          <Image
            src={plexSvg}
            className='mb-0.5 mr-3 inline h-[2.25rem] w-auto'
            alt='Plex logo'
            priority
          />
          <span>rewind</span>
        </h1>
      )}

      <div className='animate-fade-in animation-delay-700'>
        {!isLoggedIn && (
          <button
            className='button button-sm button--plex mx-auto mb-4'
            onClick={() => handleLogin()}
          >
            Log in with Plex
          </button>
        )}

        {showRewind && (
          <Link href='/rewind' className='button mb-4'>
            Start Rewind
          </Link>
        )}

        {showDashboard && (
          <Link
            href={`/dashboard/${dashboardSlug}${settings.dashboard.defaultStyle === 'personal' && isLoggedIn ? '?personal=true' : ''}`}
            className={clsx(
              'mx-auto block',
              !settings.rewind.isActive && isLoggedIn ? 'button' : 'link',
            )}
          >
            Dashboard
          </Link>
        )}

        {isLoggedIn && (
          <button onClick={() => signOut()} className='link mt-16'>
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}

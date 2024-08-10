'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import { createPlexAuthUrl, getPlexAuthToken } from '@/lib/auth'
import { Settings } from '@/types/settings'
import { TautulliLibrary, TautulliUser } from '@/types/tautulli'
import clsx from 'clsx'
import { kebabCase } from 'lodash'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  settings: Settings
}

export default function Home({ settings }: Props) {
  const [libraries, setLibraries] = useState<TautulliLibrary[]>([])
  const [managedUsers, setManagedUsers] = useState<TautulliUser[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const hasOutsideAccess = settings.general.isOutsideAccess
  const dashboardSlug = kebabCase(
    libraries[0]?.section_name ||
      (settings.dashboard.isUsersPageActive ? 'users' : ''),
  )

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

  useEffect(() => {
    async function getLibraries() {
      setIsLoading(true)

      try {
        const res = await fetch('/api/libraries', {
          next: {
            revalidate: 3600,
          },
        })
        const data = await res.json()

        setLibraries(data)
      } catch (error) {
        console.error('[HOME] - Error fetching libraries!', error)
      }

      setIsLoading(false)
    }

    async function getManagedUsers() {
      setIsLoading(true)

      try {
        const res = await fetch(`/api/managed-users?userId=${session?.user.id}`)
        const data = await res.json()

        setManagedUsers(data)
      } catch (error) {
        console.error('[HOME] - Error fetching managed users!', error)
      }

      setIsLoading(false)
    }

    if (status === 'authenticated' || hasOutsideAccess) {
      getLibraries()
    }

    if (status === 'authenticated') {
      getManagedUsers()
    } else if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status, session?.user.id, hasOutsideAccess])

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

      <h1 className='animate-fade-up mb-6 text-[2.5rem] font-bold leading-none animation-delay-300'>
        <Image
          src={plexSvg}
          className='mb-0.5 mr-3 inline h-[2.25rem] w-auto'
          alt='Plex logo'
          priority
        />
        <span>rewind</span>
      </h1>

      <div className='animate-fade-in animation-delay-700'>
        {!isLoggedIn && (
          <button
            className='button button-sm button--plex mx-auto mb-4'
            onClick={() => handleLogin()}
          >
            Log in with Plex
          </button>
        )}

        {settings.rewind.isActive &&
          isLoggedIn &&
          (managedUsers ? (
            <>
              <Link
                href='/rewind'
                className='button button-sm mb-2 w-full last:mb-0'
              >
                Start Rewind
              </Link>
              {managedUsers.map((user, i) => (
                <Link
                  key={i}
                  href={`/rewind?userId=${user.user_id}`}
                  className='button button-sm mb-2 w-full last:mb-0'
                >
                  Rewind for {user.friendly_name}
                </Link>
              ))}
            </>
          ) : (
            <Link href='/rewind' className='button mb-4'>
              Start Rewind
            </Link>
          ))}

        {settings.dashboard.isActive &&
          (isLoggedIn || hasOutsideAccess) &&
          dashboardSlug && (
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

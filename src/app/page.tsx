'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import { createPlexAuthUrl, getPlexAuthToken } from '@/lib/auth'
import { Library, TautulliUser } from '@/types'
import { isDashboardDisabled, isRewindDisabled } from '@/utils/config'
import clsx from 'clsx'
import { snakeCase } from 'lodash'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Page() {
  const [libraries, setLibraries] = useState<Library[]>([])
  const [managedUsers, setManagedUsers] = useState<TautulliUser[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'

  const handleLogin = async () => {
    const plexUrl = await createPlexAuthUrl()
    router.push(plexUrl)
  }

  useEffect(() => {
    const plexPinId = searchParams.get('plexPinId')

    if (plexPinId) {
      const authUser = async () => {
        setIsLoading(true)
        const plexAuthToken = await getPlexAuthToken(plexPinId)

        try {
          const res = await signIn('plex', {
            authToken: plexAuthToken,
            callbackUrl: '/',
          })

          if (res?.error) {
            console.error('Failed to sign in:', res.error)
          }

          setIsLoading(false)
        } catch (error) {
          console.error('Error during sign-in:', error)
          setIsLoading(false)
        }
      }

      authUser()
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated') {
      const getLibraries = async () => {
        setIsLoading(true)

        try {
          const res = await fetch('/api/libraries')
          const data = await res.json()

          setLibraries(data)
        } catch (error) {
          console.error('Error fetching libraries:', error)
        }

        setIsLoading(false)
      }
      const getManagedUsers = async () => {
        setIsLoading(true)

        try {
          const res = await fetch(
            `/api/managed-users?userId=${session?.user.id}`,
          )
          const data = await res.json()

          setManagedUsers(data)
        } catch (error) {
          console.error('Error fetching libraries:', error)
        }

        setIsLoading(false)
      }

      getLibraries()
      getManagedUsers()
    } else if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status, session?.user.id])

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className='flex flex-col items-center text-center'>
      {session?.user?.image && (
        <div className='animate-fade-up relative mb-5 size-24'>
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

      <div className='animate-fade-up animation-delay-300 mb-6'>
        <h1 className='flex items-center gap-4 text-4xl font-bold'>
          <Image
            src={plexSvg}
            className='h-12 w-auto'
            alt='Plex logo'
            priority
          />
          <span>rewind</span>
        </h1>
      </div>

      {!isLoggedIn && (
        <button
          className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
          onClick={() => handleLogin()}
        >
          Log in with Plex
        </button>
      )}

      <div className='animate-fade-in animation-delay-600'>
        {!isRewindDisabled &&
          isLoggedIn &&
          (managedUsers ? (
            <>
              <Link href='/rewind' className='button button-sm mb-2 last:mb-0'>
                Start Rewind
              </Link>
              {managedUsers.map((user, i) => (
                <Link
                  key={i}
                  href={`/rewind?userId=${user.user_id}`}
                  className='button button-sm mb-2 last:mb-0'
                >
                  Rewind for {user.friendly_name}
                </Link>
              ))}
            </>
          ) : (
            <Link href='/rewind' className='button'>
              Start Rewind
            </Link>
          ))}

        {!isDashboardDisabled && isLoggedIn && (
          <Link
            href={`/dashboard/${snakeCase(libraries[0]?.section_name)}`}
            className={clsx('mt-4 block', isRewindDisabled ? 'button' : 'link')}
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

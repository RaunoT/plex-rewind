'use client'

import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import { fadeIn } from '@/utils/motion'
import { createPlexAuthUrl, getPlexAuthToken } from '@/utils/plexAuth'
import { motion } from 'framer-motion'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [userName, setUserName] = useState<string | null | undefined>('')
  const [userThumb, setUserThumb] = useState<string | null | undefined>('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const isRewindDisabled = process.env.NEXT_PUBLIC_IS_REWIND_DISABLED === 'true'
  const isDashboardDisabled =
    process.env.NEXT_PUBLIC_IS_DASHBOARD_DISABLED === 'true'

  const handleLogin = async () => {
    try {
      const plexUrl = await createPlexAuthUrl()
      router.push(plexUrl)
    } catch (error) {
      console.error('Error creating Plex auth url:', error)
    }
  }

  useEffect(() => {
    const plexPinId = searchParams.get('plexPinId')

    if (plexPinId) {
      const authUser = async () => {
        try {
          const plexAuthToken = await getPlexAuthToken(plexPinId)

          try {
            const res = await signIn('plex', {
              authToken: plexAuthToken,
              callbackUrl: '/',
            })

            if (res?.error) {
              console.error('Failed to sign in:', res.error)
            }
          } catch (error) {
            console.error('Error during sign-in:', error)
          }
        } catch (error) {
          console.error('Error getting Plex auth token:', error)
        }
      }

      authUser()
    }
  }, [searchParams])

  useEffect(() => {
    setUserName(session?.user?.name)
    setUserThumb(session?.user?.image)
    setIsLoggedIn(status === 'authenticated')
  }, [session, status])

  if (status === 'loading') {
    return <Loader />
  }

  return (
    <div className='flex flex-col items-center text-center'>
      {userThumb && (
        <div className='relative mb-5 h-20 w-20'>
          <Image
            src={userThumb}
            alt={`${userName} profile picture`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
      )}

      <h1 className='mb-6 flex items-center gap-4 text-4xl font-bold'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Image
            src={plexSvg}
            className='h-12 w-auto'
            alt='Plex logo'
            priority
          />
        </motion.div>
        <motion.span
          variants={fadeIn}
          initial='hidden'
          animate='show'
          transition={{ delay: 0.4 }}
        >
          rewind
        </motion.span>
      </h1>

      {!isLoggedIn && (
        <button
          className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
          onClick={() => handleLogin()}
        >
          Log in with Plex
        </button>
      )}

      {!isRewindDisabled && isLoggedIn && (
        <Link href='/rewind/totals' className='button mb-4'>
          Get started
        </Link>
      )}
      {!isDashboardDisabled && isLoggedIn && (
        <Link
          href='/dashboard/shows'
          className={
            isRewindDisabled ? 'button' : 'text-slate-300 hover:opacity-75'
          }
        >
          Dashboard
        </Link>
      )}

      {isLoggedIn && (
        <button
          onClick={() => signOut()}
          className='mt-16 block opacity-50 hover:opacity-40'
        >
          Sign out
        </button>
      )}
    </div>
  )
}

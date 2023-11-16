'use client'

import PlexLogin from '@/app/_components/PlexLogin'
import plexSvg from '@/assets/plex.svg'
import Loader from '@/components/Loader'
import { fadeIn } from '@/utils/motion'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Page() {
  const [userName, setUserName] = useState<string>('')
  const [userThumb, setUserThumb] = useState<string>('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isRewindDisabled = process.env.NEXT_PUBLIC_IS_REWIND_DISABLED === 'true'
  const isDashboardDisabled =
    process.env.NEXT_PUBLIC_IS_DASHBOARD_DISABLED === 'true'

  const logOut = async () => {
    try {
      const res = await fetch('/api/logout')

      if (!res.ok) {
        console.error('Failed to log out:', res.status)
      }

      setIsLoggedIn(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me')

        if (!res.ok) {
          console.error('Failed to fetch user:', res.status)
        }

        const user = await res.json()

        setUserName(user.name)
        setUserThumb(user.thumb)
        setIsLoggedIn(user.isLoggedIn)
      } catch (error) {
        console.error('Error fetching user:', error)
      }

      setIsLoading(false)
    }

    fetchUser()
  }, [])

  return (
    <div className='flex flex-col items-center text-center'>
      {userThumb && isLoggedIn && (
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

      {!isLoading && (
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
      )}

      {isLoading ? <Loader /> : !isLoggedIn && <PlexLogin />}

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
          onClick={() => logOut()}
          className='mt-16 block opacity-50 hover:opacity-40'
        >
          Sign out
        </button>
      )}
    </div>
  )
}

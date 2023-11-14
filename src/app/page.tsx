'use client'

import PlexLogin from '@/app/_components/PlexLogin'
import plexSvg from '@/assets/plex.svg'
import useSession from '@/hooks/useSession'
import { fadeIn } from '@/utils/motion'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  const { session, clearSession } = useSession()
  const userName = session.user?.name
  const userThumb = session.user?.thumb
  const isLoggedIn = session.isLoggedIn
  const isRewindDisabled = process.env.NEXT_PUBLIC_IS_REWIND_DISABLED === 'true'
  const isDashboardDisabled =
    process.env.NEXT_PUBLIC_IS_DASHBOARD_DISABLED === 'true'

  return (
    <div className='text-center'>
      {userThumb && (
        <div className='relative mx-auto mb-5 h-20 w-20'>
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

      {!isLoggedIn && <PlexLogin />}

      {!isRewindDisabled && isLoggedIn && (
        <Link href='/rewind/totals' className='button mx-auto mb-4'>
          Get started
        </Link>
      )}

      {!isDashboardDisabled && isLoggedIn && (
        <Link
          href='/dashboard/shows'
          className={
            isRewindDisabled
              ? 'button mx-auto'
              : 'text-slate-300 hover:opacity-75'
          }
        >
          Dashboard
        </Link>
      )}

      {isLoggedIn && (
        <button
          onClick={() => clearSession()}
          className='mx-auto mt-16 block opacity-50 hover:opacity-40'
        >
          Sign out
        </button>
      )}
    </div>
  )
}

'use client'

import CardRewind from '@/components/Card/CardRewind'
import { ALLOWED_PERIODS } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import { timeToSeconds } from '@/utils/formatting'
import { ClockIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

async function getUserTotalDuration(userId: string) {
  const userTotalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: userId,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return timeToSeconds(userTotalDuration.response?.data?.total_duration)
}

export default function RewindTotal() {
  const { data: session } = useSession()
  const [userTotalDuration, setUserTotalDuration] = useState('')

  useEffect(() => {
    async function fetchSession() {
      if (session?.user) {
        const duration = await getUserTotalDuration(session.user.id)
        setUserTotalDuration(duration)
      }
    }

    fetchSession()
  }, [session?.user])

  if (!userTotalDuration) return null

  return (
    <CardRewind>
      You&apos;ve spent a{' '}
      <span className='rewind-cat'>
        Total
        <ClockIcon />
      </span>{' '}
      of <span className='rewind-stat'>{userTotalDuration}</span> on{' '}
      <span className='text-yellow-500'>Plex</span> this year!
    </CardRewind>
  )
}

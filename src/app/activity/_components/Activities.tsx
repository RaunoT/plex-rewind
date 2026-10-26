'use client'

import { PublicSettings } from '@/types/settings'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import getActivity from '../_actions/getActivity'
import ActivitiesSkeleton from './ActivitiesSkeleton'
import ActivityItem from './ActivityItem'

type Props = {
  settings: PublicSettings
  serverId?: string
}

export default function Activities({ settings, serverId }: Props) {
  const t = useTranslations('Activity')
  const errorT = useTranslations('Error')
  const { data, error, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    const baseTitle = settings.general.serverName || 'Plex Rewind'
    const streamCount = data?.stream_count ?? 0
    const title =
      streamCount > 0 ? `(${streamCount}) ${t('title')}` : t('title')

    document.title = `${title} | ${baseTitle}`
  }, [data?.stream_count, settings.general.serverName, t])

  if (isLoading) {
    return <ActivitiesSkeleton />
  }

  if (error || !data) {
    return (
      <div className='flex flex-1 flex-col justify-center text-center'>
        <h2 className='mb-4 text-3xl leading-tight italic sm:text-4xl'>
          {errorT('title')}
        </h2>
        <button
          className='link mx-auto w-fit'
          onClick={() => window.location.reload()}
        >
          {errorT('cta')}
        </button>
      </div>
    )
  }

  if (!data.sessions.length) {
    return (
      <div className='flex flex-1 flex-col justify-center text-center text-neutral-300'>
        <p className='text-2xl italic last:mb-0 sm:text-3xl'>
          {t('noActivity')}
        </p>
      </div>
    )
  }

  return (
    <ul className='space-y-6 sm:space-y-8'>
      {data.sessions.map((session, index) => (
        <ActivityItem
          key={session.session_key}
          session={session}
          index={index}
          totalSessions={data.sessions.length}
          settings={settings}
          serverId={serverId}
        />
      ))}
    </ul>
  )
}

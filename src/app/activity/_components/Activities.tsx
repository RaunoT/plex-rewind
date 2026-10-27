'use client'

import RetryButton from '@/components/RetryButton'
import StatusMessage from '@/components/StatusMessage'
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
  const { data, error, isLoading, refetch } = useQuery({
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
      <StatusMessage
        title={errorT('title')}
        isInCard
        action={<RetryButton onRetry={refetch} />}
      />
    )
  }

  if (!data.sessions.length) {
    return (
      <div className='flex flex-1 flex-col justify-center text-center text-neutral-300'>
        <p className='text-2xl last:mb-0 sm:text-3xl'>{t('noActivity')}</p>
      </div>
    )
  }

  return (
    <ul className='divide-y divide-white/10'>
      {data.sessions.map((session, index) => (
        <ActivityItem
          key={session.session_key}
          session={session}
          index={index}
          settings={settings}
          serverId={serverId}
        />
      ))}
    </ul>
  )
}

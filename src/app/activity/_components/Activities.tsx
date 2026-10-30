'use client'

import RetryButton from '@/components/RetryButton'
import SkeletonSized from '@/components/SkeletonSized'
import SourceUnreachable from '@/components/SourceUnreachable'
import StatusMessage from '@/components/StatusMessage'
import { PublicSettings } from '@/types/settings'
import { MediaServer } from '@/types/statsSource'
import { APP_NAME } from '@/utils/constants'
import { ExclamationTriangleIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import getActivity from '../_actions/getActivity'
import ActivitiesSkeleton from './ActivitiesSkeleton'
import ActivityItem from './ActivityItem'

type Props = {
  settings: PublicSettings
  mediaServer: MediaServer | null
}

export default function Activities({ settings, mediaServer }: Props) {
  const t = useTranslations('Activity')
  const errorT = useTranslations('Error')
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    const baseTitle = settings.general.serverName || APP_NAME
    const streamCount = data?.stream_count ?? 0
    const title =
      streamCount > 0 ? `(${streamCount}) ${t('title')}` : t('title')

    document.title = `${title} | ${baseTitle}`
  }, [data?.stream_count, settings.general.serverName, t])

  if (isLoading) {
    return <ActivitiesSkeleton />
  }

  if (error || !data?.sessions.length) {
    return (
      <SkeletonSized skeleton={<ActivitiesSkeleton />}>
        {error ? (
          <StatusMessage
            icon={ExclamationTriangleIcon}
            title={errorT('title')}
            isInCard
            action={<RetryButton onRetry={refetch} />}
          />
        ) : !data ? (
          // The server answered, but got nothing from the source
          <SourceUnreachable
            source={settings.connection.statisticsSource}
            onRetry={refetch}
            isInCard
          />
        ) : (
          <StatusMessage
            icon={MoonIcon}
            description={t('noActivity')}
            isInCard
          />
        )}
      </SkeletonSized>
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
          mediaServer={mediaServer}
        />
      ))}
    </ul>
  )
}

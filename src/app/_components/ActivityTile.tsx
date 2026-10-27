'use client'

import getActivity from '@/app/activity/_actions/getActivity'
import { MediaIcon } from '@/components/icons'
import SkeletonLine from '@/components/SkeletonLine'
import { PublicSettings } from '@/types/settings'
import { STATS_SOURCE_NAMES } from '@/utils/constants'
import {
  ChevronRightIcon,
  ExclamationTriangleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

type Props = {
  settings: PublicSettings
}

// Shares its query with the activity page, so both stay in sync
export default function ActivityTile({ settings }: Props) {
  const t = useTranslations()
  const { data: session } = useSession()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })
  // Null when the server got nothing from the source
  const isUnavailable = isError || data === null

  return (
    <Link
      href='/activity'
      className='glass-sheet group focus-visible:focus-ring flex flex-col justify-between gap-4 transition-colors hover:bg-white/5'
    >
      <div className='flex items-center justify-between gap-3'>
        <h2 className='flex items-center gap-2 font-semibold'>
          <SignalIcon className='size-5 text-neutral-400' />
          {t('Activity.title')}
        </h2>
        <ChevronRightIcon className='size-4 text-neutral-500 transition-transform group-hover:translate-x-0.5' />
      </div>
      {isLoading ? (
        <SkeletonLine className='text-2xl' width='w-32' />
      ) : isUnavailable ? (
        <p className='flex items-center gap-2 text-sm text-red-300'>
          <ExclamationTriangleIcon className='size-5 shrink-0' />
          {isError
            ? t('Activity.loadError')
            : t('Error.sourceUnreachable', {
                source:
                  STATS_SOURCE_NAMES[settings.connection.statisticsSource],
              })}
        </p>
      ) : (
        <p className='text-2xl font-semibold tracking-tight'>
          {t('Home.streams', { count: data?.stream_count ?? 0 })}
        </p>
      )}
      {!isUnavailable && !!data?.sessions.length && (
        <ul className='space-y-1 text-sm'>
          {data.sessions.slice(0, 3).map((item, index) => {
            const isAnonymous =
              settings.general.isAnonymized &&
              String(item.user_id) !== session?.user.id

            return (
              <li
                key={item.session_key}
                className='flex min-w-0 items-center gap-2'
              >
                <MediaIcon
                  type={item.media_type}
                  className='size-4 shrink-0 text-neutral-400'
                />
                <span className='truncate'>
                  {item.grandparent_title || item.title}
                </span>
                <span className='max-w-1/2 shrink-0 truncate text-neutral-400'>
                  {isAnonymous
                    ? `${t('Activity.anonymous')} #${index + 1}`
                    : item.friendly_name}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Link>
  )
}

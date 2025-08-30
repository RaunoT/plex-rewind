'use client'

import CardWrapper from '@/app/_components/CardWrapper'
import { Settings } from '@/types/settings'
import { getActivity } from '@/utils/fetchTautulli'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

type Props = {
  settings: Settings
}

export default function ActivityContent({ settings }: Props) {
  const tautulliUrl = settings.connection.tautulliUrl
  const { data, error, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    refetchInterval: 5000,
  })

  if (isLoading) {
    return <div>Loading activity...</div>
  }

  if (error) {
    return <div>Error loading activity: {error.message}</div>
  }

  if (!data || data.sessions.length === 0) {
    return <div>No current activity</div>
  }

  return (
    <ul className='flex flex-wrap gap-4'>
      {data.sessions.map((session) => (
        <li key={session.session_key} className='w-full'>
          <CardWrapper>
            <div className='mb-8 flex gap-4'>
              <div className='relative aspect-2/3 h-full w-20 shrink-0 sm:w-[5.35rem] 2xl:w-24'>
                <Image
                  fill
                  className='object-cover object-top'
                  alt={session.grandparent_title + ' poster'}
                  src={`/api/image?url=${encodeURIComponent(
                    `${tautulliUrl}/pms_image_proxy?img=${session.grandparent_thumb || session.thumb}&width=300`,
                  )}`}
                  sizes='6rem'
                  priority
                />
              </div>
              <div className='flex w-full items-start justify-between gap-8'>
                <div className='text-xl font-bold'>{session.full_title}</div>
                <div className='mt-1 text-sm text-gray-400 sm:mt-0.5 sm:text-base'>
                  {session.progress_percent}%
                </div>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <div className='relative size-12 shrink-0 rounded-full'>
                {settings.activity.isAnonymized ? (
                  <div className='flex size-12 items-center justify-center rounded-full bg-gray-600 text-sm font-semibold text-white'>
                    {session.session_key.slice(-2).toUpperCase()}
                  </div>
                ) : (
                  <Image
                    fill
                    className='rounded-full object-cover object-top'
                    alt={session.friendly_name + ' avatar'}
                    src={`/api/image?url=${encodeURIComponent(
                      `${tautulliUrl}/pms_image_proxy?img=${
                        session.user_thumb
                      }&width=300`,
                    )}`}
                    sizes='6rem'
                    priority
                  />
                )}
              </div>
              <div className='flex w-full items-end justify-between gap-8'>
                <div>
                  <div className='font-semibold'>
                    {settings.activity.isAnonymized
                      ? `User ${session.session_key.slice(-4)}`
                      : session.friendly_name}
                  </div>
                  <div className='text-sm text-gray-400'>
                    {session.product} ({session.player})
                  </div>
                </div>
                {session.state === 'paused' ? (
                  <PauseIcon className='size-5' />
                ) : (
                  <PlayIcon className='size-5' />
                )}
              </div>
            </div>
          </CardWrapper>
        </li>
      ))}
    </ul>
  )
}

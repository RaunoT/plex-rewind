'use client'

import CardWrapper from '@/app/_components/CardWrapper'
import anonymousSvg from '@/components/MediaItem/anonymous.svg'
import { Settings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import { getActivity } from '@/utils/fetchTautulli'
import { formatBitrate } from '@/utils/formatting'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect } from 'react'

type Props = {
  settings: Settings
}

export default function Activities({ settings }: Props) {
  const tautulliUrl = settings.connection.tautulliUrl
  const t = useTranslations('Activity')
  const { data, error, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    refetchInterval: 5000,
  })

  useEffect(() => {
    const baseTitle = settings.general.serverName || 'Plex Rewind'
    const streamCount = data?.stream_count ?? 0
    const title =
      streamCount > 0 ? `(${streamCount}) ${t('title')}` : t('title')

    document.title = `${title} | ${baseTitle}`
  }, [data?.stream_count, settings.general.serverName, t])

  if (isLoading) {
    return <p>Loading activity...</p>
  }

  if (error) {
    return <p>Error loading activity: {error.message}</p>
  }

  if (!data || data.sessions.length === 0) {
    return <p>No current activity</p>
  }

  return (
    <CardWrapper>
      <ul className='space-y-8'>
        {data.sessions.map((session, index) => (
          <li
            key={session.session_key}
            className={clsx('w-full', {
              'border-b border-neutral-500 pb-8':
                index !== data.sessions.length - 1,
            })}
          >
            <div className='flex flex-col gap-4 sm:flex-row'>
              {/* Poster */}
              <div className='flex justify-between gap-4'>
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

                <Title session={session} className='!mb-0 flex sm:hidden' />
              </div>

              {/* Title & progress */}
              <div className='w-full'>
                <Title session={session} className='hidden sm:flex' />

                {/* Stream info */}
                <ul className='flex flex-wrap gap-x-8 gap-y-4 text-xs sm:gap-8 sm:text-sm'>
                  <li>
                    <div className='font-semibold text-neutral-400 uppercase'>
                      Quality
                    </div>
                    {session.quality_profile}{' '}
                    {formatBitrate(session.stream_bitrate)}
                    {session.transcode_decision && (
                      <div className='text-xs text-neutral-400'>
                        {session.transcode_decision}
                      </div>
                    )}
                  </li>
                  {session.media_type !== 'track' && (
                    <li>
                      <div className='font-semibold text-neutral-400 uppercase'>
                        Video
                      </div>
                      <div className='uppercase'>
                        {session.stream_video_codec}{' '}
                        {session.stream_video_full_resolution}
                      </div>
                      {session.stream_video_decision && (
                        <div className='text-xs text-neutral-400'>
                          {session.stream_video_decision}
                        </div>
                      )}
                    </li>
                  )}
                  <li>
                    <div className='font-semibold text-neutral-400 uppercase'>
                      Audio
                    </div>
                    <div className='uppercase'>
                      {session.stream_audio_codec}
                    </div>
                    {session.stream_audio_decision && (
                      <div className='text-xs text-neutral-400'>
                        {session.stream_audio_decision}
                      </div>
                    )}
                  </li>
                  {session.media_type !== 'track' && (
                    <li>
                      <div className='font-semibold text-neutral-400 uppercase'>
                        Subtitles
                      </div>
                      <div>
                        <span className='uppercase'>
                          {session.stream_subtitle_codec}
                        </span>{' '}
                        - {session.stream_subtitle_language}
                      </div>
                      {session.stream_subtitle_decision && (
                        <div className='text-xs text-neutral-400'>
                          {session.stream_subtitle_decision}
                        </div>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* User info */}
            <div className='mt-4 flex items-center gap-4'>
              <div className='relative size-12 shrink-0 rounded-full'>
                <Image
                  fill
                  className='rounded-full object-cover object-top'
                  alt={
                    !settings.general.isAnonymized
                      ? session.friendly_name + ' avatar'
                      : 'Anonymous avatar'
                  }
                  src={
                    settings.general.isAnonymized
                      ? anonymousSvg
                      : `/api/image?url=${encodeURIComponent(
                          `${tautulliUrl}/pms_image_proxy?img=${session.user_thumb}&width=300`,
                        )}`
                  }
                  sizes='6rem'
                  priority
                />
              </div>
              <div className='flex w-full items-end justify-between gap-8'>
                <div>
                  <div className='text-sm font-semibold sm:text-base'>
                    {settings.general.isAnonymized
                      ? `Anonymous #${index + 1}`
                      : session.friendly_name}
                  </div>
                  <div className='text-xs text-neutral-400 sm:text-sm'>
                    {session.product} ({session.player})
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CardWrapper>
  )
}

type TitleProps = {
  session: TautulliSession
  className?: string
}

function Title({ session, className }: TitleProps) {
  return (
    <div
      className={clsx(
        'mb-4 flex w-full justify-between gap-4 sm:gap-8',
        className,
      )}
    >
      <div className='flex gap-2'>
        <PlayState session={session} className='hidden sm:block' />
        <h2 className='text-lg font-bold sm:text-xl'>{session.full_title}</h2>
      </div>
      <div>
        <PlayState session={session} className='mb-4 sm:hidden' />
        <div className='text-sm text-neutral-400 sm:mt-0.5 sm:text-base'>
          {session.progress_percent}%
        </div>
      </div>
    </div>
  )
}

type PlayStateProps = {
  session: TautulliSession
  className?: string
}

function PlayState({ session, className }: PlayStateProps) {
  return (
    <div className={className}>
      {session.state === 'paused' ? (
        <PauseIcon className='mt-[5px] size-5 shrink-0' />
      ) : (
        <PlayIcon className='mt-[5px] size-5 shrink-0' />
      )}
    </div>
  )
}

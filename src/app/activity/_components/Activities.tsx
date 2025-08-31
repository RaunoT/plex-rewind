'use client'

import anonymousSvg from '@/components/MediaItem/anonymous.svg'
import { Settings } from '@/types/settings'
import { getActivity } from '@/utils/fetchTautulli'
import {
  calculateETA,
  formatBitrate,
  millisecondsToTimeString,
} from '@/utils/formatting'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect } from 'react'
import ActivitiesSkeleton from './ActivitiesSkeleton'

type Props = {
  settings: Settings
}

export default function Activities({ settings }: Props) {
  const tautulliUrl = settings.connection.tautulliUrl
  const t = useTranslations('Activity')
  const errorT = useTranslations('Error')
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
    return <ActivitiesSkeleton />
  }

  if (error) {
    return (
      <div className='flex flex-1 flex-col justify-center text-center'>
        <h1 className='mb-4 text-3xl leading-tight italic sm:text-4xl'>
          {errorT('title')}
        </h1>
        <button
          className='link mx-auto w-fit'
          onClick={() => window.location.reload()}
        >
          {errorT('cta')}
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  if (!data.sessions?.length) {
    return (
      <div className='flex flex-1 flex-col justify-center text-center text-neutral-300'>
        <h2 className='mb-4 py-32 text-2xl leading-tight italic last:mb-0 sm:text-3xl'>
          {t('noActivity')}
        </h2>
      </div>
    )
  }

  return (
    <ul className='space-y-6 sm:space-y-8'>
      {data.sessions.map((session, index) => (
        <li
          key={session.session_key}
          className={clsx('w-full', {
            'border-b border-neutral-500 pb-6 sm:pb-8':
              index !== data.sessions.length - 1,
          })}
        >
          <div className='flex gap-3'>
            {/* Poster */}
            <div className='h-fit'>
              <div className='poster'>
                <Image
                  fill
                  className='object-cover object-top'
                  alt={session.grandparent_title + ' ' + t('poster')}
                  src={`/api/image?url=${encodeURIComponent(
                    `${tautulliUrl}/pms_image_proxy?img=${session.grandparent_thumb || session.thumb}&width=300`,
                  )}`}
                  sizes='6rem'
                  priority
                />
              </div>
              {/* Time */}
              {session.duration && session.view_offset && (
                <div className='mt-2 text-center text-neutral-400'>
                  <div className='text-xs'>
                    {`${session.progress_percent}% `}
                    {calculateETA(session.duration, session.view_offset) && (
                      <>
                        - {calculateETA(session.duration, session.view_offset)}
                      </>
                    )}
                  </div>
                  <div className='text-[0.625rem]'>
                    {millisecondsToTimeString(parseInt(session.view_offset))} /{' '}
                    {millisecondsToTimeString(parseInt(session.duration))}
                  </div>
                </div>
              )}
            </div>

            <div className='w-full'>
              {/* Title */}
              <div className='mb-2'>
                {session.grandparent_title && (
                  <p className='text-xs text-neutral-400 sm:text-sm'>
                    {session.grandparent_title}
                  </p>
                )}
                <h2 className='text-sm font-bold sm:text-lg'>
                  {session.title}
                </h2>
                {session.parent_title && (
                  <p className='text-xs text-neutral-400 sm:text-sm'>
                    {session.parent_title}
                  </p>
                )}
              </div>
              {/* Stream info */}
              <ul className='flex flex-col flex-wrap gap-4 text-xs sm:flex-row sm:gap-x-6'>
                {/* Quality */}
                <li className='space-y-0.5'>
                  <div className='font-semibold text-neutral-400 uppercase'>
                    {t('quality')} ({formatBitrate(session.stream_bitrate)})
                  </div>
                  <div>{session.quality_profile}</div>
                  {session.transcode_decision && (
                    <div className='text-neutral-400'>
                      {session.transcode_decision}
                    </div>
                  )}
                </li>
                {/* Video */}
                {session.media_type !== 'track' && (
                  <li className='space-y-0.5'>
                    <div className='font-semibold text-neutral-400 uppercase'>
                      {t('video')} ({session.stream_video_codec})
                    </div>
                    <div>
                      <span className='uppercase'>
                        {session.stream_video_full_resolution}
                      </span>{' '}
                      ({session.stream_video_dynamic_range})
                    </div>
                    {session.stream_video_decision && (
                      <div className='text-neutral-400'>
                        {session.stream_video_decision}
                      </div>
                    )}
                  </li>
                )}
                {/* Audio */}
                <li className='space-y-0.5'>
                  <div className='font-semibold text-neutral-400 uppercase'>
                    {t('audio')} ({session.stream_audio_codec})
                  </div>
                  <div>
                    {session.stream_audio_language} (
                    {session.stream_audio_channel_layout})
                  </div>
                  {session.stream_audio_decision && (
                    <div className='text-neutral-400'>
                      {session.stream_audio_decision}
                    </div>
                  )}
                </li>
                {/* Subs */}
                {session.media_type !== 'track' && (
                  <li className='space-y-0.5'>
                    <div className='font-semibold text-neutral-400 uppercase'>
                      {t('subtitles')} ({session.stream_subtitle_codec})
                    </div>
                    <div>{session.stream_subtitle_language}</div>
                    {session.stream_subtitle_decision && (
                      <div className='text-neutral-400'>
                        {session.stream_subtitle_decision}
                      </div>
                    )}
                  </li>
                )}
                {/* Location */}
                {!settings.activity.hideLocation &&
                  !settings.general.isAnonymized && (
                    <li className='space-y-0.5'>
                      <div className='font-semibold text-neutral-400 uppercase'>
                        {t('location')} ({session.location})
                      </div>
                      <div>
                        <a
                          href={`https://ipinfo.io/${session.ip_address_public}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='link-light text-blue-300'
                        >
                          {session.ip_address_public}
                        </a>
                      </div>
                      {session.ip_address_public !== session.ip_address && (
                        <div className='text-neutral-400'>
                          {session.ip_address}
                        </div>
                      )}
                    </li>
                  )}
                {/* Bandwidth */}
                <li className='space-y-0.5'>
                  <div className='font-semibold text-neutral-400 uppercase'>
                    {t('bandwidth')}
                  </div>
                  <div>{formatBitrate(session.bandwidth)}</div>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-4 flex items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              {/* Avatar */}
              <div className='relative size-12 shrink-0 rounded-full'>
                <Image
                  fill
                  className='rounded-full object-cover object-top'
                  alt={
                    settings.general.isAnonymized
                      ? t('anonymousAvatar')
                      : session.friendly_name + ' ' + t('avatar')
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
              {/* User info */}
              <div>
                <div className='text-sm font-semibold sm:text-base'>
                  {settings.general.isAnonymized
                    ? `${t('anonymous')} #${index + 1}`
                    : session.friendly_name}
                </div>
                <div className='text-xs text-neutral-400 sm:text-sm'>
                  {session.product} ({session.player})
                </div>
              </div>
            </div>
            {/* State */}
            <div>
              {session.state === 'playing' ? (
                <PlayIcon className='size-5' />
              ) : (
                <PauseIcon className='size-5' />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

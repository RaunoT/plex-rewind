'use client'

import anonymousSvg from '@/components/MediaItem/anonymous.svg'
import { usePoster } from '@/hooks/usePoster'
import { Settings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import { generateDeeplinkUrl } from '@/utils/deeplink'
import {
  calculateETA,
  formatBitrate,
  millisecondsToTimeString,
} from '@/utils/formatting'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

type ActivityItemProps = {
  session: TautulliSession
  index: number
  totalSessions: number
  settings: Settings
  serverId?: string
}

export default function ActivityItem({
  session,
  index,
  totalSessions,
  settings,
  serverId,
}: ActivityItemProps) {
  const { posterUrl, isLoading } = usePoster(session, settings)
  const t = useTranslations('Activity')
  const { data: userData } = useSession()
  const isLoggedIn = session.user_id == userData?.user?.id

  console.log(session.user_id, userData?.user?.id)

  return (
    <li
      className={clsx('w-full', {
        'border-b border-neutral-500 pb-6 sm:pb-8': index !== totalSessions - 1,
      })}
    >
      <div className='flex gap-3'>
        {/* Poster */}
        <div className='h-fit'>
          <div className={clsx('poster', { skeleton: isLoading })}>
            {!isLoading && posterUrl && (
              <Image
                fill
                className='object-cover object-top'
                alt={session.grandparent_title + ' ' + t('poster')}
                src={posterUrl}
                sizes='6rem'
                priority
              />
            )}
          </div>
          {/* Time */}
          {session.duration && session.view_offset && (
            <div className='mt-2 text-center text-neutral-400'>
              <div className='text-xs'>
                {`${session.progress_percent}% `}
                {calculateETA(session.duration, session.view_offset) && (
                  <>
                    {'- '}
                    {calculateETA(session.duration, session.view_offset)}
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
              {serverId ? (
                <a
                  href={generateDeeplinkUrl(session.rating_key, serverId)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-light'
                >
                  {session.title}
                </a>
              ) : (
                session.title
              )}
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
                {session.media_type === 'track'
                  ? session.stream_audio_channel_layout
                  : `${session.stream_audio_language} (${session.stream_audio_channel_layout})`}
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
                      className='link-light text-blue-300 underline'
                    >
                      {session.ip_address_public}
                    </a>
                  </div>
                  {session.ip_address_public !== session.ip_address && (
                    <div className='text-neutral-400'>{session.ip_address}</div>
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
                settings.general.isAnonymized && !isLoggedIn
                  ? t('anonymousAvatar')
                  : session.friendly_name + ' ' + t('avatar')
              }
              src={
                settings.general.isAnonymized && !isLoggedIn
                  ? anonymousSvg
                  : `/api/image?url=${encodeURIComponent(
                      `${settings.connection.tautulliUrl}/pms_image_proxy?img=${session.user_thumb}&width=300`,
                    )}`
              }
              sizes='6rem'
              priority
            />
          </div>
          {/* User info */}
          <div>
            <div
              className={clsx(
                'text-sm font-semibold sm:text-base',
                isLoggedIn && 'gradient-plex',
              )}
            >
              {settings.general.isAnonymized && !isLoggedIn
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
  )
}

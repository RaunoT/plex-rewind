'use client'

import anonymousSvg from '@/components/MediaItem/anonymous.svg'
import { usePoster } from '@/hooks/usePoster'
import { Settings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import {
  generateDeeplinkUrl,
  getDeeplinkRatingKeyFromSession,
} from '@/utils/deeplink'
import {
  calculateETA,
  formatBitrate,
  millisecondsToTimeString,
} from '@/utils/formatting'
import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { capitalize, toUpper } from 'lodash'
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
  const { data: user } = useSession()
  const isCurrentUser = session.user_id == user?.user.id
  const isAdmin = user?.user.isAdmin
  const {
    audio_channel_layout,
    audio_codec,
    bandwidth,
    bitrate,
    container,
    friendly_name,
    grandparent_title,
    ip_address,
    ip_address_public,
    location,
    media_type,
    parent_title,
    player,
    product,
    quality_profile,
    state,
    stream_audio_channel_layout,
    stream_audio_codec,
    stream_audio_decision,
    stream_audio_language,
    stream_bitrate,
    stream_container,
    stream_container_decision,
    stream_subtitle_codec,
    stream_subtitle_decision,
    stream_subtitle_language,
    stream_video_codec,
    stream_video_decision,
    stream_video_dynamic_range,
    stream_video_full_resolution,
    subtitle_codec,
    title,
    transcode_decision,
    transcode_throttled,
    video_codec,
    video_dynamic_range,
    video_full_resolution,
  } = session

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
                alt={grandparent_title + ' ' + t('poster')}
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
          <div className='mb-4'>
            {grandparent_title && (
              <p className='text-xs text-neutral-400 sm:text-sm'>
                {grandparent_title}
              </p>
            )}
            <h2 className='text-sm font-bold sm:text-lg'>
              {serverId ? (
                <a
                  href={generateDeeplinkUrl(
                    getDeeplinkRatingKeyFromSession(session),
                    serverId,
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-light'
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </h2>
            {parent_title && (
              <p className='text-xs text-neutral-400 sm:text-sm'>
                {parent_title}
              </p>
            )}
          </div>
          {/* Stream info */}
          <ul className='grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2'>
            {/* Stream */}
            <li>
              {getTitle(t('stream'))}
              <div>
                {capitalize(
                  transcode_decision === 'copy'
                    ? 'direct stream'
                    : transcode_decision,
                )}
                {`${transcode_throttled ? ' (throttled)' : ''}`}
              </div>
            </li>
            {/* Quality */}
            <li>
              {getTitle(t('quality'), quality_profile)}
              {checkTranscode(
                formatBitrate(bitrate),
                formatBitrate(stream_bitrate),
                transcode_decision,
              )}
            </li>
            {/* Bandwidth */}
            {/* TODO: Tautulli doesn't return bandwidth for tracks sometimes */}
            <li>
              {getTitle(t('bandwidth'))}
              {formatBitrate(bandwidth)}
            </li>
            {/* Video */}
            {media_type !== 'track' && (
              <li>
                {getTitle(t('video'), stream_video_decision)}
                {checkTranscode(
                  `${toUpper(video_codec)} ${toUpper(video_full_resolution)} ${video_dynamic_range}`,
                  `${toUpper(stream_video_codec)} ${toUpper(stream_video_full_resolution)} ${stream_video_dynamic_range}`,
                  stream_video_decision,
                )}
              </li>
            )}
            {/* Audio */}
            <li>
              {getTitle(t('audio'), stream_audio_decision)}
              {checkTranscode(
                `${media_type !== 'track' ? `${stream_audio_language} - ` : ''}${toUpper(audio_codec)} ${audio_channel_layout}`,
                `${toUpper(stream_audio_codec)} ${stream_audio_channel_layout}`,
                stream_audio_decision,
              )}
            </li>
            {/* Subtitles */}
            {media_type !== 'track' && (
              <li>
                {getTitle(t('subtitles'), stream_subtitle_decision)}
                {checkTranscode(
                  `${stream_subtitle_language} - ${toUpper(subtitle_codec)}`,
                  toUpper(stream_subtitle_codec),
                  stream_subtitle_decision,
                )}
              </li>
            )}
            {/* Container */}
            <li>
              {getTitle(
                t('container'),
                stream_container_decision === 'transcode'
                  ? 'converting'
                  : stream_container_decision,
              )}
              {checkTranscode(
                toUpper(container),
                toUpper(stream_container),
                stream_container_decision,
              )}
            </li>
            {/* Location */}
            {isAdmin && !settings.general.isAnonymized && (
              <li>
                {getTitle(t('location'), toUpper(location))}
                {location === 'wan' ? (
                  <a
                    href={`https://ipinfo.io/${ip_address_public}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='link-light text-blue-300 underline'
                  >
                    {ip_address_public}
                  </a>
                ) : (
                  <span>{ip_address}</span>
                )}
              </li>
            )}
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
                settings.general.isAnonymized && !isCurrentUser
                  ? t('anonymousAvatar')
                  : friendly_name + ' ' + t('avatar')
              }
              src={
                settings.general.isAnonymized && !isCurrentUser
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
                isCurrentUser && 'gradient-plex',
              )}
            >
              {settings.general.isAnonymized && !isCurrentUser
                ? `${t('anonymous')} #${index + 1}`
                : friendly_name}
            </div>
            <div className='text-xs text-neutral-400 sm:text-sm'>
              {product} ({player})
            </div>
          </div>
        </div>
        {/* State */}
        <div>
          {state === 'playing' ? (
            <PlayIcon className='size-5' />
          ) : (
            <PauseIcon className='size-5' />
          )}
        </div>
      </div>
    </li>
  )
}

function checkTranscode(original: string, stream: string, transcode: string) {
  const showDiff =
    transcode &&
    transcode !== 'direct play' &&
    transcode !== 'copy' &&
    transcode !== 'ignore'

  return (
    <div>
      <span>{original}</span>
      {showDiff && (
        <>
          {' '}
          → <span>{stream}</span>
        </>
      )}
    </div>
  )
}

function getTitle(title: string, parenthesis?: string) {
  let newTitle = parenthesis

  if (parenthesis === 'copy') {
    newTitle = 'direct stream'
  }

  return (
    <div className='mb-0.5 font-medium text-neutral-400'>
      <span>{title}</span>
      {newTitle && <span> ({newTitle})</span>}
    </div>
  )
}

'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import Avatar from '@/components/Avatar'
import ImageFallback from '@/components/ImageFallback'
import TitleDetails from '@/components/MediaItem/TitleDetails'
import PosterImage from '@/components/PosterImage'
import SkeletonLine from '@/components/SkeletonLine'
import { useMediaDetails } from '@/hooks/useMediaDetails'
import { PublicSettings } from '@/types/settings'
import { TautulliSession } from '@/types/tautulli'
import {
  generateDeeplinkUrl,
  getDeeplinkRatingKeyFromSession,
} from '@/utils/deeplink'
import {
  calculateETA,
  formatBitrate,
  formatChannels,
  formatCodec,
  formatDevice,
  formatDynamicRange,
  formatPercent,
  formatResolution,
  millisecondsToTimeString,
} from '@/utils/formatting'
import { ArrowTurnDownRightIcon } from '@heroicons/react/16/solid'
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CpuChipIcon,
  PauseIcon,
  PlayIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { capitalize, toUpper } from 'lodash'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { ReactNode, useContext, useId, useState } from 'react'

type DecisionKind = 'directPlay' | 'directStream' | 'transcode'

// Green when the file plays as is, blue when only its container changes, and
// Plex orange when the server converts it
const DECISION_ICONS: Record<
  DecisionKind,
  { Icon: typeof CheckCircleIcon; className: string }
> = {
  directPlay: { Icon: CheckCircleIcon, className: 'text-success' },
  directStream: { Icon: ArrowsRightLeftIcon, className: 'text-sky-400' },
  transcode: { Icon: CpuChipIcon, className: 'text-plex' },
}

type ActivityItemProps = {
  session: TautulliSession
  index: number
  settings: PublicSettings
  serverId?: string
}

export default function ActivityItem({
  session,
  index,
  settings,
  serverId,
}: ActivityItemProps) {
  const { posterUrl, isPosterLoading, details, isDetailsLoading } =
    useMediaDetails(session, settings)
  const t = useTranslations('Activity')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const { data: user } = useSession()
  const isCurrentUser = String(session.user_id) === user?.user.id
  const isAdmin = user?.user.isAdmin
  const {
    activity: { isDetailsHidden, setIsDetailsHidden },
  } = useContext(GlobalContext)
  // Each card opens the way the last one was left, and keeps its own state
  const [isExpanded, setIsExpanded] = useState(!isDetailsHidden)
  const detailsId = useId()
  const {
    audio_atmos,
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
    stream_audio_atmos,
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
    video_codec,
    video_dynamic_range,
    video_full_resolution,
  } = session

  function formatDecision(decision?: string) {
    const kind = getDecisionKind(decision)

    return kind ? t(`decision.${kind}`) : decision
  }

  const videoSource = joinParts(
    formatResolution(video_full_resolution),
    formatCodec(video_codec, 'video'),
    formatDynamicRange(video_dynamic_range),
  )
  const videoStream = joinParts(
    formatResolution(stream_video_full_resolution),
    formatCodec(stream_video_codec, 'video'),
    formatDynamicRange(stream_video_dynamic_range),
  )
  const audioSource = joinParts(
    formatCodec(audio_codec, 'audio'),
    isAtmos(audio_atmos) ? 'Atmos' : '',
    formatChannels(audio_channel_layout),
  )
  const audioStream = joinParts(
    formatCodec(stream_audio_codec, 'audio'),
    isAtmos(stream_audio_atmos) ? 'Atmos' : '',
    formatChannels(stream_audio_channel_layout),
  )
  const bitrateSource = formatBitrate(bitrate, locale)
  const bitrateStream = formatBitrate(stream_bitrate, locale)
  const qualityConversion = getConversion(
    bitrateSource,
    bitrateStream,
    transcode_decision,
  )
  const subtitleSource = formatCodec(subtitle_codec, 'subtitle')
  const subtitleStream = formatCodec(stream_subtitle_codec, 'subtitle')
  const isAnonymous = settings.general.isAnonymized && !isCurrentUser
  const isVideo = media_type === 'episode' || media_type === 'movie'
  const subtitle = [grandparent_title, parent_title].filter(Boolean).join(' · ')
  const eta = calculateETA(session.duration, session.view_offset, locale)
  // The player's name is a stream detail, so it hides with them
  const device = isExpanded ? formatDevice(product, player) : product || player
  // Only Tautulli reports buffering, and anything unexpected reads as paused
  const playbackState =
    state === 'playing' || state === 'buffering' ? state : 'paused'
  const decisionKind = getDecisionKind(transcode_decision)
  const decisionIcon = decisionKind && DECISION_ICONS[decisionKind]

  function toggleDetails() {
    setIsExpanded(!isExpanded)
    // New cards, and the next visit, open the same way
    setIsDetailsHidden(isExpanded)
  }

  return (
    <li className='w-full py-6 first:pt-0 last:pb-0 sm:py-8'>
      {/* Who is watching, and on what */}
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2 text-sm'>
          <div className='relative size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15'>
            {isAnonymous ? (
              <ImageFallback alt={t('anonymousAvatar')}>
                <UserIcon className='size-[60cqw]' />
              </ImageFallback>
            ) : (
              <Avatar
                src={session.user_thumb}
                name={friendly_name}
                alt={tCommon('profilePictureAlt', { name: friendly_name })}
                sizes='3rem'
                priority
              />
            )}
          </div>
          <span
            className={clsx(
              'shrink-0 font-medium',
              isCurrentUser && 'text-plex',
            )}
          >
            {isAnonymous
              ? t('anonymous', { number: index + 1 })
              : friendly_name}
          </span>
          {device && (
            <span className='truncate text-neutral-400'>{device}</span>
          )}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          {/* Only the icon on phones, so the device has room */}
          <span className='icon-stat-wrapper text-xs max-sm:p-1 sm:text-sm'>
            {playbackState === 'playing' && <PlayIcon />}
            {playbackState === 'buffering' && (
              <ArrowPathIcon className='motion-safe:animate-spin' />
            )}
            {playbackState === 'paused' && <PauseIcon />}
            <span className='max-sm:sr-only'>{t(playbackState)}</span>
          </span>
          {/* How the stream gets there, which opens the rest. Its colour shows
              when the details are worth a look. Without the text on phones,
              and taps 10px above and below count too, for a 40px tap area. */}
          <button
            type='button'
            className='icon-stat-wrapper focus-visible:focus-ring relative cursor-pointer pr-2 text-xs transition-colors after:absolute after:inset-x-0 after:-inset-y-2.5 hover:bg-white/10 max-sm:p-1 sm:text-sm'
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            onClick={toggleDetails}
          >
            {decisionIcon && (
              <decisionIcon.Icon className={decisionIcon.className} />
            )}
            <span className='max-sm:sr-only'>
              {capitalize(formatDecision(transcode_decision))}
            </span>
            <span className='sr-only'>{` (${t('streamDetails')})`}</span>
            <ChevronDownIcon
              className={clsx(
                'transition-transform',
                isExpanded && 'rotate-180',
              )}
            />
          </button>
        </div>
      </div>

      {/* What is playing, beside its poster. On phones the progress goes under
          both, where the times fit on one line. */}
      <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-4 sm:grid-rows-[1fr_auto] sm:gap-y-0'>
        <div
          className={clsx('poster sm:row-span-2', {
            skeleton: isPosterLoading,
          })}
        >
          {!isPosterLoading && (
            <PosterImage
              srcs={[posterUrl, details?.poster]}
              type={media_type}
              alt={t('poster', { title: grandparent_title || title })}
              sizes='6rem'
              priority
            />
          )}
        </div>

        <div className='min-w-0 self-center sm:self-start'>
          {subtitle && (
            <p className='truncate text-xs text-neutral-400 sm:text-sm'>
              {subtitle}
            </p>
          )}
          <h2
            className='mb-1.5 truncate text-base leading-snug font-medium sm:text-lg'
            title={title}
          >
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
          {/* The show's or movie's, like on the dashboard */}
          {isVideo &&
            (isDetailsLoading ? (
              <SkeletonLine className='text-xs sm:text-sm' width='w-24' />
            ) : (
              details && (
                <TitleDetails
                  data={details}
                  activeStats={settings.general.activeItemStatistics}
                />
              )
            ))}
        </div>

        {session.duration && session.view_offset && (
          <div className='col-span-2 text-xs text-neutral-400 tabular-nums sm:col-span-1 sm:col-start-2 sm:pt-3'>
            <div
              className='h-1.5 overflow-hidden rounded-full bg-white/10'
              aria-hidden='true'
            >
              <div
                className='h-full rounded-full bg-white'
                style={{ width: `${Number(session.progress_percent)}%` }}
              />
            </div>
            {/* On narrow cards the end time goes on its own line, still
                on the right, instead of breaking either half */}
            <div className='mt-1.5 flex flex-wrap justify-between gap-x-3 whitespace-nowrap'>
              <span>
                {millisecondsToTimeString(parseInt(session.view_offset))} /{' '}
                {millisecondsToTimeString(parseInt(session.duration))}
              </span>
              <span className='ml-auto'>
                {formatPercent(Number(session.progress_percent), locale)}
                {eta && ` · ${t('endsAt', { time: eta })}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stream info: what is playing first, then how it gets there */}
      {isExpanded && (
        <ul
          id={detailsId}
          className='mt-4 flex flex-wrap gap-x-6 gap-y-3 rounded-2xl bg-black/25 p-4 text-sm ring-1 ring-white/10 ring-inset'
        >
          {media_type !== 'track' && (
            <Detail
              label={t('video')}
              convertedTo={getConversion(
                videoSource,
                videoStream,
                stream_video_decision,
              )}
            >
              {formatValue(videoSource || videoStream)}
            </Detail>
          )}
          <Detail
            label={withLanguage(
              t('audio'),
              media_type !== 'track' && stream_audio_language,
            )}
            convertedTo={getConversion(
              audioSource,
              audioStream,
              stream_audio_decision,
            )}
          >
            {formatValue(audioSource || audioStream)}
          </Detail>
          {media_type !== 'track' &&
            (subtitle_codec || stream_subtitle_codec) && (
              <Detail
                label={withLanguage(t('subtitles'), stream_subtitle_language)}
                convertedTo={
                  stream_subtitle_decision === 'burn'
                    ? t('decision.burnedIn')
                    : getConversion(
                        subtitleSource,
                        subtitleStream,
                        stream_subtitle_decision,
                      )
                }
              >
                {formatValue(subtitleSource || subtitleStream)}
              </Detail>
            )}
          {/* The profile describes what is streamed, so it goes with that bitrate */}
          <Detail
            label={t('quality')}
            convertedTo={
              qualityConversion &&
              formatValue(quality_profile, qualityConversion)
            }
          >
            {formatValue(
              !qualityConversion && quality_profile,
              bitrateSource || bitrateStream,
            )}
          </Detail>
          {/* TODO: Tautulli doesn't return bandwidth for tracks sometimes */}
          <Detail label={t('bandwidth')}>
            {formatValue(formatBitrate(bandwidth, locale))}
          </Detail>
          <Detail
            label={t('container')}
            convertedTo={getConversion(
              toUpper(container),
              toUpper(stream_container),
              stream_container_decision,
            )}
          >
            {formatValue(toUpper(container) || toUpper(stream_container))}
          </Detail>
          {isAdmin && !settings.general.isAnonymized && location && (
            <Detail label={t('location')}>
              {`${toUpper(location)} · `}
              {location === 'wan' ? (
                <a
                  href={`https://ipinfo.io/${ip_address_public}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-white'
                >
                  {ip_address_public}
                </a>
              ) : (
                ip_address
              )}
            </Detail>
          )}
        </ul>
      )}
    </li>
  )
}

// Tautulli sends 0 or 1, Tracearr a boolean
function isAtmos(value?: number | boolean) {
  return Number(value) === 1
}

// Plex's decisions, grouped by how much work they are for the server
function getDecisionKind(decision?: string): DecisionKind | undefined {
  switch (decision) {
    case 'direct play':
      return 'directPlay'
    case 'copy':
      return 'directStream'
    case 'transcode':
    // Burning in subtitles is a transcode too
    case 'burn':
      return 'transcode'
  }
}

function isTranscoding(decision?: string) {
  return getDecisionKind(decision) === 'transcode'
}

function joinParts(...parts: string[]) {
  return parts.filter(Boolean).join(' ')
}

// What it becomes, only when Plex converts a known source to something else.
// Without the source, the stream is shown in its place instead.
function getConversion(source: string, stream: string, decision?: string) {
  return isTranscoding(decision) && source && stream && stream !== source
    ? stream
    : undefined
}

function withLanguage(label: string, language?: string | false) {
  return language ? `${label} (${language})` : label
}

function formatValue(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' · ') || '–'
}

type DetailProps = {
  label: string
  convertedTo?: string
  children: ReactNode
}

// The original stays on top and the conversion goes below it in gold, as
// converting is what costs the server
function Detail({ label, convertedTo, children }: DetailProps) {
  const t = useTranslations('Activity')

  return (
    <li>
      <div className='mb-0.5 text-xs text-neutral-400'>{label}</div>
      <div className='text-pretty'>{children}</div>
      {convertedTo && (
        <div className='text-plex flex gap-1'>
          <span className='flex h-[1lh] shrink-0 items-center'>
            <ArrowTurnDownRightIcon className='size-3.5' aria-hidden='true' />
          </span>
          <span>
            <span className='sr-only'>{t('convertedTo')} </span>
            {convertedTo}
          </span>
        </div>
      )}
    </li>
  )
}

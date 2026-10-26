import anonymousSvg from '@/components/MediaItem/anonymous.svg'
import { RewindStory } from '@/types/rewind'
import { getRewindStartDate } from '@/utils/helpers'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'
import RewindStat from '../RewindStat'

function formatDate(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateString))
}

export default function StoryWelcome({
  userRewind,
  isPaused,
  settings,
}: RewindStory) {
  const startDate = getRewindStartDate(settings)
  const isDefaultPeriod = !settings.rewind.startDate
  const t = useTranslations('Rewind.Welcome')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const formattedStartDate = formatDate(startDate, locale)
  // The window always runs to now, so the displayed range ends today.
  const formattedEndDate = formatDate(
    new Date().toISOString().split('T')[0],
    locale,
  )
  const [imageSrc, setImageSrc] = useState<string>(
    userRewind.user.image || anonymousSvg,
  )

  return (
    <>
      <RewindStat isPaused={isPaused} noScale isAnimated={false}>
        <div className='relative mb-8 size-24'>
          <Image
            src={imageSrc}
            alt={`${userRewind.user.name} ${tCommon('profilePictureAlt')}`}
            className='rounded-full object-cover'
            sizes='10rem'
            onError={() => setImageSrc(anonymousSvg)}
            fill
            priority
          />
        </div>
        <p>
          {t.rich('welcome', {
            serverName: settings.general.serverName || 'Plex',
            userValue: userRewind.user.name,
            rewind: (chunks) => <span className='gradient-plex'>{chunks}</span>,
            user: (chunks) => <span className='rewind-cat'>{chunks}</span>,
          })}
        </p>
      </RewindStat>

      <RewindStat isPaused={isPaused} renderDelay={2} scaleDelay={2} noScale>
        <p>
          {t('takeYouThrough')}{' '}
          {isDefaultPeriod
            ? t.rich('forPastYear', {
                pastYear: (chunks) => (
                  <span className='rewind-cat'>{chunks}</span>
                ),
              })
            : formattedStartDate === formattedEndDate
              ? t.rich('singleDate', {
                  singleDateValue: formattedStartDate,
                  singleDate: (chunks) => (
                    <span className='rewind-cat'>{chunks}</span>
                  ),
                })
              : t.rich('dateRange', {
                  startDateValue: formattedStartDate,
                  endDateValue: formattedEndDate,
                  startDate: (chunks) => (
                    <span className='rewind-cat'>{chunks}</span>
                  ),
                  endDate: (chunks) => (
                    <span className='rewind-cat'>{chunks}</span>
                  ),
                })}
        </p>
      </RewindStat>

      <RewindStat isPaused={isPaused} renderDelay={4} loaderDelay={2} noScale>
        <p>{t('letsGetStarted')}</p>
      </RewindStat>
    </>
  )
}

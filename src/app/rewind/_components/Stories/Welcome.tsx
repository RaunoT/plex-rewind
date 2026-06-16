import { RewindStory } from '@/types/rewind'
import { getRewindStartDate } from '@/utils/helpers'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import RewindStat from '../RewindStat'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const month = date.toLocaleString('default', { month: 'short' })
  const year = date.getFullYear()

  return `${month} ${year}`
}

export default function StoryWelcome({
  userRewind,
  isPaused,
  settings,
}: RewindStory) {
  const startDate = getRewindStartDate(settings)
  const isDefaultPeriod = !settings.rewind.startDate
  const t = useTranslations('Rewind.Welcome')
  const formattedStartDate = formatDate(startDate)
  // The window always runs to now, so the displayed range ends today.
  const formattedEndDate = formatDate(new Date().toISOString().split('T')[0])

  return (
    <>
      <RewindStat isPaused={isPaused} noScale isAnimated={false}>
        <div className='relative mb-8 size-24'>
          <Image
            src={userRewind.user.image || ''}
            alt={`${userRewind.user.name} profile picture`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
        <p>
          {t.rich('welcome', {
            serverName: settings.general.serverName || 'Plex',
            rewind: (chunks) => (
              <span className='gradient-plex'>{chunks} </span>
            ),
          })}
          <span className='rewind-cat'>{userRewind.user.name}!</span>
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

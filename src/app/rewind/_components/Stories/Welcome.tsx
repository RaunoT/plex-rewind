import { RewindStory } from '@/types/rewind'
import { getRewindDateRange } from '@/utils/helpers'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const month = date.toLocaleString('default', { month: 'short' })
  const year = date.getFullYear()

  return `${month} ${year}`
}

export default function StoryWelcome({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const { startDate, endDate } = getRewindDateRange(settings)
  const isDefaultPeriod = !settings.rewind.startDate && !settings.rewind.endDate
  const t = useTranslations('Rewind.Welcome')
  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale isAnimated={false}>
        <div className='animate-fade-up relative mb-8 size-24'>
          <Image
            src={userRewind.user.image || ''}
            alt={`${userRewind.user.name} profile picture`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
        <p className='animate-fade-up mb-4 animation-delay-500'>
          {t.rich('welcome', {
            rewind: (chunks) => (
              <span className='whitespace-nowrap'>
                {/* eslint-disable-next-line react/jsx-no-literals */}
                <span className='gradient-plex'>{chunks}</span>,
              </span>
            ),
          })}
          <span className='whitespace-nowrap'>
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <span className='rewind-cat'>{userRewind.user.name}!</span>
          </span>
        </p>
        <p className='animate-fade-up mb-4 animation-delay-[2000ms]'>
          {t('takeYouThrough')}{' '}
          <span className='whitespace-nowrap'>
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
          </span>
        </p>
        <p className='animate-fade-up animation-delay-[4000ms]'>
          {t('letsGetStarted')}
        </p>
      </RewindStat>
    </StoryWrapper>
  )
}

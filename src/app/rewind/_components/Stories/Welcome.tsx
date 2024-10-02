import { RewindStory } from '@/types/rewind'
import { getHistoryDateRange } from '@/utils/helpers'
import Image from 'next/image'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const month = date.toLocaleString('default', { month: 'short' })
  const year = date.getFullYear()

  return `${month} ${year}`
}

function getDateRange(startDate: string, endDate: string, isDefault: boolean) {
  if (isDefault) {
    return (
      <>
        for the <span className='rewind-cat'>past year.</span>
      </>
    )
  }

  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)

  return formattedStartDate === formattedEndDate ? (
    <>
      during <span className='rewind-cat'>{formattedStartDate}.</span>
    </>
  ) : (
    <>
      from <span className='rewind-cat'>{formattedStartDate}</span> to{' '}
      <span className='rewind-cat'>{formattedEndDate}.</span>
    </>
  )
}

export default function StoryWelcome({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  const { startDate, endDate } = getHistoryDateRange(settings)
  const isDefaultPeriod = !settings.rewind.startDate && !settings.rewind.endDate
  const dateRange = getDateRange(startDate, endDate, isDefaultPeriod)

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
          Welcome to your{' '}
          <span className='whitespace-nowrap'>
            <span className='gradient-plex'>Plex Rewind</span>,
          </span>{' '}
          <span className='whitespace-nowrap'>
            <span className='rewind-cat'>{userRewind.user.name}!</span>
          </span>
        </p>
        <p className='animate-fade-up mb-4 animation-delay-[2000ms]'>
          We&apos;ll take you through your highlights{' '}
          <span className='whitespace-nowrap'>{dateRange}</span>
        </p>
        <p className='animate-fade-up animation-delay-[4000ms]'>
          Let&apos;s get started!
        </p>
      </RewindStat>
    </StoryWrapper>
  )
}

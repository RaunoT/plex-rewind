import { RewindStory } from '@/types/rewind'
import Image from 'next/image'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryWelcome({
  userRewind,
  isPaused,
  pause,
  resume,
}: RewindStory) {
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
        <p className='animate-fade-up animation-delay-[2000ms]'>
          Let&apos;s get started!
        </p>
      </RewindStat>
    </StoryWrapper>
  )
}

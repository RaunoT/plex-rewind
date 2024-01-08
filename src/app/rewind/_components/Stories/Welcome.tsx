import PlexRewindIcon from '@/app/icon.svg'
import { RewindStory } from '@/types'
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
        <p className='animate-fade-up animation-delay-600 mb-4'>
          Welcome to your{' '}
          <span className='whitespace-nowrap'>
            <span className='rewind-cat text-yellow-500'>
              Plex Rewind <Image src={PlexRewindIcon} alt='Plex Rewind icon' />
            </span>
            ,
          </span>{' '}
          <span className='whitespace-nowrap'>
            <span className='rewind-cat'>{userRewind.user.name}</span>!
          </span>
        </p>
        {/* TODO: animate in a second later */}
        <p className='animate-fade-up animation-delay-2000'>
          Let&apos;s get started!
        </p>
      </RewindStat>
    </StoryWrapper>
  )
}

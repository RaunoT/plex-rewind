import PlexRewindIcon from '@/app/icon.svg'
import { RewindStory } from '@/types'
import { User } from 'next-auth'
import Image from 'next/image'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

type Props = Omit<RewindStory, 'userRewind'> & {
  user: User
}

export default function StoryWelcome({ user, isPaused, pause, resume }: Props) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-4'>
          Welcome to your{' '}
          <span className='rewind-cat text-yellow-500'>
            Plex Rewind <Image src={PlexRewindIcon} alt='Plex Rewind icon' />
          </span>
          , <span className='rewind-cat'>{user!.name}</span>!
        </p>
        <div className='relative mb-10 size-24'>
          <Image
            src={user!.image || ''}
            alt={`${user!.name} profile picture`}
            className='rounded-full object-cover'
            sizes='10rem'
            fill
            priority
          />
        </div>
        <p>Let&apos;s get started!</p>
      </RewindStat>
    </StoryWrapper>
  )
}

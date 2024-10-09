import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { UsersIcon } from '@heroicons/react/24/outline'
import RewindStat from '../RewindStat'
import StoryWrapper from '../StoryWrapper'

export default function StoryUsersTop({
  userRewind,
  isPaused,
  pause,
  resume,
  settings,
}: RewindStory) {
  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat noScale>
        <p className='mb-2'>
          Here&apos;s how you compared to other{''}
          <span className='rewind-cat'>
            Users
            <UsersIcon />
          </span>
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='users'
            items={userRewind.usersTop!}
            serverId={userRewind.server_id}
            rows
            settings={settings}
          />
        </div>
      </RewindStat>
    </StoryWrapper>
  )
}

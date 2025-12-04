import MediaItems from '@/components/MediaItem/MediaItems'
import { RewindStory } from '@/types/rewind'
import { UsersIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryUsersTop({ userRewind, settings }: RewindStory) {
  const t = useTranslations('Rewind.Users')

  return (
    <>
      <RewindStat noScale>
        <p className='mb-2'>
          {t.rich('top', {
            users: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <UsersIcon />
              </span>
            ),
          })}
        </p>

        <div className='text-base not-italic'>
          <MediaItems
            type='users'
            items={userRewind.usersTop!}
            serverId={userRewind.server_id}
            rows
            settings={settings}
            loggedInUserId={userRewind.user.id}
          />
        </div>
      </RewindStat>
    </>
  )
}

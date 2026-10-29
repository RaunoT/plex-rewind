import { RewindStory } from '@/types/rewind'
import { VideoCameraIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import TopPeople from '../TopPeople'

export default function StoryMoviesDirectors({
  userRewind,
  pause,
}: RewindStory) {
  const t = useTranslations('Rewind.Common')
  const directors = userRewind.people.directors

  return (
    <RewindStat noScale>
      <p className='mb-2'>
        {t.rich('topDirectors', {
          top: (chunks) => (
            <span className='rewind-cat'>
              {chunks}
              <VideoCameraIcon />
            </span>
          ),
          count: directors.length,
        })}
      </p>

      <div className='text-base leading-normal font-normal tracking-normal'>
        <TopPeople people={directors} type='movie' onExpand={pause} />
      </div>
    </RewindStat>
  )
}

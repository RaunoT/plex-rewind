import { RewindStory } from '@/types/rewind'
import { bytesToSize } from '@/utils/formatting'
import {
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'
import StatListItem from '../StatListItem'
import StoryWrapper from '../StoryWrapper'

export default function StoryLibraries({
  userRewind,
  isPaused,
  pause,
  resume,
}: RewindStory) {
  const t = useTranslations('Rewind.Libraries')

  return (
    <StoryWrapper isPaused={isPaused} pause={pause} resume={resume}>
      <RewindStat isPaused={isPaused} scaleDelay={3}>
        <p>
          {t.rich('filesize', {
            filesize: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <FolderIcon />
              </span>
            ),
            plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
            size: (chunks) => (
              <span className='whitespace-nowrap'>
                <span className='rewind-stat'>{chunks}</span>
              </span>
            ),
            sizeValue: bytesToSize(userRewind.libraries_total_size),
          })}
        </p>
      </RewindStat>

      <RewindStat isPaused={isPaused} renderDelay={3} noScale>
        <p>{t('libraries')}</p>
        <ul className='list mt-2'>
          {userRewind.libraries.map((library) => {
            const libMap = {
              movie: {
                library: library.section_name,
                name: t('movies', { count: parseInt(library.count) }),
                icon: <FilmIcon />,
                count: parseInt(library.count),
              },
              show: {
                library: library.section_name,
                name: t('episodes', { count: parseInt(library.child_count) }),
                icon: <PlayCircleIcon />,
                count: parseInt(library.child_count),
              },
              artist: {
                library: library.section_name,
                name: t('tracks', { count: parseInt(library.child_count) }),
                icon: <MusicalNoteIcon />,
                count: parseInt(library.child_count),
              },
            }
            const libType = library.section_type

            return (
              <StatListItem key={library.section_id} {...libMap[libType]} />
            )
          })}
        </ul>
      </RewindStat>
    </StoryWrapper>
  )
}

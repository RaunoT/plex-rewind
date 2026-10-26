import { RewindStory } from '@/types/rewind'
import { bytesToSize } from '@/utils/formatting'
import {
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import RewindStat from '../RewindStat'
import StatListItem from '../StatListItem'

export default function StoryLibraries({
  userRewind,
  isPaused,
  settings,
}: RewindStory) {
  const translations = useTranslations()
  const t = useTranslations('Rewind.Libraries')
  // Only these section types have a matching line; others (e.g. photo) are skipped
  const libraryItems = userRewind.libraries.flatMap((library) => {
    const libMap: Partial<Record<string, ComponentProps<typeof StatListItem>>> =
      {
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
    const props = libMap[library.section_type]

    return props ? [{ id: library.section_id, props }] : []
  })

  return (
    <>
      <RewindStat isPaused={isPaused} scaleDelay={3}>
        <p>
          {t.rich('filesize', {
            filesize: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <FolderIcon />
              </span>
            ),
            serverName: settings.general.serverName || 'Plex',
            plex: (chunks) => <span className='gradient-plex'>{chunks}</span>,
            size: (chunks) => (
              <span className='whitespace-nowrap'>
                <span className='rewind-stat'>{chunks}</span>
              </span>
            ),
            sizeValue:
              bytesToSize(
                userRewind.libraries_total_size,
                undefined,
                translations,
              ) || '',
          })}
        </p>
        {userRewind.libraries_size_is_partial && (
          <p className='mt-2 text-base text-neutral-300 not-italic'>
            {t(
              settings.connection.statisticsSource === 'tracearr'
                ? 'sizePartialTracearr'
                : 'sizePartial',
            )}
          </p>
        )}
      </RewindStat>

      {libraryItems.length > 0 && (
        <RewindStat isPaused={isPaused} renderDelay={3} noScale>
          <p>{t('libraries')}</p>
          <ul className='list mt-2'>
            {libraryItems.map((item) => (
              <StatListItem key={item.id} {...item.props} />
            ))}
          </ul>
        </RewindStat>
      )}
    </>
  )
}

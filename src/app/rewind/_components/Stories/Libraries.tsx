import { MEDIA_ICONS, STAT_ICONS } from '@/components/icons'
import { RewindStory } from '@/types/rewind'
import { bytesToSize } from '@/utils/formatting'
import { getMediaServerName } from '@/utils/mediaServerName'
import { useTranslations } from 'next-intl'
import { ComponentProps } from 'react'
import RewindStat from '../RewindStat'
import StatListItem from '../StatListItem'

export default function StoryLibraries({ userRewind, settings }: RewindStory) {
  const translations = useTranslations()
  const t = useTranslations('Rewind.Libraries')
  // Only these section types have a matching line; others (e.g. photo) are skipped
  const libraryItems = userRewind.libraries.flatMap((library) => {
    const libMap: Partial<Record<string, ComponentProps<typeof StatListItem>>> =
      {
        movie: {
          library: library.section_name,
          name: t('movies', { count: parseInt(library.count) }),
          icon: <MEDIA_ICONS.movie />,
          count: parseInt(library.count),
        },
        show: {
          library: library.section_name,
          name: t('episodes', { count: parseInt(library.child_count) }),
          icon: <MEDIA_ICONS.show />,
          count: parseInt(library.child_count),
        },
        artist: {
          library: library.section_name,
          name: t('tracks', { count: parseInt(library.child_count) }),
          icon: <MEDIA_ICONS.artist />,
          count: parseInt(library.child_count),
        },
      }
    const props = libMap[library.section_type]

    return props ? [{ id: library.section_id, props }] : []
  })

  return (
    <>
      <RewindStat>
        <p>
          {t.rich('filesize', {
            filesize: (chunks) => (
              <span className='rewind-cat'>
                {chunks}
                <STAT_ICONS.size />
              </span>
            ),
            serverName:
              settings.general.serverName ||
              getMediaServerName(settings.connection.mediaServerType),
            plex: (chunks) => chunks,
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
        <RewindStat step={1} noScale>
          <p>{t('libraries')}</p>
          <ul className='mt-2'>
            {libraryItems.map((item) => (
              <StatListItem key={item.id} {...item.props} />
            ))}
          </ul>
        </RewindStat>
      )}
    </>
  )
}

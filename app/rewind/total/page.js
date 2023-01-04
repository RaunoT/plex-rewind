import {
  BookOpenIcon,
  ChartPieIcon,
  ClockIcon,
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import StatListItem from '../../../ui/StatListItem'
import fetchTautulli from '../../../utils/fetchTautulli'
import { bytesToSize, secondsToTime } from '../../../utils/formatting'

async function getUserTotalDuration() {
  const filterLibraryDurationByUser = (library, userId = 8898770) => {
    return library.response?.data?.filter((user) => user.user_id === userId)[0]
      .total_time
  }
  const [musicUserStats, showsUserStats, moviesUserStats, audiobooksUserStats] =
    // FIXME: Start date is wrong
    await Promise.all([
      fetchTautulli('get_library_user_stats', {
        section_id: 1,
      }),
      fetchTautulli('get_library_user_stats', {
        section_id: 2,
      }),
      fetchTautulli('get_library_user_stats', {
        section_id: 3,
      }),
      fetchTautulli('get_library_user_stats', {
        section_id: 4,
      }),
    ])

  return (
    filterLibraryDurationByUser(musicUserStats) +
    filterLibraryDurationByUser(showsUserStats) +
    filterLibraryDurationByUser(moviesUserStats) +
    filterLibraryDurationByUser(audiobooksUserStats)
  )
}

async function getLibraryTotalSize() {
  const [musicMediaInfo, showsMediaInfo, moviesMediaInfo, audiobooksMediaInfo] =
    await Promise.all([
      fetchTautulli('get_library_media_info', {
        section_id: 1,
        length: 0,
      }),
      fetchTautulli('get_library_media_info', {
        section_id: 2,
        length: 0,
      }),
      fetchTautulli('get_library_media_info', {
        section_id: 3,
        length: 0,
      }),
      fetchTautulli('get_library_media_info', {
        section_id: 4,
        length: 0,
      }),
    ])

  return bytesToSize(
    musicMediaInfo.response?.data?.total_file_size +
      showsMediaInfo.response?.data?.total_file_size +
      moviesMediaInfo.response?.data?.total_file_size +
      audiobooksMediaInfo.response?.data?.total_file_size,
  )
}

async function getLibraryTotalDuration() {
  const librariesTable = await fetchTautulli('get_libraries_table')
  let totalDuration = 0

  librariesTable.response?.data?.data?.forEach((library) => {
    totalDuration += library.duration
  })

  return totalDuration
}

async function getLibraryContentCount() {
  const libraries = await fetchTautulli('get_libraries')

  return libraries.response?.data
}

export default async function Total() {
  return (
    <CardContent
      statCategory="General stats"
      page="1 / 5"
      nextCard="/rewind/requests"
      subtitle="Rauno T"
      rewind
    >
      <Suspense fallback={<CardTextSkeleton />}>
        <Stats
          promises={[
            getUserTotalDuration(),
            getLibraryTotalSize(),
            getLibraryTotalDuration(),
            getLibraryContentCount(),
          ]}
        />
      </Suspense>
    </CardContent>
  )
}

async function Stats({ promises }) {
  const [
    userTotalDuration,
    libraryTotalSize,
    libraryTotalDuration,
    libraryContentCount,
  ] = await Promise.all(promises)

  return (
    <>
      <CardContentText hideAfter={10}>
        You&apos;ve spent a{' '}
        <span className="inline-flex items-center text-teal-300">
          Total
          <ClockIcon className="w-8 ml-1" />
        </span>{' '}
        of{' '}
        <span className="rewind-stat">{secondsToTime(userTotalDuration)}</span>{' '}
        on <span className="text-yellow-500">Plex</span> this year!
      </CardContentText>

      <CardContentText renderDelay={5} hideAfter={15}>
        That&apos;s{' '}
        <span className="inline-flex items-center text-teal-300">
          {Math.round((userTotalDuration * 100) / libraryTotalDuration)}
          %
          <ChartPieIcon className="w-8 ml-1" />
        </span>{' '}
        of all plays.
      </CardContentText>

      <CardContentText renderDelay={10} loaderDelay={5}>
        Did you know the{' '}
        <span className="inline-flex items-center text-teal-300">
          Filesize
          <FolderIcon className="w-8 ml-1" />
        </span>{' '}
        of all the available content on{' '}
        <span className="text-yellow-500">Plex</span> is{' '}
        <span className="rewind-stat">{libraryTotalSize}</span>
      </CardContentText>

      <CardContentText renderDelay={15} loaderDelay={10} noScale>
        The current library consist of:
        <ul className="list">
          {libraryContentCount.map((contentType, i) => {
            switch (contentType.section_name) {
              case 'TV Shows':
                return (
                  <StatListItem
                    count={contentType.child_count}
                    name="Episodes"
                    icon={<PlayCircleIcon className="w-8 ml-1" />}
                    key={i}
                  />
                )

              case 'Movies':
                return (
                  <StatListItem
                    count={contentType.count}
                    name="Movies"
                    icon={<FilmIcon className="w-8 ml-1" />}
                    key={i}
                  />
                )

              case 'Music':
                return (
                  <StatListItem
                    count={contentType.child_count}
                    name="Songs"
                    icon={<MusicalNoteIcon className="w-8 ml-1" />}
                    key={i}
                  />
                )

              case 'Audiobooks':
                return (
                  <StatListItem
                    count={contentType.parent_count}
                    name="Audiobooks"
                    icon={<BookOpenIcon className="w-8 ml-1" />}
                    key={i}
                  />
                )
            }
          })}
        </ul>
      </CardContentText>
    </>
  )
}

import CardContent from '@/components/CardContent'
import CardContentText from '@/components/CardContentText'
import StatListItem from '@/components/StatListItem'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import { fetchUser } from '@/utils/fetchOverseerr'
import fetchTautulli from '@/utils/fetchTautulli'
import { bytesToSize, secondsToTime, timeToSeconds } from '@/utils/formatting'
import {
  BookOpenIcon,
  ChartPieIcon,
  ClockIcon,
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Totals | Plex rewind',
  description: metaDescription,
}

async function getUserTotalDuration() {
  const user = await fetchUser()
  const userTotalDuration = await fetchTautulli('get_history', {
    user_id: user.plexId,
    after: ALLOWED_PERIODS.thisYear.string,
    length: 0,
  })

  return timeToSeconds(userTotalDuration.response?.data?.total_duration)
}

async function getlibrariesTotalSize() {
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
      audiobooksMediaInfo.response?.data?.total_file_size
  )
}

async function getLibrariesTotalDuration() {
  const librariesTotalDuration = await fetchTautulli('get_history', {
    after: ALLOWED_PERIODS.thisYear.string,
    length: 0,
  })

  return timeToSeconds(librariesTotalDuration.response?.data?.total_duration)
}

async function getlibraryContentCounts() {
  const libraries = await fetchTautulli('get_libraries')

  return libraries.response?.data
}

export default async function Total() {
  const [
    userTotalDuration,
    librariesTotalSize,
    librariesTotalDuration,
    libraryContentCounts,
    user,
  ] = await Promise.all([
    getUserTotalDuration(),
    getlibrariesTotalSize(),
    getLibrariesTotalDuration(),
    getlibraryContentCounts(),
    fetchUser(),
  ])

  return (
    <CardContent
      title='General stats'
      page='1 / 5'
      nextCard='/rewind/requests'
      subtitle={user.plexUsername}
    >
      {userTotalDuration != 0 ? (
        <>
          <CardContentText hideAfter={10}>
            <p>
              You&apos;ve spent a{' '}
              <span className='inline-flex items-center text-teal-300'>
                Total
                <ClockIcon className='w-8 ml-1' />
              </span>{' '}
              of{' '}
              <span className='rewind-stat'>
                {secondsToTime(userTotalDuration)}
              </span>{' '}
              on <span className='text-yellow-500'>Plex</span> this year!
            </p>
          </CardContentText>

          <CardContentText renderDelay={5} hideAfter={15}>
            <p>
              That&apos;s{' '}
              <span className='inline-flex items-center text-teal-300'>
                {Math.round((userTotalDuration * 100) / librariesTotalDuration)}
                %
                <ChartPieIcon className='w-8 ml-1' />
              </span>{' '}
              of all plays.
            </p>
          </CardContentText>
        </>
      ) : (
        <CardContentText hideAfter={15} scaleDelay={10}>
          <p>
            You haven&apos;t played any content on{' '}
            <span className='text-yellow-500'>Plex</span> this year!{' '}
            <span className='not-italic'>🤯</span> What are you waiting for?
          </p>
        </CardContentText>
      )}

      <CardContentText
        renderDelay={10}
        loaderDelay={userTotalDuration != 0 ? 5 : 0}
      >
        <p>
          Did you know the{' '}
          <span className='inline-flex items-center text-teal-300'>
            Filesize
            <FolderIcon className='w-8 ml-1' />
          </span>{' '}
          of all the available content on{' '}
          <span className='text-yellow-500'>Plex</span> is{' '}
          <span className='rewind-stat'>{librariesTotalSize}</span>
        </p>
      </CardContentText>

      <CardContentText renderDelay={15} loaderDelay={10} noScale>
        <p>The current library consist of:</p>
        <ul className='list'>
          {libraryContentCounts.map((contentType, i) => {
            switch (contentType.section_name) {
              case 'TV Shows':
                return (
                  <StatListItem
                    count={contentType.child_count}
                    name='Episodes'
                    icon={<PlayCircleIcon className='w-8 ml-1' />}
                    key={i}
                  />
                )

              case 'Movies':
                return (
                  <StatListItem
                    count={contentType.count}
                    name='Movies'
                    icon={<FilmIcon className='w-8 ml-1' />}
                    key={i}
                  />
                )

              case 'Music':
                return (
                  <StatListItem
                    count={contentType.child_count}
                    name='Songs'
                    icon={<MusicalNoteIcon className='w-8 ml-1' />}
                    key={i}
                  />
                )

              case 'Audiobooks':
                return (
                  <StatListItem
                    count={contentType.parent_count}
                    name='Audiobooks'
                    icon={<BookOpenIcon className='w-8 ml-1' />}
                    key={i}
                  />
                )
            }
          })}
        </ul>
      </CardContentText>
    </CardContent>
  )
}

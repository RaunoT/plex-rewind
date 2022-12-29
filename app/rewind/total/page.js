import {
  ChartPieIcon,
  ClockIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardText, { CardTextSkeleton } from '../../../ui/CardText'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { bytesToSize, secondsToTime } from '../../../utils/formatting'

async function getUserTotalDuration() {
  const musicTotalDuration = fetchFromTautulli('get_library_user_stats', {
    section_id: 1,
  })
  const showsTotalDuration = fetchFromTautulli('get_library_user_stats', {
    section_id: 2,
  })
  const moviesTotalDuration = fetchFromTautulli('get_library_user_stats', {
    section_id: 3,
  })
  const audiobooksTotalDuration = fetchFromTautulli('get_library_user_stats', {
    section_id: 4,
  })

  let [
    musicTotalDurationData,
    showsTotalDurationData,
    moviesTotalDurationData,
    audiobooksTotalDurationData,
  ] = await Promise.all([
    musicTotalDuration,
    showsTotalDuration,
    moviesTotalDuration,
    audiobooksTotalDuration,
  ])

  //Filter data
  const musicTotal = musicTotalDurationData.response?.data.filter(
    (user) => user.user_id === 8898770,
  )[0].total_time
  const showsTotal = showsTotalDurationData.response?.data.filter(
    (user) => user.user_id === 8898770,
  )[0].total_time
  const moviesTotal = moviesTotalDurationData.response?.data.filter(
    (user) => user.user_id === 8898770,
  )[0].total_time
  const audiobooksTotal = audiobooksTotalDurationData.response?.data.filter(
    (user) => user.user_id === 8898770,
  )[0].total_time

  return musicTotal + showsTotal + moviesTotal + audiobooksTotal
}

async function getLibraryTotalSize() {
  const musicTotalSize = fetchFromTautulli('get_library_media_info', {
    section_id: 1,
    length: 0,
  })
  const showsTotalSize = fetchFromTautulli('get_library_media_info', {
    section_id: 2,
    length: 0,
  })
  const moviesTotalSize = fetchFromTautulli('get_library_media_info', {
    section_id: 3,
    length: 0,
  })
  const audiobooksTotalSize = fetchFromTautulli('get_library_media_info', {
    section_id: 4,
    length: 0,
  })

  const [
    musicTotalSizeData,
    showsTotalSizeData,
    moviesTotalSizeData,
    audiobooksTotalSizeData,
  ] = await Promise.all([
    musicTotalSize,
    showsTotalSize,
    moviesTotalSize,
    audiobooksTotalSize,
  ])

  return bytesToSize(
    musicTotalSizeData.response.data.total_file_size +
      showsTotalSizeData.response.data.total_file_size +
      moviesTotalSizeData.response.data.total_file_size +
      audiobooksTotalSizeData.response.data.total_file_size,
  )
}

async function getLibraryTotalDuration() {
  const librariesTable = await fetchFromTautulli('get_libraries_table')
  let totalDuration = 0

  librariesTable.response?.data?.data?.forEach((library) => {
    totalDuration += library.duration
  })

  return totalDuration
}

export default async function Total() {
  return (
    <CardContent
      statCategory="General stats"
      page="1 / 4"
      nextCard="/rewind/shows"
      subtitle="Rauno T"
      rewind
    >
      <Suspense fallback={<CardTextSkeleton />}>
        <Stats
          promises={[
            getUserTotalDuration(),
            getLibraryTotalSize(),
            getLibraryTotalDuration(),
          ]}
        />
      </Suspense>
    </CardContent>
  )
}

async function Stats({ promises }) {
  const [userTotalDuration, libraryTotalSize, libraryTotalDuration] =
    await Promise.all(promises)

  return (
    <>
      <CardText hideAfter={10}>
        You&apos;ve spent a{' '}
        <span className="inline-flex items-center text-teal-300">
          Total
          <ClockIcon className="w-8 ml-1" />
        </span>{' '}
        of{' '}
        <span className="rewind-stat">{secondsToTime(userTotalDuration)}</span>{' '}
        on <span className="text-yellow-500">Plex</span> this year!
      </CardText>

      <CardText renderDelay={5}>
        That&apos;s{' '}
        <span className="inline-flex items-center text-teal-300">
          {Math.round((userTotalDuration * 100) / libraryTotalDuration)}
          %
          <ChartPieIcon className="w-8 ml-1" />
        </span>{' '}
        of all plays.
      </CardText>

      <CardText renderDelay={10} loaderDelay={5} noScale>
        Did you know the{' '}
        <span className="inline-flex items-center text-teal-300">
          Filesize
          <FolderIcon className="w-8 ml-1" />
        </span>{' '}
        of all the available content on{' '}
        <span className="text-yellow-500">Plex</span> is{' '}
        <span className="rewind-stat">{libraryTotalSize}</span>
      </CardText>
    </>
  )
}

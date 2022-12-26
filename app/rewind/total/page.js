import { ClockIcon, FolderIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardText from '../../../ui/CardText'
import CardTextFallback from '../../../ui/CardTextFallback'
import Delayed from '../../../ui/Delayed'
import { FIRST_OF_CURRENT_YEAR } from '../../../utils/constants'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    user_id: 8898770,
    length: 0,
    after: FIRST_OF_CURRENT_YEAR,
  })

  return totalDuration
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

  const [musicTotalSizeData, showsTotalSizeData, moviesTotalSizeData] =
    await Promise.all([musicTotalSize, showsTotalSize, moviesTotalSize])

  return (
    musicTotalSizeData.response.data.total_file_size +
    showsTotalSizeData.response.data.total_file_size +
    moviesTotalSizeData.response.data.total_file_size
  )
}

export default async function Total() {
  return (
    <CardContent
      statTitle="Watch time"
      statCategory="Total"
      page="1 / 4"
      nextCard="/rewind/shows"
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 sm:pb-12">
        <Suspense fallback={<CardTextFallback />}>
          <Stats promises={[getTotalDuration(), getLibraryTotalSize()]} />
        </Suspense>
      </div>
    </CardContent>
  )
}

async function Stats({ promises }) {
  const [totalDuration, getLibraryTotalSize] = await Promise.all(promises)

  return (
    <>
      <CardText className="mb-6">
        You&apos;ve spent a{' '}
        <span className="inline-flex items-center text-teal-300">
          Total
          <ClockIcon className="w-8 ml-1" />
        </span>{' '}
        of{' '}
        <span className="inline-block text-3xl font-semibold text-black">
          {removeAfterMinutes(totalDuration.response?.data?.total_duration)}
        </span>{' '}
        on <span className="text-yellow-500">Plex</span> this year!
      </CardText>

      <Delayed delay={2500}>
        <CardText>
          Did you know the{' '}
          <span className="inline-flex items-center text-teal-300">
            Filesize
            <FolderIcon className="w-8 ml-1" />
          </span>{' '}
          of all the available content is{' '}
          <span className="inline-block text-3xl font-semibold text-black">
            {bytesToSize(getLibraryTotalSize)}
          </span>
        </CardText>
      </Delayed>
    </>
  )
}

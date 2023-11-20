import Card from '@/components/Card/Card'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli, {
  TautulliItemRows,
  getServerId,
} from '@/utils/fetchTautulli'
import { bytesToSize, secondsToTime, timeToSeconds } from '@/utils/formatting'
import getMediaAdditionalData from '@/utils/getMediaAdditionalData'
import { FilterQueryParams } from '@/utils/types'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Movies | Plex rewind dashboard',
  description: metaDescription,
}

async function getMovies(period: number) {
  const moviesRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
    section_id: 3,
  })
  const movies = await getMediaAdditionalData(
    moviesRes.response?.data?.rows,
    'movie',
  )

  return movies
}

async function getTotalDuration(period: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      section_id: 3,
      after: period,
      length: 0,
    },
  )

  return secondsToTime(
    timeToSeconds(totalDuration.response?.data?.total_duration),
  )
}

async function getTotalSize() {
  const totalSize = await fetchTautulli<{ total_file_size: number }>(
    'get_library_media_info',
    {
      section_id: 3,
      length: 0,
    },
  )

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Movies({
  searchParams,
}: {
  searchParams: FilterQueryParams
}) {
  const periodKey =
    searchParams.period && ALLOWED_PERIODS[searchParams.period]
      ? searchParams.period
      : '30days'
  const period = ALLOWED_PERIODS[periodKey]

  const [movies, totalDuration, totalSize, serverId] = await Promise.all([
    getMovies(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
    getServerId(),
  ])

  return (
    <Card
      title='Movies'
      items={movies}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard='/dashboard/shows'
      nextCard='/dashboard/music'
      page='2 / 4'
      type='movies'
      serverId={serverId}
    />
  )
}

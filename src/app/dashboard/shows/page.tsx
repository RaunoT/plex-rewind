import Card from '@/components/Card'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli, { getServerId } from '@/utils/fetchTautulli'
import fetchTmdb from '@/utils/fetchTmdb'
import { bytesToSize, secondsToTime, timeToSeconds } from '@/utils/formatting'

export const metadata = {
  title: 'Shows | Plex rewind dashboard',
  description: metaDescription,
}

async function getShows(period: number) {
  const showsData = await fetchTautulli<MediaItemRows>('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const shows = showsData.response?.data?.rows
  const usersWatched = await fetchTautulli<MediaItemRows>('get_home_stats', {
    stat_id: 'popular_tv',
    stats_count: 25, // https://github.com/Tautulli/Tautulli/issues/2103
    time_range: period,
  })
  const usersWatchedData = usersWatched.response?.data?.rows
  const ratingKeys: number[] = []

  shows.map((show) => {
    ratingKeys.push(show.rating_key)
  })

  const additionalData = await Promise.all(
    ratingKeys.map(async (key, i) => {
      const showTautulli = await fetchTautulli<MediaItem>(
        'get_metadata',
        {
          rating_key: key,
        },
        true,
      )
      const showTautulliData = showTautulli.response?.data
      // Tautulli doesn't return year or rating for removed items, so we're using TMDB
      const showTmdb = await fetchTmdb('search/tv', {
        query: shows[i].title,
        first_air_date_year: showTautulliData.year,
      })
      const tmdbId = showTmdb.results[0].id
      const imdbId = await fetchTmdb(`tv/${tmdbId}/external_ids`)

      return {
        year: new Date(showTmdb.results[0].first_air_date).getFullYear(),
        is_deleted: Object.keys(showTautulliData).length === 0,
        rating: parseFloat(showTmdb.results[0].vote_average).toFixed(1),
        tmdb_id: tmdbId,
        imdb_id: imdbId.imdb_id,
      }
    }),
  )

  shows.map((show, i) => {
    const watchedData = usersWatchedData.find(
      (uw) => uw.rating_key === show.rating_key,
    )

    show.year = additionalData[i].year
    show.is_deleted = additionalData[i].is_deleted
    show.rating = additionalData[i].rating
    show.tmdb_id = additionalData[i].tmdb_id
    show.imdb_id = additionalData[i].imdb_id
    show.users_watched = watchedData?.users_watched
  })

  return shows
}

async function getTotalDuration(period: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      section_id: 2,
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
      section_id: 2,
      length: 0,
    },
  )

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Shows({
  searchParams,
}: {
  searchParams: PeriodSearchParams
}) {
  const periodKey =
    searchParams.period && ALLOWED_PERIODS[searchParams.period]
      ? searchParams.period
      : '30days'
  const period = ALLOWED_PERIODS[periodKey]

  const [shows, totalDuration, totalSize, serverId] = await Promise.all([
    getShows(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
    getServerId(),
  ])

  return (
    <Card
      title='TV shows'
      items={shows}
      totalDuration={totalDuration}
      totalSize={totalSize}
      nextCard='/dashboard/movies'
      page='1 / 4'
      type='shows'
      serverId={serverId}
    />
  )
}

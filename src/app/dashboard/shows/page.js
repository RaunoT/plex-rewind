import CardContent from '@/components/CardContent'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli, { getServerId } from '@/utils/fetchTautulli'
import fetchTmdb from '@/utils/fetchTmdb'
import { bytesToSize, removeAfterMinutes } from '@/utils/formatting'

export const metadata = {
  title: 'Shows | Plex rewind dashboard',
  description: metaDescription,
}

async function getShows(period) {
  const showsData = await fetchTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const shows = showsData.response?.data?.rows
  const usersWatched = await fetchTautulli('get_home_stats', {
    stat_id: 'popular_tv',
    // https://github.com/Tautulli/Tautulli/issues/2103
    stats_count: 25,
    time_range: period,
  })
  const usersWatchedData = usersWatched.response?.data?.rows
  let ratingKeys = []

  shows.map((show) => {
    ratingKeys.push(show.rating_key)
  })

  const additionalData = await Promise.all(
    ratingKeys.map(async (key, i) => {
      const showTautulli = await fetchTautulli(
        'get_metadata',
        {
          rating_key: key,
        },
        true
      )
      const showTautulliData = showTautulli.response?.data
      // Tautulli doesn't return year or rating for removed items, so we're using TMDB
      const showTmdb = await fetchTmdb('search/tv', {
        query: shows[i].title,
        first_air_date_year: showTautulliData.year,
      })
      const imdbId = await fetchTmdb(
        `tv/${showTmdb.results[0].id}/external_ids`
      )

      return {
        year: new Date(showTmdb.results[0].first_air_date).getFullYear(),
        isDeleted: Object.keys(showTautulliData).length === 0,
        rating: parseFloat(showTmdb.results[0].vote_average).toFixed(1),
        imdbId: imdbId.imdb_id,
      }
    })
  )

  shows.map((show, i) => {
    const watchedData = usersWatchedData.find(
      (uw) => uw.rating_key === show.rating_key
    )

    show.year = additionalData[i].year
    show.isDeleted = additionalData[i].isDeleted
    show.rating = additionalData[i].rating
    show.imdbId = additionalData[i].imdbId
    show.usersWatched = watchedData?.users_watched
  })

  return shows
}

async function getTotalDuration(period) {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 2,
    after: period,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTotalSize() {
  const totalSize = await fetchTautulli('get_library_media_info', {
    section_id: 2,
    length: 0,
  })

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Shows({ searchParams }) {
  let period = ALLOWED_PERIODS['30days']
  if (ALLOWED_PERIODS[searchParams.period]) {
    period = ALLOWED_PERIODS[searchParams.period]
  }

  const [shows, totalDuration, totalSize, serverId] = await Promise.all([
    getShows(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
    getServerId(),
  ])

  return (
    <CardContent
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

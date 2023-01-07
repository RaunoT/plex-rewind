import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30_STRING } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import fetchTmdb from '../../../utils/fetchTmdb'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getShows() {
  const shows = await fetchTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 6,
    stats_type: 'duration',
    time_range: 30,
  })

  return shows.response?.data?.rows
}

async function getTotalDuration() {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 2,
    after: DAYS_AGO_30_STRING,
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

async function getRatings() {
  const shows = await getShows()

  const ratings = Promise.all(
    shows.map(async (show) => {
      const showData = await fetchTmdb('search/tv', {
        query: show.title,
        first_air_date_year: show.year,
      })

      return {
        title: show.title,
        rating: showData.results[0]?.vote_average,
      }
    }),
  )

  return ratings
}

export default async function Shows() {
  const [shows, totalDuration, totalSize, ratings] = await Promise.all([
    getShows(),
    getTotalDuration(),
    getTotalSize(),
    getRatings(),
  ])

  return (
    <CardContent
      title="TV shows"
      items={shows}
      totalDuration={totalDuration}
      totalSize={totalSize}
      nextCard="dashboard/movies"
      page="1 / 4"
      type="shows"
      ratings={ratings}
    />
  )
}

import CardContent from '../../../ui/CardContent'
import { ALLOWED_PERIODS, IGNORED_FOR_RATINGS } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import fetchTmdb from '../../../utils/fetchTmdb'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getShows(period) {
  const showsData = await fetchTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const shows = showsData.response?.data?.rows

  let ratingKeys = []
  shows.map((show) => {
    ratingKeys.push(show.rating_key)
  })
  const additionalData = await Promise.all(
    ratingKeys.map(async (key, i) => {
      let show = await fetchTautulli('get_metadata', {
        rating_key: key,
      })
      const data = show.response?.data
      let year = data.year
      let rating = data.audience_rating

      // WORKAROUND: Tautulli not properly returning year or rating
      if ((!year || !rating) && !IGNORED_FOR_RATINGS.includes(shows[i].title)) {
        show = await fetchTmdb('search/tv', {
          query: shows[i].title,
          first_air_date_year: year,
        })
        year = new Date(show.results[0].first_air_date).getFullYear()
        rating = show.results[0].vote_average
      }

      return {
        year: year,
        isDeleted: Object.keys(data).length === 0,
        rating: rating,
      }
    })
  )

  shows.map((show, i) => {
    show.year = additionalData[i].year
    show.isDeleted = additionalData[i].isDeleted
    show.rating = additionalData[i].rating
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

  const [shows, totalDuration, totalSize] = await Promise.all([
    getShows(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
  ])

  return (
    <CardContent
      title='TV shows'
      items={shows}
      totalDuration={totalDuration}
      totalSize={totalSize}
      nextCard='dashboard/movies'
      page='1 / 4'
      type='shows'
    />
  )
}

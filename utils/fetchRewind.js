import fetchFromTautulli from './fetchFromTautulli'
import secondsToTime from './secondsToTime'

async function fetchRewind(userId) {
  const totalStats = await fetchFromTautulli('get_user_watch_time_stats', {
    user_id: 8898770,
    query_days: 0,
  })
  const musicStats = await fetchFromTautulli('get_library_user_stats', {
    section_id: 1,
  })
  const musicStatsFiltered = musicStats.response.data.filter(
    (stat) => stat.user_id === userId,
  )
  const tvStats = await fetchFromTautulli('get_library_user_stats', {
    section_id: 2,
  })
  const tvStatsFiltered = tvStats.response.data.filter(
    (stat) => stat.user_id === userId,
  )
  const movieStats = await fetchFromTautulli('get_library_user_stats', {
    section_id: 3,
  })
  const movieStatsFiltered = movieStats.response.data.filter(
    (stat) => stat.user_id === userId,
  )

  const rewind = {
    period: 'lifetime',
    user: userId,
    totals: { duration: secondsToTime(totalStats.response.data[0].total_time) },
    tv: { duration: secondsToTime(tvStatsFiltered[0].total_time) },
    movies: { duration: secondsToTime(movieStatsFiltered[0].total_time) },
    music: { duration: secondsToTime(musicStatsFiltered[0].total_time) },
  }

  return rewind
}

export default fetchRewind

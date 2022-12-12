import fetchFromTautulli from './fetchFromTautulli'
import { FIRST_OF_CURRENT_YEAR, removeAfterMinutes } from './time'

async function fetchRewind(userId) {
  const totalStats = await fetchFromTautulli('get_history', {
    user_id: userId,
    length: 0,
    after: FIRST_OF_CURRENT_YEAR,
  })
  const tvStats = await fetchFromTautulli('get_history', {
    user_id: userId,
    section_id: 2,
    after: FIRST_OF_CURRENT_YEAR,
  })
  const movieStats = await fetchFromTautulli('get_history', {
    user_id: userId,
    section_id: 3,
    after: FIRST_OF_CURRENT_YEAR,
  })
  const musicStats = await fetchFromTautulli('get_history', {
    user_id: userId,
    section_id: 1,
    after: FIRST_OF_CURRENT_YEAR,
  })

  const rewind = {
    period: 'lifetime',
    user: userId,
    totals: {
      duration: removeAfterMinutes(totalStats.response.data.total_duration),
    },
    tv: {
      duration: removeAfterMinutes(tvStats.response.data.total_duration),
    },
    movies: {
      duration: removeAfterMinutes(movieStats.response.data.total_duration),
    },
    music: {
      duration: removeAfterMinutes(musicStats.response.data.total_duration),
    },
  }

  return rewind
}

export default fetchRewind

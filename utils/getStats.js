import secondsToTime from './secondsToTime'

function getStats(obj, stat, durationStat) {
  const items = obj.filter((row) => row.stat_id === stat)[0].rows
  const duration = durationStat
    ? secondsToTime(
        obj
          .filter((row) => row.stat_id === 'top_libraries')[0]
          .rows.filter((row) => row.section_type === durationStat)[0]
          .total_duration,
      )
    : ''
  const ratings = obj.filter((row) => row.stat_id === 'ratings')[0].ratings[
    stat
  ]

  const statsObj = {
    items,
    duration,
    ratings,
  }

  return statsObj
}

export default getStats

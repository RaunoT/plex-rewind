function secondsToTime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds - days * 86400) / 3600)
  const minutes = Math.floor((seconds - days * 86400 - hours * 3600) / 60)

  return (
    (days > 0 ? days + (days === 1 ? ' day ' : ' days ') : '') +
    (hours > 0 ? hours + (hours === 1 ? ' hr ' : ' hrs ') : '') +
    (minutes > 0 ? minutes + (minutes === 1 ? ' min' : ' mins') : '')
  )
}

function removeAfterMinutes(timeString) {
  return timeString.replace(/mins.*/, 'mins')
}

const DAYS_AGO_30 = new Date(new Date().setDate(new Date().getDate() - 30))
  .toISOString()
  .split('T')[0]

const FIRST_OF_CURRENT_YEAR = new Date(new Date().getFullYear(), 0, 1)
  .toISOString()
  .split('T')[0]

export { secondsToTime, removeAfterMinutes, DAYS_AGO_30, FIRST_OF_CURRENT_YEAR }

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

export default secondsToTime

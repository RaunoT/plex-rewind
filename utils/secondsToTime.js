function secondsToTime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds - days * 86400) / 3600)
  const minutes = Math.floor((seconds - days * 86400 - hours * 3600) / 60)

  return (
    (days > 0 ? days + ' days ' : '') +
    (hours > 0 ? hours + ' hrs ' : '') +
    minutes +
    ' mins'
  )
}

export default secondsToTime

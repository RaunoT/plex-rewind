function secondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)

  return (hours > 0 ? hours + ' HRS ' : '') + minutes + ' MINS'
}

export default secondsToTime

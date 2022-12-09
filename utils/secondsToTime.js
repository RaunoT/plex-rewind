function secondsToTime(seconds) {
  const secNum = parseInt(seconds, 10)
  const hours = Math.floor(secNum / 3600)
  const minutes = Math.floor((secNum - hours * 3600) / 60)

  return (hours > 0 ? hours + 'h' : '') + minutes + 'min'
}

export default secondsToTime

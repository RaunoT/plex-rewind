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

function bytesToSize(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export { secondsToTime, removeAfterMinutes, bytesToSize }

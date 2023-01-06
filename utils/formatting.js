export function secondsToTime(seconds) {
  const months = Math.floor(seconds / 2629746)
  const weeks = Math.floor((seconds - months * 2629746) / 604800)
  const days = Math.floor((seconds - months * 2629746 - weeks * 604800) / 86400)
  const hours = Math.floor(
    (seconds - months * 2629746 - weeks * 604800 - days * 86400) / 3600,
  )
  const minutes = Math.floor(
    (seconds -
      months * 2629746 -
      weeks * 604800 -
      days * 86400 -
      hours * 3600) /
      60,
  )

  return (
    (months > 0 ? months + (months === 1 ? ' month ' : ' months ') : '') +
    (weeks > 0 ? weeks + (weeks === 1 ? ' week ' : ' weeks ') : '') +
    (days > 0 ? days + (days === 1 ? ' day ' : ' days ') : '') +
    (hours > 0 && months === 0
      ? hours + (hours === 1 ? ' hr ' : ' hrs ')
      : '') +
    (minutes > 0 && months === 0 && weeks === 0
      ? minutes + (minutes === 1 ? ' min' : ' mins')
      : '')
  )
}

export function removeAfterMinutes(timeString) {
  return timeString.replace(/mins.*/, 'mins')
}

export function bytesToSize(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function timeToSeconds(time) {
  const days = time.match(/([\d.]+) *day/)
    ? time.match(/([\d.]+) *day/)[1] * 86400
    : 0
  const hours = time.match(/([\d.]+) *hr/)
    ? time.match(/([\d.]+) *hr/)[1] * 3600
    : 0
  const mins = time.match(/([\d.]+) *min/)
    ? time.match(/([\d.]+) *min/)[1] * 60
    : 0
  const secs = time.match(/([\d.]+) *sec/) ? time.match(/([\d.]+) *sec/)[1] : 0

  return parseInt(days) + parseInt(hours) + parseInt(mins) + parseInt(secs)
}

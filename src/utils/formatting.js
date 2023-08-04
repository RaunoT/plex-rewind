export function secondsToTime(seconds) {
  const units = [
    { label: 'month', duration: 2629746 },
    { label: 'week', duration: 604800 },
    { label: 'day', duration: 86400 },
    { label: 'hr', duration: 3600 },
    { label: 'min', duration: 60 },
  ]
  let remainingSeconds = seconds
  let unitCount = 0

  return units
    .map(({ label, duration }) => {
      if (unitCount >= 2) {
        return ''
      }

      const value = Math.floor(remainingSeconds / duration)
      remainingSeconds %= duration

      if (value > 0) {
        unitCount++
      }

      return value > 0 ? `${value} ${value === 1 ? label : label + 's'} ` : ''
    })
    .join('')
    .trim()
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

export function pluralize(value, string) {
  if (value > 1 || value === 0) {
    return `${value} ${string}s`
  } else {
    return `${value} ${string}`
  }
}

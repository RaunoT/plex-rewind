export function secondsToTime(seconds: number): string {
  const units = [
    { label: 'month', duration: 2629746 },
    { label: 'week', duration: 604800 },
    { label: 'day', duration: 86400 },
    { label: 'hr', duration: 3600 },
    { label: 'min', duration: 60 },
    { label: 'sec', duration: 1 },
  ]

  let remainingSeconds = Math.round(seconds)
  let result = ''
  let unitCount = 0

  for (const { label, duration } of units) {
    if (unitCount >= 2) {
      break
    }

    const value = Math.floor(remainingSeconds / duration)

    remainingSeconds %= duration

    if (value > 0 || (unitCount === 0 && remainingSeconds === 0)) {
      result += `${value} ${value === 1 ? label : label + 's'} `
      unitCount++
    }
  }

  return result.trim()
}

export function secondsToMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60)

  return `${minutes.toLocaleString('en-US')} minute${minutes !== 1 && 's'}`
}

export function removeAfterMinutes(timeString: string): string {
  return timeString.replace(/mins.*/, 'mins')
}

export function bytesToSize(bytes: number, decimals = 2): string | undefined {
  if (!+bytes) return

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function timeToSeconds(time: string): number {
  const dayMatch = time.match(/([\d.]+) *day/)
  const hourMatch = time.match(/([\d.]+) *hr/)
  const minMatch = time.match(/([\d.]+) *min/)
  const secMatch = time.match(/([\d.]+) *sec/)

  const days = dayMatch ? parseFloat(dayMatch[1]) * 86400 : 0
  const hours = hourMatch ? parseFloat(hourMatch[1]) * 3600 : 0
  const mins = minMatch ? parseFloat(minMatch[1]) * 60 : 0
  const secs = secMatch ? parseFloat(secMatch[1]) : 0

  return days + hours + mins + secs
}

export function pluralize(value: number, string: string): string {
  if (value > 1 || value === 0) {
    return `${value} ${string}s`
  } else {
    return `${value} ${string}`
  }
}

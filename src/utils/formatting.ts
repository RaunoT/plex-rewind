// This type is compatible with next-intl's translation function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslateFunction = (key: string, params?: any) => string

export function secondsToTime(seconds: number, t: TranslateFunction): string {
  if (seconds <= 0) {
    return t('Common.time.zero')
  }

  const units = [
    { label: 'month', duration: 2629746 },
    { label: 'week', duration: 604800 },
    { label: 'day', duration: 86400 },
    { label: 'hr', duration: 3600 },
    { label: 'min', duration: 60 },
    { label: 'sec', duration: 1 },
  ]
  const maxUnits = 2
  const result = []

  let remainingSeconds = Math.round(seconds)
  let unitCount = 0

  for (const { label, duration } of units) {
    if (unitCount >= maxUnits) {
      break
    }

    let value = Math.floor(remainingSeconds / duration)

    // Handle rounding for minutes if seconds are present
    if (label === 'min' && remainingSeconds % duration >= 30) {
      value++ // Round up to the next minute if 30 or more seconds remain
      remainingSeconds = 0 // Reset remaining seconds after rounding up
    } else {
      remainingSeconds %= duration
    }

    if (value > 0 || (unitCount === 0 && remainingSeconds === 0)) {
      // Special case for seconds: only include if it's the only unit
      if (label === 'sec' && unitCount > 0) {
        break
      }

      result.push(t(`Common.time.${label}`, { count: value }))
      unitCount++
    }
  }

  return result.join(' ')
}

export function removeAfterMinutes(timeString: string): string {
  return timeString.replace(/mins.*/, 'mins')
}

export function bytesToSize(
  bytes: number,
  decimals = 2,
  t: TranslateFunction,
): string | undefined {
  if (!+bytes) return

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return t('Common.fileSize', {
    value,
    unit: sizes[i],
  })
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

export function formatBitrate(bitrate: number | string): string {
  const numeric = typeof bitrate === 'string' ? parseFloat(bitrate) : bitrate
  const megabits = numeric / 1000

  return `${megabits.toFixed(1)} Mbps`
}

export function millisecondsToTimeString(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function calculateETA(
  durationMs?: string,
  viewOffsetMs?: string,
): string | null {
  if (!durationMs || !viewOffsetMs) return null

  const duration = parseInt(durationMs)
  const viewOffset = parseInt(viewOffsetMs)

  if (isNaN(duration) || isNaN(viewOffset) || duration <= 0) return null

  const remainingMs = duration - viewOffset

  if (remainingMs <= 0) return null

  const now = new Date()
  const eta = new Date(now.getTime() + remainingMs)
  // Format as HH:MM
  const hours = eta.getHours().toString().padStart(2, '0')
  const minutes = eta.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
}

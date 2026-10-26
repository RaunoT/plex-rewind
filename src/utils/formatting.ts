// This type is compatible with next-intl's translation function
export type TranslateFunction = (key: string, params?: any) => string

export function secondsToTime(seconds: number, t: TranslateFunction): string {
  const totalSeconds = Math.round(seconds)

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
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

  let remainingSeconds = totalSeconds
  let unitCount = 0

  for (const { label, duration } of units) {
    if (unitCount >= maxUnits) {
      break
    }

    // Rounding to whole minutes before the split keeps 59 min 30 sec from
    // becoming "60 mins". It happens after the months, which aren't a whole
    // number of minutes.
    if (label === 'week' && totalSeconds >= 60) {
      remainingSeconds = Math.round(remainingSeconds / 60) * 60
    }

    const value = Math.floor(remainingSeconds / duration)

    remainingSeconds %= duration

    if (value > 0) {
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

function formatOneDecimal(value: number, locale: string): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

export function formatBitrate(
  bitrate: number | string,
  locale: string,
): string {
  if (!bitrate || bitrate === '') {
    return 'N/A'
  }

  const numeric = typeof bitrate === 'string' ? parseFloat(bitrate) : bitrate

  if (isNaN(numeric) || numeric <= 0) {
    return 'N/A'
  }

  const megabits = numeric / 1000

  return `${formatOneDecimal(megabits, locale)} Mbps`
}

export function formatRating(rating: string, locale: string): string {
  const numeric = Number(rating)

  return rating.trim() === '' || !Number.isFinite(numeric)
    ? rating
    : formatOneDecimal(numeric, locale)
}

export function formatPercent(percent: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent' }).format(
    percent / 100,
  )
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

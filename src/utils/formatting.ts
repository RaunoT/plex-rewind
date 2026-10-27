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

// Empty without a bitrate, so callers can fall back to another value or a dash
export function formatBitrate(
  bitrate: number | string,
  locale: string,
): string {
  if (!bitrate) {
    return ''
  }

  const numeric = typeof bitrate === 'string' ? parseFloat(bitrate) : bitrate

  if (isNaN(numeric) || numeric <= 0) {
    return ''
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
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const paddedSeconds = seconds.toString().padStart(2, '0')

  return hours
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`
}

// In the time zone of whoever runs it, so it belongs in the browser
export function calculateETA(
  durationMs: string | undefined,
  viewOffsetMs: string | undefined,
  locale: string,
): string | null {
  if (!durationMs || !viewOffsetMs) return null

  const duration = parseInt(durationMs)
  const viewOffset = parseInt(viewOffsetMs)

  if (isNaN(duration) || isNaN(viewOffset) || duration <= 0) return null

  const remainingMs = duration - viewOffset

  if (remainingMs <= 0) return null

  const eta = new Date(Date.now() + remainingMs)

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(eta)
}

// The app and the device it plays on, such as "Plex Web (Chrome)"
export function formatDevice(product: string, player: string): string {
  return product && player ? `${product} (${player})` : product || player
}

const CODEC_NAMES: Record<
  'video' | 'audio' | 'subtitle',
  Record<string, string>
> = {
  video: {
    h264: 'H.264',
    avc: 'H.264',
    hevc: 'HEVC',
    h265: 'HEVC',
    av1: 'AV1',
    vp9: 'VP9',
    vp8: 'VP8',
    mpeg4: 'MPEG-4',
    mpeg2video: 'MPEG-2',
    vc1: 'VC-1',
  },
  audio: {
    aac: 'AAC',
    ac3: 'Dolby Digital',
    eac3: 'Dolby Digital+',
    truehd: 'Dolby TrueHD',
    dca: 'DTS',
    dts: 'DTS',
    'dca-ma': 'DTS-HD MA',
    flac: 'FLAC',
    alac: 'ALAC',
    mp3: 'MP3',
    opus: 'Opus',
    vorbis: 'Vorbis',
    pcm: 'PCM',
  },
  subtitle: {
    srt: 'SRT',
    subrip: 'SRT',
    ass: 'ASS',
    ssa: 'SSA',
    pgs: 'PGS',
    vobsub: 'VobSub',
    dvd_subtitle: 'VobSub',
    mov_text: 'MOV text',
    webvtt: 'WebVTT',
    vtt: 'WebVTT',
  },
}

// Plex reports codecs by their internal names, such as "dca" for DTS
export function formatCodec(
  codec: string | undefined,
  type: 'video' | 'audio' | 'subtitle',
): string {
  if (!codec) {
    return ''
  }

  return CODEC_NAMES[type][codec.toLowerCase()] ?? codec.toUpperCase()
}

// "stereo" and "5.1(side)" read as "Stereo" and "5.1"
export function formatChannels(layout?: string): string {
  const name = (layout ?? '').replace(/\(.*\)$/, '').trim()

  return name ? name.charAt(0).toUpperCase() + name.slice(1) : ''
}

export function formatResolution(resolution?: string): string {
  const value = (resolution ?? '').trim().toLowerCase()

  if (!value) {
    return ''
  }

  if (value === '4k' || value === '2160p' || value === '2160') {
    return '4K'
  }

  if (value === 'sd') {
    return 'SD'
  }

  return /^\d+$/.test(value) ? `${value}p` : value
}

// SDR is the norm, so only HDR formats are worth naming
export function formatDynamicRange(range?: string): string {
  return !range || range.toUpperCase() === 'SDR' ? '' : range
}

// First letters of the first and last name, like a contact without a photo
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = Array.from(words[0] ?? '')[0] ?? ''
  const last = words.length > 1 ? (Array.from(words.at(-1)!)[0] ?? '') : ''

  return (first + last).toLocaleUpperCase()
}

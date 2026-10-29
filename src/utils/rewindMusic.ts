import { RewindMusic, Settings } from '@/types/settings'
import { randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { REWIND_MUSIC_MAX_BYTES, REWIND_MUSIC_TYPES } from './constants'

export const REWIND_MUSIC_PATH = path.join(process.cwd(), 'config/rewind-music')
export const REWIND_MUSIC_URL = '/api/rewind/music'

export type ByteRange = {
  start: number
  end: number
}

// Plex's own theme songs, by the show's TVDB ID. Not every show has one.
export function getThemeSongUrl(tvdbId: number | null | undefined) {
  return tvdbId ? `https://tvthemes.plexapp.com/${tvdbId}.mp3` : null
}

// Null when there's no track, or its file has gone missing
export function getMusicUrl({ rewind }: Settings): string | null {
  if (!rewind.music || !fs.existsSync(REWIND_MUSIC_PATH)) {
    return null
  }

  return `${REWIND_MUSIC_URL}?v=${rewind.music.updatedAt}`
}

// Null for a file that isn't one of the audio types browsers can play
export function getMusicType(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''

  return Object.hasOwn(REWIND_MUSIC_TYPES, extension)
    ? REWIND_MUSIC_TYPES[extension]
    : null
}

// Safari only plays audio from servers that answer range requests. Multiple
// ranges are served whole, which browsers don't ask for anyway.
export function parseRange(
  header: string | null,
  size: number,
): ByteRange | 'invalid' | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/)

  if (!match || (!match[1] && !match[2])) {
    return null
  }

  const [, from, to] = match
  // "bytes=-500" is the last 500 bytes
  const start = from ? Number(from) : Math.max(size - Number(to), 0)
  const end = from && to ? Math.min(Number(to), size - 1) : size - 1

  if (start >= size || start > end) {
    return 'invalid'
  }

  return { start, end }
}

class TooLargeError extends Error {}

function limitSize(maxBytes: number) {
  let size = 0

  return async function* (chunks: AsyncIterable<Uint8Array>) {
    for await (const chunk of chunks) {
      size += chunk.byteLength

      if (size > maxBytes) {
        throw new TooLargeError()
      }

      yield chunk
    }
  }
}

// Written to a temporary file first, so a failed upload keeps the old track.
// Returns null when the body is over the limit.
export async function saveMusic(
  body: ReadableStream<Uint8Array>,
  name: string,
  type: string,
): Promise<RewindMusic | null> {
  const tempPath = `${REWIND_MUSIC_PATH}.${randomBytes(6).toString('hex')}.tmp`

  try {
    await pipeline(
      Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]),
      limitSize(REWIND_MUSIC_MAX_BYTES),
      fs.createWriteStream(tempPath),
    )

    const { size } = fs.statSync(tempPath)

    fs.renameSync(tempPath, REWIND_MUSIC_PATH)

    return { name, type, size, updatedAt: Date.now() }
  } catch (error) {
    fs.rmSync(tempPath, { force: true })

    if (error instanceof TooLargeError) {
      return null
    }

    throw error
  }
}

export function removeMusic() {
  fs.rmSync(REWIND_MUSIC_PATH, { force: true })
}

import { canManageSettings } from '@/lib/access'
import { authOptions } from '@/lib/auth'
import { REWIND_MUSIC_MAX_BYTES } from '@/utils/constants'
import getSettings, { writeSettings } from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import {
  getMusicType,
  getMusicUrl,
  parseRange,
  removeMusic,
  REWIND_MUSIC_PATH,
  saveMusic,
} from '@/utils/rewindMusic'
import fs from 'fs'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'

// The track plays wherever Rewind can be seen
export async function GET(request: Request) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)
  const music = settings.rewind.music

  if (
    !canViewFeature(settings, 'rewind', getViewer(session)) ||
    !music ||
    !getMusicUrl(settings)
  ) {
    return new Response(null, { status: 404 })
  }

  const { size } = fs.statSync(REWIND_MUSIC_PATH)
  const range = parseRange(request.headers.get('range'), size)
  const headers = new Headers({
    'Content-Type': music.type,
    'Accept-Ranges': 'bytes',
    // The URL changes with each upload
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Content-Security-Policy': 'sandbox',
  })

  if (range === 'invalid') {
    headers.set('Content-Range', `bytes */${size}`)

    return new Response(null, { status: 416, headers })
  }

  const { start, end } = range ?? { start: 0, end: size - 1 }

  headers.set('Content-Length', String(end - start + 1))

  if (range) {
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  }

  const stream = fs.createReadStream(REWIND_MUSIC_PATH, { start, end })

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: range ? 206 : 200,
    headers,
  })
}

// The file is the body, its name in a header. PUT and DELETE can't be sent
// from another site without CORS allowing them.
export async function PUT(request: Request) {
  if (!(await canManageSettings())) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  const name = decodeURIComponent(request.headers.get('x-file-name') ?? '')
  const type = getMusicType(name)
  const length = Number(request.headers.get('content-length'))

  if (!type || !request.body || !length) {
    return Response.json({ error: 'type' }, { status: 415 })
  }

  if (length > REWIND_MUSIC_MAX_BYTES) {
    return Response.json({ error: 'size' }, { status: 413 })
  }

  try {
    const music = await saveMusic(request.body, name, type)

    if (!music) {
      return Response.json({ error: 'size' }, { status: 413 })
    }

    const settings = getSettings()

    settings.rewind.music = music
    writeSettings(settings)
    revalidatePath('/rewind')

    return Response.json({ music })
  } catch (error) {
    console.error('[REWIND] - Error saving the music!', error)

    return Response.json({ error: 'failed' }, { status: 500 })
  }
}

export async function DELETE() {
  if (!(await canManageSettings())) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const settings = getSettings()

    settings.rewind.music = null
    writeSettings(settings)
    removeMusic()
    revalidatePath('/rewind')

    return Response.json({ music: null })
  } catch (error) {
    console.error('[REWIND] - Error removing the music!', error)

    return Response.json({ error: 'failed' }, { status: 500 })
  }
}

import getSettings from '@/utils/getSettings'

export const dynamic = 'force-dynamic'

// Used by the container healthcheck: it calls no external service, and fails
// when the settings file can't be read.
export function GET() {
  try {
    getSettings()

    return Response.json({ status: 'ok' })
  } catch (error) {
    console.error('[HEALTH] - Unable to read settings!', error)

    return Response.json({ status: 'error' }, { status: 503 })
  }
}

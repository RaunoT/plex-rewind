import getSettings from '@/utils/getSettings'

export const dynamic = 'force-dynamic'

const SENSITIVE_SETTINGS = [
  'connection.tautulliUrl',
  'connection.tautulliApiKey',
  'connection.overseerrUrl',
  'connection.overseerrApiKey',
  'connection.plexUrl',
]

export async function GET() {
  const settings = getSettings()

  // Replace sensitive settings with boolean true if their value is not falsy
  SENSITIVE_SETTINGS.forEach((path) => {
    const keys = path.split('.')
    const lastKey = keys.pop()!

    // TODO: add proper type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = settings

    for (const key of keys) {
      current = current[key]
    }

    if (current[lastKey]) {
      current[lastKey] = true
    }
  })

  return Response.json(settings)
}

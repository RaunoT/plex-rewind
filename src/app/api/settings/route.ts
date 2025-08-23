import getSettings from '@/utils/getSettings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = getSettings()

  return Response.json(settings)
}

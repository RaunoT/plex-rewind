import getVersion from '@/utils/getVersion'

export const dynamic = 'force-dynamic'

export async function GET() {
  const version = await getVersion()

  return Response.json({
    version: version.currentVersion,
    channel: version.channel,
    updateAvailable: version.hasUpdate,
  })
}

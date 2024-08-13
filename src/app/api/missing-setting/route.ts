import getSettings from '@/utils/getSettings'
import { checkRequiredSettings } from '@/utils/helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = getSettings()
  const missingSetting = checkRequiredSettings(settings)

  return Response.json(missingSetting)
}

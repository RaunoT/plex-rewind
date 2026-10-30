import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { getMediaServer } from '@/utils/statsSource'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import getActivity from './_actions/getActivity'
import Activities from './_components/Activities'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Activity')
  const activityData = await getActivity()
  const streamCount = activityData?.stream_count || 0
  const title = streamCount > 0 ? `(${streamCount}) ${t('title')}` : t('title')

  return {
    title,
  }
}

export default async function ActivityPage() {
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'activity', getViewer(session))) {
    return notFound()
  }

  const mediaServer = await getMediaServer()

  return (
    <Activities
      settings={toPublicSettings(settings)}
      mediaServer={mediaServer}
    />
  )
}

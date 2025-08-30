import { getActivity } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ActivityContent from './_components/ActivityContent'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Activity')
  const activityData = await getActivity()
  const streamCount = activityData?.sessions?.length || 0
  const title = streamCount > 0 ? `(${streamCount}) ${t('title')}` : t('title')

  return {
    title,
  }
}

export default function ActivityPage() {
  const settings = getSettings()

  return <ActivityContent settings={settings} />
}

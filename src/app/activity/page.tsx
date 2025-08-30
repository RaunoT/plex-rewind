import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ActivityContent from './_components/ActivityContent'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Activity')

  return {
    title: t('title'),
  }
}

export default function ActivityPage() {
  const settings = getSettings()

  return <ActivityContent settings={settings} />
}

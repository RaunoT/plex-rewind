import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ActivitySettingsForm from './_components/ActivitySettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.Activity')

  return {
    title: t('title'),
  }
}

export default function ActivitySettingsPage() {
  const settings = getSettings()

  return <ActivitySettingsForm settings={settings} />
}
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import DashboardSettingsForm from './_components/DashboardSettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.Dashboard')

  return {
    title: t('title'),
  }
}

export default async function DashboardSettingsPage() {
  const settings = getSettings()

  return <DashboardSettingsForm settings={settings} />
}

import { requireSettingsAccess } from '@/lib/access'
import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
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
  await requireSettingsAccess()

  const settings = getSettings()

  return <DashboardSettingsForm settings={toPublicSettings(settings)} />
}

import { requireSettingsAccess } from '@/lib/access'
import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ActivitySettingsForm from './_components/ActivitySettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.Activity')

  return {
    title: t('title'),
  }
}

export default async function ActivitySettingsPage() {
  await requireSettingsAccess()

  const settings = getSettings()

  return <ActivitySettingsForm settings={toPublicSettings(settings)} />
}

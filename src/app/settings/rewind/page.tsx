import { requireSettingsAccess } from '@/lib/access'
import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import RewindSettingsForm from './_components/RewindSettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.Rewind')

  return {
    title: t('title'),
  }
}

export default async function RewindSettingsPage() {
  await requireSettingsAccess()

  const settings = getSettings()

  return <RewindSettingsForm settings={toPublicSettings(settings)} />
}

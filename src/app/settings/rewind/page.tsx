import getSettings from '@/utils/getSettings'
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
  const settings = getSettings()

  return <RewindSettingsForm settings={settings} />
}

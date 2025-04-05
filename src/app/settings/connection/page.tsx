import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.Connection')

  return {
    title: t('title'),
  }
}

export default function ConnectionSettingsPage() {
  const settings = getSettings()

  return <ConnectionSettingsForm settings={settings} />
}

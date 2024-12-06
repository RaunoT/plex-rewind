import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import GeneralSettingsForm from './_components/GeneralSettingsForm'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.General')

  return {
    title: t('title'),
  }
}

export default async function GeneralSettingsPage() {
  const libraries = await getLibraries(false)
  const settings = getSettings()

  return <GeneralSettingsForm settings={settings} libraries={libraries} />
}

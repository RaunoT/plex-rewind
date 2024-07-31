import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import GeneralSettingsForm from './_components/GeneralSettingsForm'

export const metadata: Metadata = {
  title: 'General settings',
}

export default async function GeneralSettingsPage() {
  const libraries = await getLibraries(false)
  const settings = getSettings()

  return <GeneralSettingsForm settings={settings} libraries={libraries} />
}

import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import FeaturesSettingsForm from './_components/FeaturesSettingsForm'

export const metadata: Metadata = {
  title: 'Features settings',
}

export default async function FeaturesSettingsPage() {
  const libraries = await getLibraries(false)
  const settings = await getSettings()

  return <FeaturesSettingsForm settings={settings} libraries={libraries} />
}

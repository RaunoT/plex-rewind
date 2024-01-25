import { settings } from '@/config/config'
import { getLibraries } from '@/utils/fetchTautulli'
import { Metadata } from 'next'
import FeaturesSettingsForm from './_components/FeaturesSettingsForm'

export const metadata: Metadata = {
  title: 'Features Settings',
}

export default async function FeaturesSettingsPage() {
  const libraries = await getLibraries(false)

  return (
    <FeaturesSettingsForm settings={settings.features} libraries={libraries} />
  )
}

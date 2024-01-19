import { settings } from '@/config/config'
import { getLibraries } from '@/utils/fetchTautulli'
import FeaturesSettingsForm from './_components/FeaturesSettingsForm'

export default async function FeaturesSettingsPage() {
  const libraries = await getLibraries(false)

  return (
    <FeaturesSettingsForm settings={settings.features} libraries={libraries} />
  )
}

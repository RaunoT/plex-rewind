import { getLibraries } from '@/utils/fetchTautulli'
import { getSettings } from '@/utils/settings'
import FeaturesSettingsForm from './_components/FeaturesSettingsForm'

export default async function FeaturesSettingsPage() {
  const settings = await getSettings()
  const libraries = await getLibraries(false)

  return (
    <FeaturesSettingsForm settings={settings?.features} libraries={libraries} />
  )
}

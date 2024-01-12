import { getSettings } from '@/actions/get-settings'
import FeaturesSettingsForm from './_components/FeaturesSettingsForm'

export default async function FeaturesSettingsPage() {
  const formData = await getSettings()

  return <FeaturesSettingsForm formInitialState={formData} />
}

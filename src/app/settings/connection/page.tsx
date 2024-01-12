import { getSettings } from '@/utils/settings'
import ConnectionSettingsForm from './_components/ConnectionSettingsForm'

export default async function Page() {
  const formData = await getSettings()

  return <ConnectionSettingsForm formInitialState={formData} />
}

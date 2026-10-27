import { requireSettingsAccess } from '@/lib/access'
import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
import { getLibraries, getUsers } from '@/utils/statsSource'
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
  await requireSettingsAccess()

  const [libraries, users] = await Promise.all([
    getLibraries(false),
    getUsers(),
  ])
  const settings = getSettings()

  return (
    <GeneralSettingsForm
      settings={toPublicSettings(settings)}
      libraries={libraries}
      // Emails and other account details stay on the server.
      users={users.map(({ user_id, friendly_name }) => ({
        user_id,
        friendly_name,
      }))}
    />
  )
}

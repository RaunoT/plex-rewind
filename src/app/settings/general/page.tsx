import { requireSettingsAccess } from '@/lib/access'
import { getLibraries, getUsers } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { toPublicSettings } from '@/utils/publicSettings'
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
      users={users}
    />
  )
}

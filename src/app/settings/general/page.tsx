import { TautulliUser } from '@/types/tautulli'
import fetchTautulli, { getLibraries } from '@/utils/fetchTautulli'
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

async function getUsers(): Promise<TautulliUser[]> {
  const res = await fetchTautulli<TautulliUser[]>('get_users')
  const users = res?.response?.data?.filter(
    (user) => user.is_active && user.username !== 'Local',
  )

  return users || []
}

export default async function GeneralSettingsPage() {
  const [libraries, users] = await Promise.all([
    getLibraries(false),
    getUsers(),
  ])
  const settings = getSettings()

  return (
    <GeneralSettingsForm
      settings={settings}
      libraries={libraries}
      users={users}
    />
  )
}

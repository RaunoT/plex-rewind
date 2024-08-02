import { TautulliUser } from '@/types'
import fetchTautulli from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { Metadata } from 'next'
import RewindSettingsForm from './_components/RewindSettingsForm'

export const metadata: Metadata = {
  title: 'Rewind settings',
}

export default async function RewindSettingsPage() {
  const settings = getSettings()
  const usersRes = await fetchTautulli<TautulliUser[]>('get_users')
  const users = usersRes?.response?.data
  const fileredUsers = users?.filter(
    (user) => user.is_active && user.username !== 'Local',
  )

  return <RewindSettingsForm settings={settings} users={fileredUsers} />
}

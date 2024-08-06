export const dynamic = 'force-dynamic'

import { TautulliUser } from '@/types/tautulli'
import fetchTautulli from '@/utils/fetchTautulli'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const users = await fetchTautulli<TautulliUser[]>('get_users')
  const thisUser = users?.response.data.find((user) => user.user_id === userId)
  const isAdmin = thisUser?.is_admin
  const managedUsers = users?.response.data.filter(
    (user) => user.is_restricted && user.is_active,
  )

  if (isAdmin && managedUsers?.length) {
    return Response.json(managedUsers)
  }

  return Response.json(null)
}

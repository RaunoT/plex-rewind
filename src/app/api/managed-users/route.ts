import { TautulliUser } from '@/types'
import fetchTautulli from '@/utils/fetchTautulli'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const users = await fetchTautulli<TautulliUser[]>('get_users')
  const thisUser = users.response.data.find(
    (user) => user.user_id === Number(userId),
  )
  const isAdmin = thisUser?.is_admin

  if (isAdmin) {
    const managedUsers = users.response.data.filter(
      (user) => user.is_restricted,
    )

    return Response.json(managedUsers)
  }

  return Response.json(null)
}

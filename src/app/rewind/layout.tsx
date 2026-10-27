import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import { authOptions } from '@/lib/auth'
import { REWIND_CONTROLS_ID } from '@/utils/constants'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { getActiveUsers } from '@/utils/statsSource'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode, Suspense } from 'react'
import UserSelect from './_components/UserSelect'

type Props = {
  children: ReactNode
}

export default async function RewindLayout({ children }: Props) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'rewind', getViewer(session))) {
    return notFound()
  }

  const t = await getTranslations('Rewind')

  return (
    <div className='page-width flex flex-1 flex-col sm:flex-none'>
      <PageTitle title={t('title')} />
      <div className='mb-4 flex min-h-10 items-center justify-between gap-3'>
        <div id={REWIND_CONTROLS_ID} />
        {session?.user.isAdmin && (
          <Suspense>
            <AdminUserSelect defaultUserId={session.user.id} />
          </Suspense>
        )}
      </div>
      <CardWrapper className='sm:min-h-[80vh]'>{children}</CardWrapper>
    </div>
  )
}

async function AdminUserSelect({ defaultUserId }: { defaultUserId: string }) {
  const users = await getActiveUsers()

  return (
    <UserSelect
      users={users.map(({ user_id, friendly_name }) => ({
        user_id,
        friendly_name,
      }))}
      defaultUserId={defaultUserId}
    />
  )
}

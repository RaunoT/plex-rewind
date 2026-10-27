'use client'

import { TautulliUser } from '@/types/tautulli'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useRef } from 'react'

type Props = {
  users: TautulliUser[]
  defaultUserId: string
}

// Rendered by the layout, so it stays on screen while another user's rewind
// loads. The page shows the admin's own rewind for an unknown user ID.
export default function UserSelect({ users, defaultUserId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectRef = useRef<HTMLSelectElement>(null)
  const t = useTranslations('UserSelect')
  const userIdParam = searchParams.get('userId')
  const currentUserId = users.some(
    (user) => String(user.user_id) === userIdParam,
  )
    ? userIdParam
    : defaultUserId

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const newParams = new URLSearchParams(searchParams.toString())

    selectRef.current?.blur()
    newParams.set('userId', e.target.value)
    router.push(`/rewind?${newParams.toString()}`)
  }

  return (
    <div className='input-wrapper'>
      <div className='select-wrapper'>
        <select
          className='input input--small max-w-56 truncate'
          value={currentUserId ?? defaultUserId}
          onChange={handleChange}
          ref={selectRef}
          aria-label={t('label')}
        >
          {users.map((user) => (
            <option key={user.user_id} value={user.user_id}>
              {user.friendly_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

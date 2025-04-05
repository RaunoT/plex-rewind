'use client'

import { TautulliUser } from '@/types/tautulli'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useRef } from 'react'

type Props = {
  users: TautulliUser[]
  currentUserId: string
}

export default function UserSelect({ users, currentUserId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectRef = useRef<HTMLSelectElement>(null)
  const t = useTranslations('UserSelect')

  // eslint-disable-next-line @stylistic/js/padding-line-between-statements
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams.toString())

    selectRef.current?.blur()
    newParams.set('userId', e.target.value)
    router.push(`/rewind?${newParams.toString()}`)
  }

  return (
    <div className='input-wrapper absolute bottom-4 left-4 z-10'>
      <div className='select-wrapper select-wrapper--small'>
        <select
          className='input input--small'
          value={currentUserId}
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

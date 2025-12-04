'use client'

import { TautulliUser } from '@/types/tautulli'
import { useTranslations } from 'next-intl'
import { Checkbox, CheckboxGroup, Label } from 'react-aria-components'

type Props = {
  users: TautulliUser[]
  defaultSelectedIds: string[]
}

export default function UserMultiSelect({ users, defaultSelectedIds }: Props) {
  const t = useTranslations('Settings.General')
  // If no users are configured yet, default to all users selected
  const defaultValue =
    defaultSelectedIds.length > 0
      ? defaultSelectedIds
      : users.map((u) => u.user_id)

  return (
    <CheckboxGroup
      key={`active-users-${JSON.stringify(defaultValue)}`}
      className='input-wrapper'
      name='activeUsers'
      defaultValue={defaultValue}
    >
      <div className='peer mr-auto flex flex-wrap gap-2'>
        {users.map((user) => (
          <Checkbox
            key={`user-${user.user_id}`}
            value={user.user_id}
            className='checkbox-wrapper'
          >
            <div className='checkbox' aria-hidden='true'></div>
            {user.friendly_name}
          </Checkbox>
        ))}
      </div>
      <Label className='label label--start'>
        <span className='label-wrapper'>{t('activeUsers')}</span>
        <small>{t('activeUsersDescription')}</small>
      </Label>
    </CheckboxGroup>
  )
}

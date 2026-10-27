'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { Switch } from 'react-aria-components'
import getActivity from '../_actions/getActivity'

export default function StreamDetailsSwitch() {
  const t = useTranslations('Activity')
  const {
    activity: { isDetailsHidden, setIsDetailsHidden },
  } = useContext(GlobalContext)
  // Reads what the activity list fetches, without fetching again
  const { data } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity,
    enabled: false,
  })

  // Nothing to show details for. Kept while loading, so the list doesn't jump
  if (data !== undefined && !data?.sessions.length) {
    return null
  }

  return (
    <div className='mb-4 flex justify-end'>
      <Switch
        className='switch switch--small'
        isSelected={!isDetailsHidden}
        onChange={(isSelected) => setIsDetailsHidden(!isSelected)}
      >
        <div className='indicator'></div>
        <span>{t('streamDetails')}</span>
      </Switch>
    </div>
  )
}

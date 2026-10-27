'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import { useTranslations } from 'next-intl'
import { useContext } from 'react'
import { Switch } from 'react-aria-components'

export default function StreamDetailsSwitch() {
  const t = useTranslations('Activity')
  const {
    activity: { isDetailsHidden, setIsDetailsHidden },
  } = useContext(GlobalContext)

  return (
    <Switch
      className='switch switch--small'
      isSelected={!isDetailsHidden}
      onChange={(isSelected) => setIsDetailsHidden(!isSelected)}
    >
      <div className='indicator'></div>
      <span>{t('streamDetails')}</span>
    </Switch>
  )
}

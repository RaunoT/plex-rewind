'use client'

import Loader from '@/components/Loader'
import { useTranslations } from 'next-intl'
import { useFormStatus } from 'react-dom'

type Props = {
  isSetup?: boolean
}

export default function SettingsSaveButton({ isSetup }: Props) {
  const { pending } = useFormStatus()
  const t = useTranslations('Settings')

  return (
    <button
      className='button flex w-full min-w-28 justify-center sm:w-fit'
      type='submit'
      disabled={pending}
    >
      {pending ? <Loader size={6} /> : t(isSetup ? 'continue' : 'save')}
    </button>
  )
}

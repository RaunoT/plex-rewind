'use client'

import Loader from '@/components/Loader'
import { useFormStatus } from 'react-dom'

export default function SettingsSaveButton() {
  const { pending } = useFormStatus()

  return (
    <button
      className='button flex w-full min-w-28 justify-center sm:w-fit'
      type='submit'
      disabled={pending}
    >
      {pending ? <Loader size={6} /> : 'Save'}
    </button>
  )
}

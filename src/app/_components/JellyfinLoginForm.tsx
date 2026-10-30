'use client'

import { LoginErrorCode, toLoginErrorCode } from '@/lib/loginError'
import clsx from 'clsx'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'

type Props = {
  className?: string
}

export default function JellyfinLoginForm({ className }: Props) {
  const t = useTranslations('Home')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<LoginErrorCode | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setIsLoading(true)
    setError(null)

    try {
      // Without `redirect: false` a failed sign-in reloads the page and the
      // reason is lost.
      const res = await signIn('jellyfin', {
        username: formData.get('username'),
        password: formData.get('password'),
        callbackUrl: '/',
        redirect: false,
      })

      if (!res?.ok || res.error) {
        setError(toLoginErrorCode(res?.error))
        setIsLoading(false)

        return
      }

      // A full load, as the layout also renders from the session
      window.location.replace(res.url ?? '/')
    } catch (error) {
      console.error('[AUTH] - Error during sign-in!', error)
      setError('unknown')
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('flex w-full flex-col gap-3 text-left', className)}
    >
      <label className='flex flex-col gap-1.5 text-sm'>
        {t('username')}
        <input
          className='input'
          name='username'
          autoComplete='username'
          autoCapitalize='none'
          spellCheck={false}
          required
        />
      </label>
      <label className='flex flex-col gap-1.5 text-sm'>
        {t('password')}
        <input
          className='input'
          name='password'
          type='password'
          autoComplete='current-password'
        />
      </label>
      <button
        type='submit'
        className='button button--jellyfin mt-1 w-full'
        disabled={isLoading}
      >
        {t('loginWithJellyfin')}
      </button>
      {error && (
        <p role='alert' className='text-danger text-center text-sm'>
          {t(`loginError.${error}`)}
        </p>
      )}
    </form>
  )
}

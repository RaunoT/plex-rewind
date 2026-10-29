'use client'

import { RewindMusic } from '@/types/settings'
import { REWIND_MUSIC_MAX_BYTES, REWIND_MUSIC_TYPES } from '@/utils/constants'
import { bytesToSize } from '@/utils/formatting'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import { ChangeEvent, useRef, useState } from 'react'

type Props = {
  initialMusic: RewindMusic | null
}

const MUSIC_URL = '/api/rewind/music'
const ACCEPT = Object.keys(REWIND_MUSIC_TYPES)
  .map((extension) => `.${extension}`)
  .join(',')

// Saved as soon as it's chosen, apart from the rest of the form
export default function RewindMusicUpload({ initialMusic }: Props) {
  const t = useTranslations('Settings.Rewind')
  const translations = useTranslations()
  const [music, setMusic] = useState(initialMusic)
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const maxSize = bytesToSize(REWIND_MUSIC_MAX_BYTES, 0, translations) ?? ''

  function getError(code: string) {
    if (code === 'type') {
      return t('musicTypeError')
    }

    if (code === 'size') {
      return t('musicSizeError', { size: maxSize })
    }

    return t('musicError')
  }

  async function send(init: RequestInit) {
    setIsBusy(true)
    setError('')

    try {
      const response = await fetch(MUSIC_URL, init)
      const result = await response.json()

      if (response.ok) {
        setMusic(result.music)
      } else {
        setError(getError(result.error))
      }
    } catch {
      setError(getError(''))
    } finally {
      setIsBusy(false)
    }
  }

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]

    // Lets the same file be picked again after an error
    e.target.value = ''

    if (!file) {
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

    if (!Object.hasOwn(REWIND_MUSIC_TYPES, extension)) {
      setError(getError('type'))

      return
    }

    if (file.size > REWIND_MUSIC_MAX_BYTES) {
      setError(getError('size'))

      return
    }

    send({
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': REWIND_MUSIC_TYPES[extension],
        'X-File-Name': encodeURIComponent(file.name),
      },
    })
  }

  return (
    <div className='input-wrapper'>
      <div className='flex flex-1 flex-col items-start gap-3'>
        {music && (
          <p className='flex w-full min-w-0 items-center gap-1.5 text-sm font-medium'>
            <MusicalNoteIcon className='size-5 shrink-0' />
            <span className='truncate'>{music.name}</span>
            <span className='shrink-0 font-normal text-neutral-400'>
              {bytesToSize(music.size, 1, translations)}
            </span>
          </p>
        )}
        <div className='flex flex-wrap items-center gap-4'>
          <button
            type='button'
            className='button button-sm'
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
          >
            {isBusy
              ? t('musicSaving')
              : music
                ? t('musicReplace')
                : t('musicUpload')}
          </button>
          {music && (
            <button
              type='button'
              className='link text-sm'
              onClick={() => send({ method: 'DELETE' })}
              disabled={isBusy}
            >
              {t('musicRemove')}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type='file'
          accept={ACCEPT}
          className='hidden'
          onChange={upload}
          tabIndex={-1}
          aria-hidden='true'
        />
        {error && (
          <p className='text-danger text-xs' role='alert'>
            {error}
          </p>
        )}
      </div>
      <span className='label label--start'>
        <span className='label-wrapper'>{t('musicTrack')}</span>
        <small>{t('musicTrackDescription', { size: maxSize })}</small>
      </span>
    </div>
  )
}

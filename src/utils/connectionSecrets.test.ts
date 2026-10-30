import { ConnectionSettings } from '@/types/settings'
import { describe, expect, it } from 'vitest'
import { maskApiKeys, restoreApiKeys, SAVED_API_KEY } from './connectionSecrets'
import { DEFAULT_SETTINGS } from './constants'

const saved: ConnectionSettings = {
  ...DEFAULT_SETTINGS.connection,
  tautulliUrl: 'http://tautulli:8181',
  tautulliApiKey: 'tautulli-key',
  seerrUrl: 'http://seerr:5055',
  seerrApiKey: 'seerr-key',
  plexUrl: 'http://plex:32400',
  complete: true,
}

describe('maskApiKeys', () => {
  it('replaces saved keys and leaves empty ones empty', () => {
    const masked = maskApiKeys(saved)

    expect(masked.tautulliApiKey).toBe(SAVED_API_KEY)
    expect(masked.seerrApiKey).toBe(SAVED_API_KEY)
    expect(masked.tracearrApiKey).toBe('')
    expect(masked.tautulliUrl).toBe(saved.tautulliUrl)
    expect(JSON.stringify(masked)).not.toContain('tautulli-key')
    expect(JSON.stringify(masked)).not.toContain('seerr-key')
  })
})

describe('maskApiKeys after a save', () => {
  it('sends back keys the user typed and masks only stored ones', () => {
    const typed = { ...saved, tautulliApiKey: 'typed-key' }
    const masked = maskApiKeys(typed, saved)

    expect(masked.tautulliApiKey).toBe('typed-key')
    expect(masked.seerrApiKey).toBe(SAVED_API_KEY)
  })

  it('keeps a typed key on a first setup with nothing stored', () => {
    const empty = { ...saved, tautulliApiKey: '', seerrApiKey: '' }
    const masked = maskApiKeys({ ...saved, tautulliApiKey: 'new' }, empty)

    expect(masked.tautulliApiKey).toBe('new')
  })
})

describe('restoreApiKeys', () => {
  it('keeps the stored keys when the form sends the stand-in back', () => {
    const { connection, needsKey } = restoreApiKeys(maskApiKeys(saved), saved)

    expect(needsKey).toBeUndefined()
    expect(connection).toEqual(saved)
  })

  it('uses newly entered keys', () => {
    const { connection } = restoreApiKeys(
      { ...maskApiKeys(saved), tautulliApiKey: 'new-key' },
      saved,
    )

    expect(connection.tautulliApiKey).toBe('new-key')
  })

  it('asks for the key again when its URL changed', () => {
    const { needsKey } = restoreApiKeys(
      { ...maskApiKeys(saved), tautulliUrl: 'http://attacker.example' },
      saved,
    )

    expect(needsKey).toBe('Tautulli')
  })

  it('matches a URL saved with a trailing slash', () => {
    const { connection, needsKey } = restoreApiKeys(maskApiKeys(saved), {
      ...saved,
      tautulliUrl: 'http://tautulli:8181/',
    })

    expect(needsKey).toBeUndefined()
    expect(connection.tautulliApiKey).toBe('tautulli-key')
  })

  it('drops the key of a service whose URL was cleared', () => {
    const { connection, needsKey } = restoreApiKeys(
      { ...maskApiKeys(saved), seerrUrl: '' },
      saved,
    )

    expect(needsKey).toBeUndefined()
    expect(connection.seerrApiKey).toBe('')
  })

  it('asks for a key that was never saved', () => {
    const { needsKey } = restoreApiKeys(
      {
        ...saved,
        tracearrUrl: 'http://tracearr:3000',
        tracearrApiKey: SAVED_API_KEY,
      },
      saved,
    )

    expect(needsKey).toBe('Tracearr')
  })
})

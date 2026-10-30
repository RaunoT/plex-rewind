import { Settings } from '@/types/settings'
import fs from 'fs'
import { cloneDeep } from 'lodash'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from './constants'

let directory: string
let settingsPath: string
let editCount: number

async function loadModule(): Promise<typeof import('./getSettings')> {
  vi.resetModules()

  // The settings path is built from the working directory when the module loads
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(directory)

  try {
    return await import('./getSettings')
  } finally {
    cwd.mockRestore()
  }
}

function completeSettings(): Settings {
  const settings = cloneDeep(DEFAULT_SETTINGS)

  settings.connection.tautulliUrl = 'http://tautulli:8181'
  settings.connection.tautulliApiKey = 'key'
  settings.connection.plexUrl = 'http://plex:32400'
  settings.connection.complete = true
  settings.general.complete = true
  settings.rewind.complete = true
  settings.dashboard.complete = true
  settings.activity.complete = true

  return settings
}

function errnoError(code: string): Error {
  return Object.assign(new Error(`${code}: simulated failure`), { code })
}

function readSettingsFile(): string {
  return fs.readFileSync(settingsPath, 'utf-8')
}

function readSavedSettings(): Settings {
  return JSON.parse(readSettingsFile())
}

// Moves the modification time on so the change is noticed however coarse the
// filesystem's timestamps are
function editSettingsFile(content: string): void {
  const time = new Date(Date.now() + ++editCount * 10_000)

  fs.writeFileSync(settingsPath, content)
  fs.utimesSync(settingsPath, time, time)
}

function listConfigFiles(): string[] {
  return fs.readdirSync(path.dirname(settingsPath)).sort()
}

function listBackups(): string[] {
  return listConfigFiles().filter((file) =>
    file.startsWith('settings.json.corrupt-'),
  )
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rewindarr-settings-'))
  settingsPath = path.join(directory, 'config/settings.json')
  editCount = 0

  fs.mkdirSync(path.dirname(settingsPath))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(directory, { recursive: true, force: true })
})

describe('getSettings', () => {
  it('writes the defaults on first run', async () => {
    const { default: getSettings } = await loadModule()

    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(readSettingsFile()).toBe(
      `${JSON.stringify(DEFAULT_SETTINGS, undefined, 2)}\n`,
    )
    expect(listConfigFiles()).toEqual(['settings.json'])
  })

  it('still returns the defaults on first run when they cannot be saved', async () => {
    vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw errnoError('EROFS')
    })

    const { default: getSettings } = await loadModule()

    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(listConfigFiles()).toEqual([])
  })

  it('fills in settings added by newer versions and saves them', async () => {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ connection: { plexUrl: 'http://plex:32400' } }),
    )

    const { default: getSettings } = await loadModule()
    const settings = getSettings()

    expect(settings.connection.plexUrl).toBe('http://plex:32400')
    expect(settings.connection.mediaServerType).toBe('plex')
    expect(settings.connection.tautulliUrl).toBe('')
    expect(settings.dashboard).toEqual(DEFAULT_SETTINGS.dashboard)
    expect(readSavedSettings()).toEqual(settings)
  })

  it('keeps shorter saved arrays instead of padding them with the defaults', async () => {
    const saved = cloneDeep(DEFAULT_SETTINGS)

    saved.general.activeItemStatistics = ['year']
    saved.dashboard.activeTotalStatistics = []
    saved.general.activeLibraries = ['1', '2']
    fs.writeFileSync(settingsPath, JSON.stringify(saved))

    const { default: getSettings } = await loadModule()
    const settings = getSettings()

    expect(settings.general.activeItemStatistics).toEqual(['year'])
    expect(settings.dashboard.activeTotalStatistics).toEqual([])
    expect(settings.general.activeLibraries).toEqual(['1', '2'])
    expect(readSavedSettings().dashboard.activeTotalStatistics).toEqual([])
  })

  it('moves item statistics saved with the dashboard to general', async () => {
    const { activeItemStatistics: _, ...general } = DEFAULT_SETTINGS.general
    const saved = {
      ...DEFAULT_SETTINGS,
      general,
      dashboard: {
        ...DEFAULT_SETTINGS.dashboard,
        activeItemStatistics: ['year'],
      },
    }

    fs.writeFileSync(settingsPath, JSON.stringify(saved))

    const { default: getSettings } = await loadModule()

    expect(getSettings().general.activeItemStatistics).toEqual(['year'])
    expect(readSavedSettings().general.activeItemStatistics).toEqual(['year'])
    expect(readSavedSettings().dashboard).not.toHaveProperty(
      'activeItemStatistics',
    )
  })

  it('moves the saved Overseerr connection to Seerr', async () => {
    const {
      seerrUrl: _,
      seerrApiKey: __,
      ...connection
    } = DEFAULT_SETTINGS.connection
    const saved = {
      ...DEFAULT_SETTINGS,
      connection: {
        ...connection,
        overseerrUrl: 'https://seerr.example.com',
        overseerrApiKey: 'key',
      },
    }

    fs.writeFileSync(settingsPath, JSON.stringify(saved))

    const { default: getSettings } = await loadModule()

    expect(getSettings().connection).toMatchObject({
      seerrUrl: 'https://seerr.example.com',
      seerrApiKey: 'key',
    })
    expect(readSavedSettings().connection).toMatchObject({
      seerrUrl: 'https://seerr.example.com',
      seerrApiKey: 'key',
    })
    expect(readSavedSettings().connection).not.toHaveProperty('overseerrUrl')
    expect(readSavedSettings().connection).not.toHaveProperty('overseerrApiKey')
  })

  it('turns the old rating statistic into one per rating provider', async () => {
    const { activeItemStatistics: _, ...general } = DEFAULT_SETTINGS.general
    // Saved before item statistics moved to general
    const saved = {
      ...DEFAULT_SETTINGS,
      general,
      dashboard: {
        ...DEFAULT_SETTINGS.dashboard,
        activeItemStatistics: ['year', 'rating', 'plays'],
      },
    }

    fs.writeFileSync(settingsPath, JSON.stringify(saved))

    const { default: getSettings } = await loadModule()
    const expected = [
      'year',
      'tmdbRating',
      'imdbRating',
      'rottenTomatoesRating',
      'rottenTomatoesAudienceRating',
      'plays',
    ]

    expect(getSettings().general.activeItemStatistics).toEqual(expected)
    expect(readSavedSettings().general.activeItemStatistics).toEqual(expected)
  })

  it('renames the active Tracearr shows library from its old name', async () => {
    const saved = cloneDeep(DEFAULT_SETTINGS)

    saved.connection.statisticsSource = 'tracearr'
    saved.general.activeLibraries = ['movies', 'tv-shows', 'music']
    fs.writeFileSync(settingsPath, JSON.stringify(saved))

    const { default: getSettings } = await loadModule()
    const expected = ['movies', 'shows', 'music']

    expect(getSettings().general.activeLibraries).toEqual(expected)
    expect(readSavedSettings().general.activeLibraries).toEqual(expected)
  })

  it('keeps a Tautulli library named TV Shows', async () => {
    const saved = cloneDeep(DEFAULT_SETTINGS)

    saved.connection.statisticsSource = 'tautulli'
    saved.general.activeLibraries = ['movies', 'tv-shows']
    fs.writeFileSync(settingsPath, JSON.stringify(saved))

    const { default: getSettings } = await loadModule()

    expect(getSettings().general.activeLibraries).toEqual([
      'movies',
      'tv-shows',
    ])
  })

  it('returns a copy that callers can change freely', async () => {
    const { default: getSettings } = await loadModule()
    const first = getSettings()

    first.connection.plexUrl = 'http://changed'
    first.general.activeItemStatistics.push('year')

    const second = getSettings()

    expect(second.connection.plexUrl).toBe('')
    expect(second.general.activeItemStatistics).toEqual(
      DEFAULT_SETTINGS.general.activeItemStatistics,
    )
  })

  it('only reads the file again when it changed', async () => {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS))

    const { default: getSettings } = await loadModule()
    const readFile = vi.spyOn(fs, 'readFileSync')

    getSettings()
    getSettings()
    getSettings()

    expect(readFile).toHaveBeenCalledTimes(1)
  })

  it('picks up edits made while the app is running', async () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    settings.general.serverName = 'aaaa'
    fs.writeFileSync(settingsPath, JSON.stringify(settings))

    const { default: getSettings } = await loadModule()

    expect(getSettings().general.serverName).toBe('aaaa')

    // Same size, only the modification time differs
    settings.general.serverName = 'bbbb'
    editSettingsFile(JSON.stringify(settings))

    expect(getSettings().general.serverName).toBe('bbbb')

    settings.general.serverName = 'a much longer name'
    editSettingsFile(JSON.stringify(settings))

    expect(getSettings().general.serverName).toBe('a much longer name')
  })

  it('accepts a file saved with a byte order mark', async () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    settings.general.serverName = 'Home'
    fs.writeFileSync(settingsPath, `﻿${JSON.stringify(settings)}`)

    const { default: getSettings } = await loadModule()

    expect(getSettings().general.serverName).toBe('Home')
    expect(listBackups()).toEqual([])
  })

  it('marks the setup complete once all required settings are filled in', async () => {
    fs.writeFileSync(settingsPath, JSON.stringify(completeSettings()))

    const { default: getSettings } = await loadModule()

    expect(getSettings().setupComplete).toBe(true)
    expect(readSavedSettings().setupComplete).toBe(true)
  })

  it('keeps a setup done before it was tracked complete', async () => {
    const settings: Partial<Settings> = completeSettings()

    delete settings.setupComplete
    // @ts-expect-error - required since v4.9.0, so missing from older files
    delete settings.activity.complete
    fs.writeFileSync(settingsPath, JSON.stringify(settings))

    const { default: getSettings } = await loadModule()

    expect(getSettings().setupComplete).toBe(true)
    expect(readSavedSettings().setupComplete).toBe(true)
  })

  it('leaves an old file without a saved connection in setup', async () => {
    const settings: Partial<Settings> = cloneDeep(DEFAULT_SETTINGS)

    delete settings.setupComplete
    fs.writeFileSync(settingsPath, JSON.stringify(settings))

    const { default: getSettings } = await loadModule()

    expect(getSettings().setupComplete).toBe(false)
  })

  it('leaves an unfinished first setup open', async () => {
    const settings = completeSettings()

    settings.activity.complete = false
    settings.setupComplete = false
    fs.writeFileSync(settingsPath, JSON.stringify(settings))

    const { default: getSettings } = await loadModule()

    expect(getSettings().setupComplete).toBe(false)
  })

  it('does not fail when the filled in settings cannot be saved', async () => {
    const original = JSON.stringify({ general: { serverName: 'Home' } })

    fs.writeFileSync(settingsPath, original)
    vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw errnoError('EROFS')
    })

    const { default: getSettings } = await loadModule()

    expect(getSettings().general.serverName).toBe('Home')
    expect(getSettings().connection).toEqual(DEFAULT_SETTINGS.connection)
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(readSettingsFile()).toBe(original)
    expect(listConfigFiles()).toEqual(['settings.json'])
  })
})

describe('getSettings with an invalid file', () => {
  it('throws without touching the file and keeps a backup', async () => {
    const broken = '{ "connection": { "plexUrl": "http://plex" '

    fs.writeFileSync(settingsPath, broken)

    const { default: getSettings } = await loadModule()

    expect(() => getSettings()).toThrow(/not valid JSON/)
    expect(() => getSettings()).toThrow(/not valid JSON/)
    expect(readSettingsFile()).toBe(broken)
    expect(listBackups()).toHaveLength(1)
    expect(
      fs.readFileSync(path.join(path.dirname(settingsPath), listBackups()[0])),
    ).toEqual(Buffer.from(broken))
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[SETTINGS]'),
    )
  })

  it.each(['', '[]', 'null', '"text"'])(
    'does not treat %j as valid settings',
    async (content) => {
      fs.writeFileSync(settingsPath, content)

      const { default: getSettings } = await loadModule()

      expect(() => getSettings()).toThrow(/\[SETTINGS\]/)
      expect(readSettingsFile()).toBe(content)
    },
  )

  it('does not treat a file that cannot be read as a first run', async () => {
    fs.mkdirSync(settingsPath)

    const { default: getSettings } = await loadModule()

    expect(() => getSettings()).toThrow(/Unable to read/)
    expect(fs.statSync(settingsPath).isDirectory()).toBe(true)
  })

  it('serves the last valid settings when the file breaks while running', async () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    settings.general.serverName = 'Home'
    fs.writeFileSync(settingsPath, JSON.stringify(settings))

    const { default: getSettings } = await loadModule()

    expect(getSettings().general.serverName).toBe('Home')

    editSettingsFile('{ "general": ')

    expect(getSettings().general.serverName).toBe('Home')
    expect(getSettings().general.serverName).toBe('Home')
    expect(readSettingsFile()).toBe('{ "general": ')
    expect(listBackups()).toEqual([])
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[SETTINGS]'),
    )
  })

  it('goes back to the file once it is fixed', async () => {
    const settings = cloneDeep(DEFAULT_SETTINGS)

    fs.writeFileSync(settingsPath, JSON.stringify(settings))

    const { default: getSettings } = await loadModule()

    getSettings()
    editSettingsFile('{ "general": ')
    getSettings()

    settings.general.serverName = 'Fixed'
    editSettingsFile(JSON.stringify(settings))

    expect(getSettings().general.serverName).toBe('Fixed')
  })

  it('backs up the invalid file before a save replaces it', async () => {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS))

    const { default: getSettings, writeSettings } = await loadModule()
    const settings = getSettings()

    editSettingsFile('{ "general": ')
    getSettings()
    settings.general.serverName = 'Saved'
    writeSettings(settings)

    expect(readSavedSettings().general.serverName).toBe('Saved')
    expect(listBackups()).toHaveLength(1)
    expect(
      fs.readFileSync(
        path.join(path.dirname(settingsPath), listBackups()[0]),
        'utf-8',
      ),
    ).toBe('{ "general": ')
    expect(getSettings().general.serverName).toBe('Saved')
  })
})

describe('getSettings with a file that cannot be read', () => {
  it('backs the file up before a save replaces it', async () => {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS))

    const { default: getSettings, writeSettings } = await loadModule()
    const settings = getSettings()
    const readFileSync = fs.readFileSync

    editSettingsFile(JSON.stringify({ general: { serverName: 'Edited' } }))
    vi.spyOn(fs, 'readFileSync').mockImplementation(((
      file: fs.PathOrFileDescriptor,
      options?: BufferEncoding,
    ) => {
      if (file === settingsPath) {
        throw errnoError('EIO')
      }

      return readFileSync(file, options as 'utf-8')
    }) as typeof fs.readFileSync)

    expect(getSettings().general.serverName).toBe('')

    vi.mocked(fs.readFileSync).mockRestore()
    settings.general.serverName = 'Saved'
    writeSettings(settings)

    expect(readSavedSettings().general.serverName).toBe('Saved')
    expect(listBackups()).toHaveLength(1)
    expect(
      JSON.parse(
        fs.readFileSync(
          path.join(path.dirname(settingsPath), listBackups()[0]),
          'utf-8',
        ),
      ).general.serverName,
    ).toBe('Edited')
  })

  it('refuses to replace the file when it cannot be backed up', async () => {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS))

    const { default: getSettings, writeSettings } = await loadModule()
    const settings = getSettings()

    editSettingsFile(JSON.stringify({ general: { serverName: 'Edited' } }))
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw errnoError('EIO')
    })
    vi.spyOn(fs, 'copyFileSync').mockImplementation(() => {
      throw errnoError('EIO')
    })

    getSettings()

    expect(() => writeSettings(settings)).toThrow(/not replaced/)

    vi.restoreAllMocks()

    expect(readSavedSettings().general.serverName).toBe('Edited')
    expect(listBackups()).toHaveLength(0)
  })
})

describe('writeSettings', () => {
  it('writes readable JSON and leaves no temporary files', async () => {
    const { writeSettings } = await loadModule()
    const settings = completeSettings()

    settings.general.activeItemStatistics = []
    writeSettings(settings)
    writeSettings(settings)

    expect(readSettingsFile()).toBe(
      `${JSON.stringify({ ...settings, setupComplete: true }, undefined, 2)}\n`,
    )
    expect(listConfigFiles()).toEqual(['settings.json'])
  })

  it('makes the written settings available without reading the file', async () => {
    const { default: getSettings, writeSettings } = await loadModule()
    const settings = getSettings()

    settings.general.serverName = 'Home'
    writeSettings(settings)

    const readFile = vi.spyOn(fs, 'readFileSync')

    expect(getSettings().general.serverName).toBe('Home')
    expect(readFile).not.toHaveBeenCalled()
  })

  it('completes the setup as soon as the required settings are filled in', async () => {
    const { default: getSettings, writeSettings } = await loadModule()

    getSettings()
    writeSettings({ ...completeSettings(), setupComplete: false })

    expect(getSettings().setupComplete).toBe(true)
    expect(readSavedSettings().setupComplete).toBe(true)
  })

  it.skipIf(process.platform === 'win32')(
    'keeps the permissions of the existing file',
    async () => {
      fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS))
      fs.chmodSync(settingsPath, 0o600)

      const { default: getSettings, writeSettings } = await loadModule()

      writeSettings(getSettings())

      expect(fs.statSync(settingsPath).mode & 0o777).toBe(0o600)
    },
  )

  it('writes in place when the file cannot be replaced', async () => {
    fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS))
    vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw errnoError('EBUSY')
    })

    const { default: getSettings, writeSettings } = await loadModule()
    const settings = getSettings()

    settings.general.serverName = 'Home'
    writeSettings(settings)

    expect(readSavedSettings().general.serverName).toBe('Home')
    expect(getSettings().general.serverName).toBe('Home')
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[SETTINGS]'),
    )
    expect(listConfigFiles()).toEqual(['settings.json'])
  })

  it('leaves the existing file alone when the write fails', async () => {
    const original = JSON.stringify(DEFAULT_SETTINGS)

    fs.writeFileSync(settingsPath, original)

    const { default: getSettings, writeSettings } = await loadModule()
    const settings = getSettings()

    vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw errnoError('EIO')
    })
    settings.general.serverName = 'Home'

    expect(() => writeSettings(settings)).toThrow(/EIO/)
    expect(readSettingsFile()).toBe(original)
    expect(listConfigFiles()).toEqual(['settings.json'])
    expect(getSettings().general.serverName).toBe('')
  })
})

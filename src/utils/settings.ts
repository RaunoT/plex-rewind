import { promises as fs } from 'fs'
import { settingsPath } from './config'

export async function getSettings() {
  try {
    const path = process.cwd() + settingsPath
    try {
      return JSON.parse(await fs.readFile(path, 'utf8'))
    } catch (readError) {
      // If the file doesn't exist, create it and return an empty object
      if (readError.code === 'ENOENT') {
        await fs.writeFile(path, JSON.stringify({}), 'utf8')
        return {}
      }
      throw readError
    }
  } catch (error) {
    console.error('Error handling settings file!', error)
    return {}
  }
}

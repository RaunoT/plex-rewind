import path from 'path'

export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8383'

const baseDir = process.env.BASE_DIR || process.cwd()
export const settingsPath = path.join(baseDir, 'src/config/settings.json')

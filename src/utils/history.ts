import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import fs from 'fs'
import { encode } from 'gpt-tokenizer'
import path from 'path'
import fetchTautulli from './fetchTautulli'
import { secondsToTime } from './formatting'

const MAX_TOKENS = 1000000

export const HISTORY_PATH = path.join(process.cwd(), 'config/history.txt')

export async function saveTautulliHistory(
  settings: Settings,
  forceUpdate: boolean = false,
): Promise<string> {
  let newFile = false

  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, 'Initial history', 'utf-8')
    newFile = true
  }

  // Fetch new data
  if (forceUpdate || newFile) {
    const history = await getHistory(settings)

    fs.writeFileSync(HISTORY_PATH, history, 'utf-8')

    return history
  } else {
    try {
      const stats = fs.statSync(HISTORY_PATH)
      const fileAge = Date.now() - stats.mtimeMs

      // Less than 1 hour old
      if (fileAge < 3600000) {
        return fs.readFileSync(HISTORY_PATH, 'utf-8')
      }
    } catch (error) {
      console.error('[CHAT] - Error reading history file!', error)
    }
  }

  const history = await getHistory(settings)

  fs.writeFileSync(HISTORY_PATH, history, 'utf-8')

  return history
}

async function getHistory(settings: Settings): Promise<string> {
  const startDate = settings.chat.startDate || ''
  const endDate = settings.chat.endDate || ''
  const historyData = await fetchTautulli<{ data: TautulliItemRow[] }>(
    'get_history',
    {
      length: -1,
      after: startDate,
      before: endDate,
    },
    false,
  )
  const history = historyData?.response?.data.data
  const formattedHistory = formatHistory(history)
  const truncatedHistory = truncateHistory(formattedHistory)

  return truncatedHistory
}

function formatHistory(history: TautulliItemRow[] | undefined): string {
  if (!history?.length) return 'No recent viewing history available.'

  return history
    .map(
      (item: TautulliItemRow) => `
  - ${item.full_title} (${item.year})
    Viewer: ${item.friendly_name} (ID: ${item.user_id})
    Date: ${new Date(item.date * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    Start: ${new Date(item.started * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    Finish: ${new Date(item.stopped * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    Paused: ${secondsToTime(item.paused_counter)}
    Duration: ${secondsToTime(item.duration)} (${item.watched_status ? 100 : item.percent_complete}%)
    Platform: ${item.platform}
    Player: ${item.player}
    Type: ${item.media_type}
    Transcoding decision: ${item.transcode_decision}
    Rating key: ${item.rating_key}
`,
    )
    .join('\n')
}

function truncateHistory(history: string): string {
  const tokens = encode(history)

  if (tokens.length < MAX_TOKENS) {
    return history
  }

  const notice =
    'The history has been trimmed due to token limit. Make the user aware of this.\n'
  const noticeTokens = encode(notice)
  const availableTokens = MAX_TOKENS - noticeTokens.length
  const entries = history.split('\n')

  let truncatedHistory = ''
  let currentTokenCount = 0

  for (const entry of entries) {
    const entryTokens = encode(entry)

    if (currentTokenCount + entryTokens.length > availableTokens) {
      break
    }

    truncatedHistory += entry + '\n'
    currentTokenCount += entryTokens.length
  }

  return (notice + truncatedHistory).trim()
}

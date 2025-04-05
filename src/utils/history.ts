import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import fs from 'fs'
import { encode } from 'gpt-tokenizer'
import { getTranslations } from 'next-intl/server'
import path from 'path'
import fetchTautulli from './fetchTautulli'
import { secondsToTime, TranslateFunction } from './formatting'

const MAX_TOKENS = 1000000

export const HISTORY_PATH = path.join(process.cwd(), 'config/history.csv')

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
  const t = await getTranslations()
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
  const formattedHistory = formatHistory(history, t)
  const truncatedHistory = truncateHistory(formattedHistory)

  return truncatedHistory
}

function formatHistory(
  history: TautulliItemRow[] | undefined,
  t: TranslateFunction,
): string {
  if (!history?.length) return 'No recent viewing history available.'

  const header =
    'Title,Year,Username,UserID,Date,StartTime,FinishTime,Paused,Duration,Percent,Platform,Player,Type,Transcode,RatingKey\n'
  const rows = history
    .map((item: TautulliItemRow) => {
      const date = new Date(item.date * 1000).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
      const start = new Date(item.started * 1000).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const finish = new Date(item.stopped * 1000).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const percent = item.watched_status ? 100 : item.percent_complete

      return `"${item.full_title}",${item.year},${item.friendly_name},${item.user_id},${date},${start},${finish},${secondsToTime(item.paused_counter, t)},${secondsToTime(item.duration, t)},${percent},${item.platform},${item.player},${item.media_type},${item.transcode_decision},${item.rating_key}`
    })
    .join('\n')

  return header + rows
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

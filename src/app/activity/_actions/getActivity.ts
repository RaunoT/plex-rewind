'use server'

import { authOptions } from '@/lib/auth'
import { Settings } from '@/types/settings'
import { TautulliActivity, TautulliSession } from '@/types/tautulli'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { getActivity as fetchActivity } from '@/utils/statsSource'
import { getServerSession, Session } from 'next-auth'

// Only the fields the activity page renders are sent to the browser.
const SESSION_FIELDS = [
  'audio_atmos',
  'audio_channel_layout',
  'audio_codec',
  'bandwidth',
  'bitrate',
  'container',
  'duration',
  'friendly_name',
  'grandparent_guids',
  'grandparent_rating_key',
  'grandparent_thumb',
  'grandparent_title',
  'guids',
  'ip_address',
  'ip_address_public',
  'location',
  'media_type',
  'parent_rating_key',
  'parent_title',
  'player',
  'product',
  'progress_percent',
  'quality_profile',
  'rating_key',
  'session_key',
  'state',
  'stream_audio_atmos',
  'stream_audio_channel_layout',
  'stream_audio_codec',
  'stream_audio_decision',
  'stream_audio_language',
  'stream_bitrate',
  'stream_container',
  'stream_container_decision',
  'stream_subtitle_codec',
  'stream_subtitle_decision',
  'stream_subtitle_language',
  'stream_video_codec',
  'stream_video_decision',
  'stream_video_dynamic_range',
  'stream_video_full_resolution',
  'subtitle_codec',
  'thumb',
  'title',
  'transcode_decision',
  'user_id',
  'user_thumb',
  'video_codec',
  'video_dynamic_range',
  'video_full_resolution',
  'view_offset',
  'year',
] as const satisfies readonly (keyof TautulliSession)[]

function toPublicSession(
  session: TautulliSession,
  settings: Settings,
  viewer: Session | null,
): TautulliSession {
  const publicSession = Object.fromEntries(
    SESSION_FIELDS.map((field) => [field, session[field]]),
  ) as TautulliSession
  const { isAnonymized } = settings.general
  const isOwnSession =
    !!viewer?.user?.id && String(session.user_id) === String(viewer.user.id)

  if (!viewer?.user?.isAdmin || isAnonymized) {
    delete publicSession.ip_address
    delete publicSession.ip_address_public
    delete publicSession.location
  }

  // Device names such as "Alice's iPhone" give the user away too
  if (isAnonymized && !isOwnSession) {
    publicSession.friendly_name = ''
    publicSession.player = ''
    publicSession.user_id = 0
    publicSession.user_thumb = ''
  }

  return publicSession
}

export default async function getActivity(): Promise<TautulliActivity | null> {
  const settings = getSettings()
  const viewer = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'activity', getViewer(viewer))) {
    return null
  }

  const activity = await fetchActivity()

  if (!activity) {
    return null
  }

  return {
    stream_count: activity.stream_count,
    sessions: activity.sessions.map((session) =>
      toPublicSession(session, settings, viewer),
    ),
  }
}

import {
  TracearrPlay,
  TracearrPlayMediaType,
  TracearrPlexUser,
} from './fetchTracearr'

type PlayFilter = {
  since: string | Date
  mediaTypes?: TracearrPlayMediaType[]
  identityId?: string
  excludedIdentityIds?: string[]
}

// Narrows plays down to a window that starts at an exact time, and to the
// media types and users asked for.
export function filterPlays(
  plays: TracearrPlay[],
  { since, mediaTypes, identityId, excludedIdentityIds = [] }: PlayFilter,
): TracearrPlay[] {
  const sinceTime = new Date(since).getTime()

  return plays.filter(
    (play) =>
      play.startedAt >= sinceTime &&
      (!mediaTypes || mediaTypes.includes(play.mediaType)) &&
      (!identityId || play.identityId === identityId) &&
      !excludedIdentityIds.includes(play.identityId),
  )
}

export function getExcludedIdentityIds(
  users: TracearrPlexUser[],
  excludedPlexIds: string[],
): string[] {
  return users
    .filter((user) => excludedPlexIds.includes(user.plexId))
    .map((user) => user.identityId)
}

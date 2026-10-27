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

// Plays are fetched from a whole UTC day (so periods share a cache), so the
// window is narrowed back down to the exact start here.
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

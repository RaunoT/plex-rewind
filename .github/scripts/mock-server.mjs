#!/usr/bin/env node
// A stand-in for Tautulli and Seerr with made-up data for a 15-person
// server, for taking README screenshots without anyone's real history. Titles
// are real, so posters, ratings and links still come from TMDB and the rating
// services. See CONTRIBUTING.md for how to use it.
//
// Your own Plex account is one of the users, so you can sign in. Set
// MOCK_USER_ID, MOCK_USER_NAME, MOCK_USER_EMAIL and MOCK_USER_THUMB to the
// details Plex has for you. The port is MOCK_PORT, 8787 by default.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.MOCK_PORT) || 8787
const DAY = 24 * 60 * 60
const NOW = Math.floor(Date.now() / 1000)
// The key the app itself uses, for the posters of what's playing
const TMDB_API_KEY =
  process.env.TMDB_API_KEY ||
  fs
    .readFileSync(
      path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../src/utils/constants.ts',
      ),
      'utf8',
    )
    .match(/TMDB_API_KEY = '(\w+)'/)?.[1]
// Hours a month in each library, which every count is worked out from
const USERS = [
  {
    id: process.env.MOCK_USER_ID || '1',
    name: process.env.MOCK_USER_NAME || 'Alex Morgan',
    email: process.env.MOCK_USER_EMAIL || 'alex@example.com',
    thumb: process.env.MOCK_USER_THUMB || '',
    isAdmin: true,
    joined: '2021-03-14',
    hours: { movie: 9, show: 28, artist: 46 },
    favorites: {
      movie: [2, 1, 6, 8, 9],
      show: [2, 1, 6, 8, 5],
      artist: [1, 2, 6, 4, 8],
    },
  },
  ['Sam Rivera', '2021-05-02', 14, 41, 4],
  ['Maya Chen', '2021-11-19', 11, 36, 12],
  ['Jonas Berg', '2022-01-08', 6, 33, 22],
  ['Priya Patel', '2022-04-21', 12, 24, 9],
  ['Lukas Novak', '2022-09-03', 8, 29, 0],
  ['Emma Laine', '2023-02-11', 5, 27, 16],
  ['Diego Alvarez', '2023-06-25', 13, 15, 3],
  ['Hanna Kask', '2023-10-30', 4, 22, 11],
  ['Oliver Brooks', '2024-01-17', 7, 18, 6],
  ['Sofia Rossi', '2024-05-09', 6, 14, 18],
  ['Noah Fischer', '2024-08-22', 9, 10, 0],
  ['Aino Virtanen', '2025-01-05', 3, 12, 7],
  ['Marcus Webb', '2025-04-14', 5, 7, 2],
  ['Lea Martin', '2025-09-01', 2, 6, 5],
].map((user, i) => {
  if (!Array.isArray(user)) {
    return user
  }

  const [name, joined, movie, show, artist] = user
  const username = name.toLowerCase().replace(/\s+/g, '.')

  return {
    id: String(100000 + i),
    name,
    email: `${username}@example.com`,
    thumb: '',
    isAdmin: false,
    joined,
    hours: { movie, show, artist },
  }
})
// Plays in the last 30 days. Runtimes are in minutes. A deleted title is no
// longer on the server, so it gets a request button. Shows end with their
// episode count, which caps how often one person can have played them.
const MEDIA = {
  movie: [
    ['Sinners', 2025, 9, 137, 7],
    ['One Battle After Another', 2025, 8, 162, 6],
    ['Project Hail Mary', 2026, 7, 156, 6],
    ['Weapons', 2025, 6, 128, 5],
    ['Marty Supreme', 2025, 6, 149, 4, true],
    ['F1', 2025, 5, 156, 4],
    ['Superman', 2025, 4, 129, 4],
    ['Dune: Part Two', 2024, 3, 166, 3],
    ['Frankenstein', 2025, 3, 150, 3],
    ['Wake Up Dead Man: A Knives Out Mystery', 2025, 2, 144, 2],
    ['Bugonia', 2025, 2, 118, 2],
    ['Hamnet', 2025, 2, 126, 2],
  ],
  show: [
    ['The Pitt', 2025, 62, 50, 7, false, 30],
    ['Severance', 2022, 48, 52, 6, false, 19],
    ['Pluribus', 2025, 41, 45, 6, false, 9],
    ['Stranger Things', 2016, 37, 75, 8, false, 42],
    ['The Bear', 2022, 30, 32, 4, false, 38],
    ['Slow Horses', 2022, 26, 48, 4, false, 30],
    ['The White Lotus', 2021, 22, 58, 3, false, 26],
    ['Andor', 2022, 19, 50, 3, false, 24],
    ['Shōgun', 2024, 15, 58, 3, true, 10],
    ['The Last of Us', 2023, 14, 55, 3, false, 16],
    ['Only Murders in the Building', 2021, 12, 32, 2, false, 50],
    ['Task', 2025, 10, 55, 2, false, 7],
  ],
  artist: [
    ['The Rolling Stones', null, 418, 4.1, 9],
    ['Fleetwood Mac', null, 236, 4.1, 7],
    ['Taylor Swift', null, 198, 4.1, 5],
    ['Daft Punk', null, 171, 4.1, 6],
    ['Kendrick Lamar', null, 152, 4.1, 4],
    ['Radiohead', null, 129, 4.1, 4],
    ['Arctic Monkeys', null, 117, 4.1, 5],
    ['Queen', null, 104, 4.1, 6],
    ['Billie Eilish', null, 96, 4.1, 3],
    ['The Beatles', null, 88, 4.1, 5],
    ['Tame Impala', null, 74, 4.1, 3],
    ['Massive Attack', null, 61, 4.1, 2],
  ],
}
const LIBRARIES = [
  {
    section_id: '1',
    section_name: 'Movies',
    section_type: 'movie',
    count: '1214',
    parent_count: '',
    child_count: '',
    size: 23.6e12,
  },
  {
    section_id: '2',
    section_name: 'Shows',
    section_type: 'show',
    count: '187',
    parent_count: '642',
    child_count: '9831',
    size: 31.2e12,
  },
  {
    section_id: '3',
    section_name: 'Music',
    section_type: 'artist',
    count: '658',
    parent_count: '2410',
    child_count: '38264',
    size: 0.94e12,
  },
]
// Average length of one play, in minutes
const PLAY_MINUTES = { movie: 126, show: 48, artist: 4.1 }
const HISTORY_TYPE = { movie: 'movie', episode: 'show', track: 'artist' }
const KEY_BASE = { movie: 1000, show: 2000, artist: 3000 }
const items = Object.fromEntries(
  Object.entries(MEDIA).map(([type, list]) => [
    type,
    list.map(
      ([title, year, plays, minutes, users, isDeleted, episodes], i) => ({
        key: KEY_BASE[type] + i + 1,
        title,
        year,
        plays,
        minutes,
        users,
        isDeleted: !!isDeleted,
        episodes,
      }),
    ),
  ]),
)
const libraryById = Object.fromEntries(
  LIBRARIES.map((library) => [library.section_id, library]),
)

// Days of history a user has in the last `days`, since they only count from
// joining the server
function activeDays(user, days) {
  const joinedDaysAgo = (NOW - Date.parse(user.joined) / 1000) / DAY

  return Math.max(0, Math.min(days, joinedDaysAgo))
}

function userPlays(user, type, days) {
  return Math.round(
    (((user.hours[type] * 60) / PLAY_MINUTES[type]) * activeDays(user, days)) /
      30,
  )
}

function userSeconds(user, type, days) {
  return Math.round((user.hours[type] * 3600 * activeDays(user, days)) / 30)
}

// A user's own top five, their favorites or else the server's from a
// different starting point, so no two lists look alike
function userTopItems(user, type, days) {
  const list = items[type]
  const index = USERS.indexOf(user)
  const picks =
    user.favorites?.[type].map((rank) => list[rank - 1]) ??
    Array.from({ length: 5 }, (_, i) => list[(index + i * 2) % list.length])
  const total = userPlays(user, type, days) * 0.6
  const weights = [0.34, 0.24, 0.18, 0.14, 0.1]
  // Nobody watches a film more than twice, or more episodes than a show has
  const limit = (item) =>
    type === 'movie' ? 2 : type === 'show' ? item.episodes : Infinity

  return picks
    .map((item, i) => {
      const plays = Math.min(
        limit(item),
        Math.max(1, Math.round(total * weights[i])),
      )

      return { item, plays, seconds: Math.round(plays * item.minutes * 57) }
    })
    .filter(({ plays }) => total > 0 && plays > 0)
}

function itemRow(item, plays, seconds, type, isPopular) {
  return {
    title: item.title,
    year: item.year,
    rating_key: item.key,
    grandparent_rating_key: item.key,
    media_type: type,
    total_plays: plays,
    total_duration: seconds,
    // Only Tautulli's popular lists say how many people watched
    users_watched: isPopular ? item.users : undefined,
    // Posters come from TMDB, but artists have none there
    thumb: type === 'artist' ? `/library/metadata/${item.key}/thumb/1` : '',
    grandparent_thumb: '',
    rating: null,
    tmdb_id: null,
    imdb_id: null,
  }
}

function homeStats(params) {
  const statId = params.stat_id
  const days = Number(params.time_range) || 30
  const count = Number(params.stats_count) || 10
  const sortByPlays = params.stats_type === 'plays'
  const library = libraryById[params.section_id]
  const user = USERS.find((u) => u.id === String(params.user_id))

  if (statId === 'top_users') {
    const type = library?.section_type
    const rows = USERS.map((u) => ({
      user_id: Number(u.id),
      user: u.email.split('@')[0],
      friendly_name: u.name,
      user_thumb: u.thumb,
      total_plays: type ? userPlays(u, type, days) : 0,
      total_duration: type ? userSeconds(u, type, days) : 0,
    }))
      .filter((row) => row.total_plays > 0)
      .sort((a, b) => b.total_duration - a.total_duration)

    return { stat_id: statId, rows: rows.slice(0, count) }
  }

  const type = {
    top_movies: 'movie',
    popular_movies: 'movie',
    top_tv: 'show',
    popular_tv: 'show',
    top_music: 'artist',
    popular_music: 'artist',
  }[statId]

  if (!type) {
    return { stat_id: statId, rows: [] }
  }

  const isPopular = statId.startsWith('popular_')
  const rows = user
    ? userTopItems(user, type, days).map(({ item, plays, seconds }) =>
        itemRow(item, plays, seconds, type, isPopular),
      )
    : items[type].map((item) => {
        const plays = Math.max(1, Math.round((item.plays * days) / 30))

        return itemRow(
          item,
          plays,
          Math.round(plays * item.minutes * 57),
          type,
          isPopular,
        )
      })

  rows.sort((a, b) =>
    sortByPlays
      ? b.total_plays - a.total_plays
      : b.total_duration - a.total_duration,
  )

  return { stat_id: statId, rows: rows.slice(0, count) }
}

// Each library's plays of the last HISTORY_DAYS, newest first, made up the
// same way on every start. Rows are grouped like Tautulli's, one per play
// however often it was resumed.
const HISTORY_DAYS = 400
const PLAY_TYPE = { movie: 'movie', show: 'episode', artist: 'track' }

let plays

function makePlays() {
  let seed = 11

  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  let referenceId = 0

  return Object.fromEntries(
    Object.entries(items).map(([type, list]) => {
      const rows = []

      for (const user of USERS) {
        const perDay = (user.hours[type] * 60) / PLAY_MINUTES[type] / 30
        // The owner's favorites come up more often
        const weights = list.map(
          (item, i) =>
            item.plays * (user.favorites?.[type].includes(i + 1) ? 4 : 1),
        )
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

        for (let day = 0; day < activeDays(user, HISTORY_DAYS); day++) {
          const count = Math.floor(perDay) + (random() < perDay % 1 ? 1 : 0)

          for (let n = 0; n < count; n++) {
            let pick = random() * totalWeight

            const item = list.find((_, i) => (pick -= weights[i]) < 0)
            const started = Math.floor(NOW - (day + random()) * DAY)
            const seconds = Math.round(item.minutes * 60 * (0.8 + random() / 5))
            const number = 1 + Math.floor(random() * (item.episodes || 12))

            referenceId++
            rows.push({
              reference_id: referenceId,
              id: referenceId,
              date: started,
              started,
              stopped: started + seconds,
              duration: seconds,
              play_duration: seconds,
              percent_complete: Math.round(
                (seconds / (item.minutes * 60)) * 100,
              ),
              media_type: PLAY_TYPE[type],
              title:
                type === 'movie'
                  ? item.title
                  : type === 'show'
                    ? `Episode ${number}`
                    : `Track ${number}`,
              parent_title: type === 'show' ? 'Season 1' : '',
              grandparent_title: type === 'movie' ? '' : item.title,
              year: item.year,
              rating_key: type === 'movie' ? item.key : item.key * 100 + number,
              grandparent_rating_key: type === 'movie' ? '' : item.key,
              // Posters come from TMDB, but artists have none there
              thumb: '',
              user_id: Number(user.id),
              user: user.email.split('@')[0],
              friendly_name: user.name,
              user_thumb: user.thumb,
            })
          }
        }
      }

      return [type, rows.sort((a, b) => b.date - a.date)]
    }),
  )
}

function history(params) {
  const users = params.user_id
    ? USERS.filter((u) => u.id === String(params.user_id))
    : USERS

  // The first play, for when someone joined
  if (
    params.user_id &&
    params.order_dir === 'asc' &&
    Number(params.length) === 1
  ) {
    const first = users[0]
    const show = items.show[3]
    const started = Date.parse(`${first?.joined}T19:42:00Z`) / 1000

    return {
      recordsFiltered: first ? 1 : 0,
      data: first
        ? [
            {
              reference_id: 1_000_000,
              date: started,
              started,
              duration: show.minutes * 60,
              play_duration: show.minutes * 60,
              percent_complete: 100,
              media_type: 'episode',
              title: 'Chapter One: The Vanishing of Will Byers',
              parent_title: 'Season 1',
              grandparent_title: show.title,
              year: show.year,
              rating_key: show.key * 100 + 1,
              grandparent_rating_key: show.key,
              thumb: '',
              user_id: Number(first.id),
              friendly_name: first.name,
              user_thumb: first.thumb,
            },
          ]
        : [],
    }
  }

  plays ??= makePlays()

  const type =
    libraryById[params.section_id]?.section_type ??
    HISTORY_TYPE[params.media_type]
  const ids = new Set(users.map((user) => Number(user.id)))
  const rows = (type ? plays[type] : Object.values(plays).flat())
    .filter((row) => ids.has(row.user_id))
    .sort((a, b) =>
      params.order_dir === 'asc' ? a.date - b.date : b.date - a.date,
    )
  const start = Number(params.start) || 0

  return {
    recordsFiltered: rows.length,
    data: rows.slice(start, start + (Number(params.length) || 25)),
  }
}

// Evenings and weekends, like most servers
const HOUR_SHAPE = [
  3, 2, 1, 1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 6, 6, 7, 9, 12, 16, 21, 26, 24, 15, 7,
]
const DAY_SHAPE = {
  Sunday: 21,
  Monday: 11,
  Tuesday: 12,
  Wednesday: 13,
  Thursday: 14,
  Friday: 17,
  Saturday: 19,
}

function graph(params, byHour) {
  const users = params.user_id
    ? USERS.filter((u) => u.id === String(params.user_id))
    : USERS
  const days = Number(params.time_range) || 30
  const series = [
    ['TV', 'show'],
    ['Movies', 'movie'],
    ['Music', 'artist'],
  ].map(([name, type]) => {
    const total = users.reduce((sum, u) => sum + userPlays(u, type, days), 0)
    const shape = byHour ? HOUR_SHAPE : Object.values(DAY_SHAPE)
    const shapeTotal = shape.reduce((sum, value) => sum + value, 0)

    return {
      name,
      data: shape.map((value) => Math.round((total * value) / shapeTotal)),
    }
  })

  return {
    categories: byHour
      ? HOUR_SHAPE.map((_, hour) => String(hour).padStart(2, '0'))
      : Object.keys(DAY_SHAPE),
    series,
  }
}

function tautulliUser(user) {
  return {
    user_id: user.id,
    username: user.email.split('@')[0],
    friendly_name: user.name,
    email: user.email,
    thumb: user.thumb,
    user_thumb: user.thumb,
    is_admin: user.isAdmin ? 1 : 0,
    is_active: 1,
    is_restricted: 0,
    shared_libraries: LIBRARIES.map((library) => library.section_id),
  }
}

const [owner, sam, maya] = USERS
const SESSIONS = [
  {
    session_key: '41',
    user_id: Number(sam.id),
    friendly_name: sam.name,
    user_thumb: sam.thumb,
    media_type: 'movie',
    rating_key: 7001,
    title: 'Sinners',
    year: '2025',
    thumb: '/library/metadata/7001/thumb/1',
    grandparent_thumb: '',
    grandparent_title: '',
    player: 'Living Room',
    product: 'Plex for Apple TV',
    state: 'playing',
    progress_percent: '34',
    view_offset: String(47 * 60 * 1000),
    duration: String(137 * 60 * 1000),
    transcode_decision: 'transcode',
    container: 'mkv',
    stream_container: 'mpegts',
    stream_container_decision: 'transcode',
    video_codec: 'hevc',
    stream_video_codec: 'h264',
    stream_video_decision: 'transcode',
    video_full_resolution: '4k',
    stream_video_full_resolution: '1080p',
    video_dynamic_range: 'HDR',
    stream_video_dynamic_range: 'SDR',
    audio_codec: 'truehd',
    audio_channel_layout: '7.1',
    audio_atmos: 1,
    stream_audio_codec: 'aac',
    stream_audio_channel_layout: 'stereo',
    stream_audio_decision: 'transcode',
    stream_audio_language: 'English',
    stream_audio_atmos: 0,
    subtitle_codec: '',
    stream_subtitle_codec: '',
    stream_subtitle_decision: '',
    stream_subtitle_language: '',
    bitrate: '52400',
    stream_bitrate: '8000',
    quality_profile: '8 Mbps 1080p',
    bandwidth: '9100',
    location: 'wan',
    ip_address: '203.0.113.42',
    ip_address_public: '203.0.113.42',
  },
  {
    session_key: '42',
    user_id: Number(owner.id),
    friendly_name: owner.name,
    user_thumb: owner.thumb,
    media_type: 'track',
    rating_key: 7003,
    parent_rating_key: 7002,
    grandparent_rating_key: items.artist[0].key,
    title: 'Gimme Shelter',
    parent_title: 'Let It Bleed',
    grandparent_title: 'The Rolling Stones',
    year: '1969',
    thumb: '/library/metadata/7002/thumb/1',
    grandparent_thumb: `/library/metadata/${items.artist[0].key}/thumb/1`,
    player: 'Study',
    product: 'Plexamp',
    state: 'playing',
    progress_percent: '38',
    view_offset: String(104 * 1000),
    duration: String(271 * 1000),
    transcode_decision: 'direct play',
    container: 'flac',
    stream_container: 'flac',
    stream_container_decision: 'direct play',
    video_codec: '',
    stream_video_codec: '',
    stream_video_decision: '',
    video_full_resolution: '',
    stream_video_full_resolution: '',
    video_dynamic_range: '',
    stream_video_dynamic_range: '',
    audio_codec: 'flac',
    audio_channel_layout: 'stereo',
    stream_audio_codec: 'flac',
    stream_audio_channel_layout: 'stereo',
    stream_audio_decision: 'direct play',
    stream_audio_language: '',
    subtitle_codec: '',
    stream_subtitle_codec: '',
    stream_subtitle_decision: '',
    stream_subtitle_language: '',
    bitrate: '1411',
    stream_bitrate: '1411',
    quality_profile: 'Original',
    bandwidth: '1600',
    location: 'lan',
    ip_address: '192.168.1.24',
  },
  {
    session_key: '43',
    user_id: Number(maya.id),
    friendly_name: maya.name,
    user_thumb: maya.thumb,
    media_type: 'episode',
    rating_key: 7005,
    parent_rating_key: 7004,
    grandparent_rating_key: items.show[0].key,
    title: '8:00 A.M.',
    parent_title: 'Season 2',
    grandparent_title: 'The Pitt',
    year: '2026',
    thumb: '/library/metadata/7004/thumb/1',
    grandparent_thumb: '/library/metadata/7004/thumb/1',
    player: 'Bedroom',
    product: 'Plex for LG',
    state: 'paused',
    progress_percent: '71',
    view_offset: String(36 * 60 * 1000),
    duration: String(51 * 60 * 1000),
    transcode_decision: 'direct play',
    container: 'mkv',
    stream_container: 'mkv',
    stream_container_decision: 'direct play',
    video_codec: 'hevc',
    stream_video_codec: 'hevc',
    stream_video_decision: 'direct play',
    video_full_resolution: '4k',
    stream_video_full_resolution: '4k',
    video_dynamic_range: 'Dolby Vision',
    stream_video_dynamic_range: 'Dolby Vision',
    audio_codec: 'eac3',
    audio_channel_layout: '5.1',
    audio_atmos: 1,
    stream_audio_codec: 'eac3',
    stream_audio_channel_layout: '5.1',
    stream_audio_decision: 'direct play',
    stream_audio_language: 'English',
    stream_audio_atmos: 1,
    subtitle_codec: '',
    stream_subtitle_codec: '',
    stream_subtitle_decision: '',
    stream_subtitle_language: '',
    bitrate: '24800',
    stream_bitrate: '24800',
    quality_profile: 'Original',
    bandwidth: '26100',
    location: 'lan',
    ip_address: '192.168.1.31',
  },
]
// Where each piece of artwork comes from, by rating key
const ARTWORK = {
  ...Object.fromEntries(
    items.artist.map((item) => [item.key, { artist: item.title }]),
  ),
  7001: { tmdb: 'movie', title: 'Sinners', year: 2025 },
  7002: { album: 'Let It Bleed', artist: 'The Rolling Stones' },
  7004: { tmdb: 'tv', title: 'The Pitt', year: 2025 },
}
const artworkCache = new Map()

async function findArtworkUrl(source) {
  if (source.tmdb) {
    const yearParam =
      source.tmdb === 'movie' ? 'primary_release_year' : 'first_air_date_year'
    const search = await fetch(
      `https://api.themoviedb.org/3/search/${source.tmdb}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(source.title)}&${yearParam}=${source.year}`,
    ).then((res) => res.json())
    const poster = search.results?.[0]?.poster_path

    return poster && `https://image.tmdb.org/t/p/w500${poster}`
  }

  if (source.album) {
    const search = await fetch(
      `https://api.deezer.com/search/album?q=${encodeURIComponent(`${source.artist} ${source.album}`)}`,
    ).then((res) => res.json())

    return search.data?.[0]?.cover_xl
  }

  const search = await fetch(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(source.artist)}`,
  ).then((res) => res.json())

  return search.data?.[0]?.picture_xl
}

async function artwork(img) {
  const key = Number(img?.match(/^\/library\/metadata\/(\d+)\//)?.[1])
  const source = ARTWORK[key]

  if (!source) {
    return null
  }

  if (!artworkCache.has(key)) {
    artworkCache.set(
      key,
      (async () => {
        const url = await findArtworkUrl(source)

        if (!url) {
          return null
        }

        const res = await fetch(url)

        return {
          type: res.headers.get('content-type') || 'image/jpeg',
          body: Buffer.from(await res.arrayBuffer()),
        }
      })().catch(() => null),
    )
  }

  return artworkCache.get(key)
}

function tautulli(params) {
  switch (params.cmd) {
    case 'get_libraries':
      return LIBRARIES.map(({ size: _, ...library }) => ({
        ...library,
        is_active: 1,
      }))
    case 'get_library_media_info':
      return {
        total_file_size: libraryById[params.section_id]?.size ?? 0,
        data: [],
      }
    case 'get_users':
      return USERS.map(tautulliUser)
    case 'get_user': {
      const user = USERS.find((u) => u.id === String(params.user_id))

      return user ? tautulliUser(user) : {}
    }
    case 'get_server_identity':
      return { machine_identifier: 'mockserver0000000000000000000000000000000' }
    case 'get_activity':
      return { stream_count: SESSIONS.length, sessions: SESSIONS }
    case 'get_home_stats':
      return homeStats(params)
    case 'get_history':
      return history(params)
    case 'get_plays_by_hourofday':
      return graph(params, true)
    case 'get_plays_by_dayofweek':
      return graph(params, false)
    case 'get_metadata': {
      const item = Object.values(items)
        .flat()
        .find((i) => i.key === Number(params.rating_key))

      // Tautulli answers with nothing for an item Plex no longer has
      return item?.isDeleted ? {} : { thumb: '', title: item?.title }
    }
    default:
      return null
  }
}

// Requests spread over the last year and a half, more from heavier users
function makeRequests() {
  const requests = []

  let seed = 7

  for (let day = 0; day < 540; day++) {
    for (const [i, user] of USERS.entries()) {
      seed = (seed * 16807) % 2147483647

      const activity = user.hours.movie + user.hours.show

      if ((seed % 1000) / 1000 < activity / 1300 && activeDays(user, day) > 0) {
        requests.push({
          id: requests.length + 1,
          type: seed % 3 === 0 ? 'tv' : 'movie',
          createdAt: new Date(
            (NOW - day * DAY - i * 3600) * 1000,
          ).toISOString(),
          requestedBy: { id: i + 1, plexId: Number(user.id) },
        })
      }
    }
  }

  return requests
}

const REQUESTS = makeRequests()
const SEERR_USERS = USERS.map((user, i) => ({
  id: i + 1,
  plexId: Number(user.id),
  plexUsername: user.email.split('@')[0],
}))

function page(results, query) {
  const take = Number(query.get('take')) || 20
  const skip = Number(query.get('skip')) || 0

  return {
    pageInfo: {
      pages: Math.ceil(results.length / take),
      pageSize: take,
      results: results.length,
      page: Math.floor(skip / take) + 1,
    },
    results: results.slice(skip, skip + take),
  }
}

function seerr(pathname, query) {
  if (pathname === '/api/v1/request') {
    return page(REQUESTS, query)
  }

  if (pathname === '/api/v1/user') {
    return page(SEERR_USERS, query)
  }

  const userRequests = pathname.match(/^\/api\/v1\/user\/(\d+)\/requests$/)

  if (userRequests) {
    const id = Number(userRequests[1])

    return page(
      REQUESTS.filter((request) => request.requestedBy.id === id),
      query,
    )
  }

  return null
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)

    if (url.pathname === '/api/v2') {
      const params = Object.fromEntries(url.searchParams)

      if (params.cmd === 'pms_image_proxy') {
        const image = await artwork(params.img)

        if (!image) {
          res.writeHead(404).end()

          return
        }

        res.writeHead(200, { 'Content-Type': image.type })
        res.end(image.body)

        return
      }

      const data = tautulli(params)

      json(res, 200, {
        response: data
          ? { result: 'success', message: null, data }
          : { result: 'error', message: `Unknown command ${params.cmd}` },
      })

      return
    }

    const data = seerr(url.pathname, url.searchParams)

    if (data) {
      json(res, 200, data)

      return
    }

    json(res, 404, { message: 'Not found' })
  })
  .listen(PORT, () => {
    console.log(`Mock Tautulli and Seerr at http://localhost:${PORT}`)
  })

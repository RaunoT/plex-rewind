import qs from "qs"
import { excludedLibraries } from "./config"
import { Library } from "./types"

type TautulliResponse<T> = {
  response: {
    data: T
  }
}

type QueryParams = {
  [key: string]: string | number
}

export default async function fetchTautulli<T>(
  query: string,
  params?: QueryParams,
  cache: boolean = false,
): Promise<TautulliResponse<T>> {
  const tautulliUrl = process.env.NEXT_PUBLIC_TAUTULLI_URL
  const apiKey = process.env.TAUTULLI_API_KEY

  if (!tautulliUrl) {
    throw new Error("Tautulli URL is not configured!")
  }

  if (!apiKey) {
    throw new Error("Tautulli API key is not configured!")
  }

  const apiUrl = `${tautulliUrl}/api/v2?apikey=${apiKey}`

  try {
    const res = await fetch(`${apiUrl}&cmd=${query}&${qs.stringify(params)}`, {
      cache: cache ? "force-cache" : "no-store",
    })

    if (!res.ok) {
      throw new Error(
        `Tautulli API request failed: ${res.status} ${res.statusText}`,
      )
    }

    return res.json()
  } catch (error) {
    console.error("Error fetching from Tautulli API:", error)
    throw error
  }
}

export async function getServerId(): Promise<string> {
  const plexHostname = process.env.PLEX_HOSTNAME
  const plexPort = process.env.PLEX_PORT

  if (plexHostname && plexPort) {
    const serverIdPromise = await fetchTautulli<{ identifier: string }>(
      "get_server_id",
      {
        hostname: plexHostname,
        port: plexPort,
      },
      true,
    )
    return serverIdPromise.response?.data?.identifier
  } else {
    throw new Error("Plex hostname and/or port are not configured!")
  }
}

export async function getLibraries(): Promise<Library[]> {
  const libraries = await fetchTautulli<Library[]>("get_libraries", {}, true)
  const filteredLibraries = libraries.response?.data.filter(
    (library) => !excludedLibraries.includes(library.section_name),
  )

  return filteredLibraries
}

export async function getLibrariesByType(
  type: "movie" | "show" | "artist",
): Promise<Library[]> {
  const libraries = await getLibraries()

  return libraries.filter((library) => library.section_type === type)
}

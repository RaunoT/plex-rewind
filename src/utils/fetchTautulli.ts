type TautulliResponse<T> = {
  response: {
    data: T
  }
}

type SearchParams = {
  [key: string]: string | number
}

export default async function fetchTautulli<T>(
  query: string,
  params?: SearchParams,
  cache?: boolean,
): Promise<TautulliResponse<T>> {
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`

  // Convert numeric params to strings
  const convertedParams: { [key: string]: string } = {}
  if (params) {
    for (const key in params) {
      convertedParams[key] = String(params[key])
    }
  }

  const paramsStr = new URLSearchParams(convertedParams).toString()
  const res = await fetch(
    `${apiUrl}&cmd=${query}${paramsStr ? '&' + paramsStr : ''}`,
    {
      next: { revalidate: cache ? 3600 : 0 },
    },
  )
  const data = await res.json()

  return data
}

export async function getServerId(): Promise<string> {
  const serverIdPromise = await fetchTautulli('get_server_id', {
    hostname: 'localhost',
    port: '32400',
  })

  return serverIdPromise.response?.data?.identifier
}

// TODO: Define types for the parameters and response structure
type Params = {
  [key: string]: string
}
// TODO: Replace 'any' with a more specific type based on the expected API response structure
type TautulliResponse = any

export default async function fetchTautulli(
  query: string,
  params?: Params,
  cache?: boolean,
): Promise<TautulliResponse> {
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsStr = params ? '&' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`${apiUrl}&cmd=${query}${paramsStr}`, {
    next: { revalidate: cache ? 3600 : 0 },
  })
  const data = await res.json()

  return data
}

export async function getServerId(): Promise<string | undefined> {
  const serverIdPromise = await fetchTautulli('get_server_id', {
    hostname: 'localhost',
    port: '32400',
  })

  return serverIdPromise.response?.data?.identifier
}

export function normalizeUrl(url?: string | null): string {
  return (url ?? '').trim().replace(/\/+$/, '')
}

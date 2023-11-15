export function errorResponse(
  statusText: string,
  status: number,
  errorText: string | null = null,
) {
  const body = errorText ? { errorText: errorText } : null

  return new Response(JSON.stringify(body), {
    status: status,
    statusText: statusText,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

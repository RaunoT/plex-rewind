// Runs once when the server starts. Tracearr's play history is read from then
// on, so the first pages opened don't have to wait for it.
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== 'nodejs' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return
  }

  try {
    const { startHistoryRead } = await import('./utils/statsSource')

    startHistoryRead()
  } catch (error) {
    // Settings that can't be read are reported by the pages that need them
    console.error('[TRACEARR] - Unable to start reading the history!', error)
  }
}

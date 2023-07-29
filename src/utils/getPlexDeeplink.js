import fetchTautulli from './fetchTautulli'

export default async function getPlexDeeplink(ratingKey) {
  const serverIdPromise = await fetchTautulli('get_home_stats', {
    stat_id: 'get_server_id',
    hostname: 'localhost',
    port: '32400',
  })
  const serverId = serverIdPromise.response?.data?.identifier
  // plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${data.ratingKey}&server=${serverId}

  return `https://app.plex.tv/desktop#!/server/${serverId}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`
}

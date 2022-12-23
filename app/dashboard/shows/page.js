async function getData() {
  const res = await fetch(
    'https://tautulli.rauno.eu/api/v2?apikey=0976ef8d45234737be74da14ef38de8c&cmd=get_home_stats&stat_id=top_tv&stats_count=5&stats_type=duration',
  )
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  return res.json()
}

export default async function Dashboard() {
  const data = await getData()
  console.log(data)

  return <h1>Hello, shows!</h1>
}

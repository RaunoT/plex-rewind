import fetchStats from './fetchFromTautulli'

async function fetchRatings(ratingKeys) {
  // TODO: Catch errors
  let criticRatingsArray = []
  let audienceRatingsArray = []
  const ratingsPromises = ratingKeys.map((ratingKey) =>
    fetchStats('get_metadata', {
      rating_key: ratingKey,
    }),
  )

  const ratings = await Promise.all(ratingsPromises)

  ratings.forEach((rating) => {
    criticRatingsArray.push(
      rating.response.data.rating ? rating.response.data.rating : '',
    )
    audienceRatingsArray.push(
      rating.response.data.audience_rating
        ? rating.response.data.audience_rating
        : '',
    )
  })

  const combinedRatings = [...Array(ratingKeys.length)].map((_, i) => ({
    critic: criticRatingsArray[i],
    audience: audienceRatingsArray[i],
  }))

  return combinedRatings
}

export default fetchRatings

import fetchStats from './fetchFromTautulli'
import { round } from 'lodash'

async function fetchRatings(ratingKeys) {
  // TODO: Catch errors
  let criticRatingsArr = []
  let audienceRatingsArr = []
  let combinedRatingsArr = []
  const ratingsPromises = ratingKeys.map((ratingKey) =>
    fetchStats('get_metadata', {
      rating_key: ratingKey,
    }),
  )

  const ratings = await Promise.all(ratingsPromises)

  ratings.forEach((rating) => {
    criticRatingsArr.push(
      rating.response.data.rating ? rating.response.data.rating : '',
    )
    audienceRatingsArr.push(
      rating.response.data.audience_rating
        ? rating.response.data.audience_rating
        : '',
    )
  })

  ratings.forEach((rating, i) => {
    if (criticRatingsArr[i] && audienceRatingsArr[i]) {
      const combinedRating = (+criticRatingsArr[i] + +audienceRatingsArr[i]) / 2
      combinedRatingsArr.push(round(combinedRating, 1).toFixed(1))
    } else if (criticRatingsArr[i]) {
      combinedRatingsArr.push(criticRatingsArr[i])
    } else if (audienceRatingsArr[i]) {
      combinedRatingsArr.push(audienceRatingsArr[i])
    } else {
      combinedRatingsArr.push('')
    }
  })

  return combinedRatingsArr
}

export default fetchRatings

async function fetchStuff(query, params) {
  // TODO: Add try-catch
  const apiUrl = `${process.env.NEXT_PUBLIC_TAUTULLI_URL}/api/v2?apikey=${process.env.TAUTULLI_API_KEY}`
  const paramsString = params
    ? '&' + new URLSearchParams(params).toString()
    : ''
  const response = await fetch(`${apiUrl}&cmd=${query}${paramsString}`)
  const data = await response.blob()

  return data
}

async function fetchImages(ratingKeys, params) {
  // TODO: Add try-catch
  let imagesArray = []

  const imagesPromises = ratingKeys.map((ratingKey) =>
    fetchStuff('pms_image_proxy', {
      rating_key: ratingKey,
      width: 300,
    }),
  )

  const images = await Promise.all(imagesPromises)

  images.forEach((image) => {
    // console.log(image)
    const imageBlob = image
    const imageObjectURL = URL.createObjectURL(imageBlob)

    imagesArray.push(imageObjectURL)
  })

  return imagesArray
}

export default fetchImages

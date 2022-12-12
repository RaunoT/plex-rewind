// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import fetchRewind from '../../utils/fetchRewind'

export default async function handler(req, res) {
  const rewind = await fetchRewind(8898770)
  res.status(200).json(rewind)
}

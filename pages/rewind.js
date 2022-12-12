import Rewind from '../components/Rewind/Rewind'
import fetchRewind from '../utils/fetchRewind'

function RewindPage({ rewind }) {
  return <Rewind rewind={rewind} />
}

export async function getStaticProps() {
  const rewind = await fetchRewind(8898770)

  return {
    props: {
      rewind,
    },
    revalidate: 3600,
  }
}

export default RewindPage

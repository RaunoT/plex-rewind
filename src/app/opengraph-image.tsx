import plexSvg from '@/assets/plex.svg'
import { META_TITLE } from '@/utils/constants'
import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'
// Image metadata
export const alt = META_TITLE
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(to bottom right, #171717, #262626, #312e81)',
        }}
      >
        <div>
          <img src={plexSvg} />
          <span>rewind</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}

import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'
import { ComponentType, SVGProps } from 'react'

type AverageMessage = {
  key: 'averageSame' | 'averageTimes' | 'averageMore' | 'averageLess'
  values: Record<string, number>
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

// Within this many percent of the average reads as about the same
const SAME_RANGE = 5

// Picks the words for how far the user is from the average: a multiple from
// twice as much up, as "650% more" reads poorly
export function getAverageMessage(difference: number): AverageMessage {
  if (Math.abs(difference) < SAME_RANGE) {
    return { key: 'averageSame', values: {}, Icon: ScaleIcon }
  }

  if (difference >= 100) {
    return {
      key: 'averageTimes',
      values: { times: Math.round(10 + difference / 10) / 10 },
      Icon: ArrowTrendingUpIcon,
    }
  }

  return difference > 0
    ? {
        key: 'averageMore',
        values: { percent: difference / 100 },
        Icon: ArrowTrendingUpIcon,
      }
    : {
        key: 'averageLess',
        values: { percent: -difference / 100 },
        Icon: ArrowTrendingDownIcon,
      }
}

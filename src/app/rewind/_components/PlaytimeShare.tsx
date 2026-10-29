import { useTranslations } from 'next-intl'
import RewindStat from './RewindStat'

type Props = {
  // Formatted, empty when it rounds to 0%
  percentage: string
  step: number
}

// A media type's share of the user's total playtime
export default function PlaytimeShare({ percentage, step }: Props) {
  const t = useTranslations('Rewind.Common')

  return percentage ? (
    <RewindStat step={step}>
      <p>
        {t.rich('percentage', {
          percentageValue: percentage,
          percentage: (chunks) => <span className='rewind-stat'>{chunks}</span>,
        })}
      </p>
    </RewindStat>
  ) : null
}

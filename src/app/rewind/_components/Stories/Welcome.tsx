import Avatar from '@/components/Avatar'
import { RewindStory } from '@/types/rewind'
import { formatMonthYear } from '@/utils/formatting'
import { getRewindStartDate } from '@/utils/helpers'
import { useLocale, useTranslations } from 'next-intl'
import RewindStat from '../RewindStat'

export default function StoryWelcome({ userRewind, settings }: RewindStory) {
  const startDate = getRewindStartDate(settings)
  const isDefaultPeriod = !settings.rewind.startDate
  const t = useTranslations('Rewind.Welcome')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const formattedStartDate = formatMonthYear(startDate, locale)
  // The window always runs to now, so the displayed range ends today.
  const formattedEndDate = formatMonthYear(
    new Date().toISOString().split('T')[0],
    locale,
  )

  return (
    <>
      <RewindStat noScale isAnimated={false}>
        <div className='relative mb-8 size-24 overflow-hidden rounded-full'>
          <Avatar
            src={userRewind.user.image}
            name={userRewind.user.name}
            alt={tCommon('profilePictureAlt', { name: userRewind.user.name })}
            sizes='10rem'
            priority
          />
        </div>
        <p>
          {t.rich('welcome', {
            serverName: settings.general.serverName || 'Plex',
            userValue: userRewind.user.name,
            rewind: (chunks) => chunks,
            user: (chunks) => <span className='rewind-cat'>{chunks}</span>,
          })}
        </p>
      </RewindStat>

      <RewindStat renderDelay={2} scaleDelay={2} noScale>
        <p>
          {t('takeYouThrough')}{' '}
          {isDefaultPeriod
            ? t.rich('forPastYear', {
                pastYear: (chunks) => (
                  <span className='rewind-cat'>{chunks}</span>
                ),
              })
            : formattedStartDate === formattedEndDate
              ? t.rich('singleDate', {
                  singleDateValue: formattedStartDate,
                  singleDate: (chunks) => (
                    <span className='rewind-cat'>{chunks}</span>
                  ),
                })
              : t.rich('dateRange', {
                  startDateValue: formattedStartDate,
                  endDateValue: formattedEndDate,
                  startDate: (chunks) => (
                    <span className='rewind-cat'>{chunks}</span>
                  ),
                  endDate: (chunks) => (
                    <span className='rewind-cat'>{chunks}</span>
                  ),
                })}
        </p>
      </RewindStat>

      <RewindStat renderDelay={4} noScale>
        <p>{t('letsGetStarted')}</p>
      </RewindStat>
    </>
  )
}

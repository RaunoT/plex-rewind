import '@/styles/globals.css';
import { googleAnalyticsId } from '@/utils/config';
import { META_DESCRIPTION } from '@/utils/constants';
import { Metadata, Viewport } from 'next';
import AppProvider from './_components/AppProvider';
import GoogleAnalytics from './_components/GoogleAnalytics';

export const metadata: Metadata = {
	title: 'Plex rewind',
	description: META_DESCRIPTION,
};

export const viewport: Viewport = {
	themeColor: '#312e81',
};

type Props = {
	children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
	return (
		<html lang='en'>
			<body className='min-height-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-indigo-900 text-white'>
				{googleAnalyticsId && <GoogleAnalytics id={googleAnalyticsId} />}

				<AppProvider>{children}</AppProvider>
			</body>
		</html>
	);
}

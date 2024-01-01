import { AuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import qs from 'qs';
import { parseStringPromise } from 'xml2js';
import {
	PLEX_API_ENDPOINT,
	PLEX_CLIENT_IDENTIFIER,
	PLEX_CLIENT_NAME,
} from './constants';
import fetchTautulli from './fetchTautulli';
import { ExtendedUser } from './types';

export const authOptions: AuthOptions = {
	providers: [
		CredentialsProvider({
			id: 'plex',
			name: 'Plex',
			credentials: {
				authToken: {
					label: 'authToken',
					type: 'string',
				},
			},
			async authorize(credentials) {
				if (!credentials) {
					return null;
				}

				const { authToken } = credentials;

				try {
					const res = await fetch(`${PLEX_API_ENDPOINT}/user`, {
						headers: {
							'X-Plex-Token': authToken,
						},
					});

					if (!res.ok) {
						throw new Error(
							`Failed to fetch user: ${res.status} ${res.statusText}`,
						);
					}

					const xmlData = await res.text();
					const jsonData = await parseStringPromise(xmlData);
					const data = jsonData.user.$;
					const { title, id, thumb, email } = data;
					const userData = {
						id: id,
						name: title,
						email: email,
						image: thumb,
					};

					if (res.ok && userData) {
						const checkUser = await fetchTautulli<{ email: string }>(
							'get_user',
							{
								user_id: userData.id,
							},
						);

						const userExists =
							checkUser.response?.data?.email === userData.email;

						if (userExists) {
							return userData;
						} else {
							throw new Error('User does not belong to this server!');
						}
					}

					return null;
				} catch (error) {
					console.error('Error getting Plex user:', error);
					throw error;
				}
			},
		}),
	],
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/',
	},
	callbacks: {
		async session({ session, token }: { session: Session; token: JWT }) {
			const extendedSession = session as Session & { user: ExtendedUser };

			if (extendedSession.user) {
				extendedSession.user.id = token.sub as string;
			}

			return extendedSession;
		},
		async jwt({ token, user }: { token: JWT; user: User }) {
			if (user) {
				token.sub = user.id;
			}
			return token;
		},
	},
};

type PlexPinResponse = {
	id: number;
	code: string;
};

async function fetchPlexPins(): Promise<PlexPinResponse> {
	try {
		const res = await fetch(`${PLEX_API_ENDPOINT}/pins`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				strong: 'true',
				'X-Plex-Product': PLEX_CLIENT_NAME,
				'X-Plex-Client-Identifier': PLEX_CLIENT_IDENTIFIER,
			}),
		});

		if (!res.ok) {
			throw new Error(
				`Plex PIN generation failed: ${res.status} ${res.statusText}`,
			);
		}

		return res.json();
	} catch (error) {
		console.error('Error generating Plex PIN:', error);
		throw error;
	}
}

export async function createPlexAuthUrl() {
	const { id, code } = await fetchPlexPins();
	const forwardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}?plexPinId=${id}`;

	if (!forwardUrl) {
		throw new Error('Base url is not configured!');
	}

	const authAppUrl =
		'https://app.plex.tv/auth#?' +
		qs.stringify({
			clientID: PLEX_CLIENT_IDENTIFIER,
			code,
			forwardUrl,
			context: {
				device: {
					product: PLEX_CLIENT_NAME,
				},
			},
		});

	return authAppUrl;
}

export async function getPlexAuthToken(pinId: string) {
	try {
		const res = await fetch(`${PLEX_API_ENDPOINT}/pins/${pinId}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'X-Plex-Client-Identifier': PLEX_CLIENT_IDENTIFIER,
			},
		});

		if (!res.ok) {
			throw new Error(
				`Getting Plex auth token failed: ${res.status} ${res.statusText}`,
			);
		}

		const data = await res.json();

		return data.authToken;
	} catch (error) {
		console.error('Error getting Plex auth token:', error);
	}
}

export async function verifyPlexAuthToken(authToken: string) {
	try {
		const res = await fetch(`${PLEX_API_ENDPOINT}/user`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				strong: 'true',
				'X-Plex-Product': PLEX_CLIENT_NAME,
				'X-Plex-Client-Identifier': PLEX_CLIENT_IDENTIFIER,
				'X-Plex-Token': authToken,
			}),
		});

		if (!res.ok) {
			throw new Error(
				`Plex auth token verification failed: ${res.status} ${res.statusText}`,
			);
		}

		if (res.status === 401) {
			return false;
		} else if (res.status === 200) {
			return true;
		}
	} catch (error) {
		console.error('Error verifying Plex auth token:', error);
	}
}

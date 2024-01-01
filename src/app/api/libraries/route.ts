import { getLibraries } from '@/utils/fetchTautulli';

export async function GET() {
	const libraries = await getLibraries();

	return Response.json(libraries);
}

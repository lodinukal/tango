import { PUBLIC_ROOT } from '$env/static/public';
import { error, RequestHandler } from '@sveltejs/kit';

async function getGistTextContent(gistId: string, file: string): Promise<string> {
	const data = await fetch('https://api.github.com/gists/' + gistId);
	return (await data.json()).files[file].content;
}

export const GET: RequestHandler = async function ({ url }) {
	const query = url.searchParams.get('resource');

	if (!query) {
		error(400, 'No resource provided');
	}

	const res = await getGistTextContent(PUBLIC_ROOT, query + ".json");
	return new Response(res, { headers: { 'Content-Type': 'application/json' } });
}

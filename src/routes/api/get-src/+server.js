import { PUBLIC_ROOT } from '$env/static/public';
import { error } from '@sveltejs/kit';

/**
 * 
 * @param {string} gistId 
 * @param {string} file
 * @returns {Promise<any>}
 */
async function getGistTextContent(gistId, file) {
    const data = await fetch('https://api.github.com/gists/' + gistId);
    return (await data.json()).files[file].content;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const query = url.searchParams.get('resource');

	if (!query) {
		error(400, 'No resource provided');
	}

    const res = await getGistTextContent(PUBLIC_ROOT, query + ".json");
	return new Response(res, { headers: { 'Content-Type': 'application/json' } });
}

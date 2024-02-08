
import { FORVO_API } from '$env/static/private';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const query = url.searchParams.get('word');
    
    if (!query) {
        error(400, 'No word provided');
    }

    const res = await fetch(`https://apifree.forvo.com/key/${FORVO_API}/format/json/action/word-pronunciations/word/${query}/language/ja`);
    const got = await res.json();
    return new Response(JSON.stringify(got), { headers: { 'Content-Type': 'application/json' } });
}
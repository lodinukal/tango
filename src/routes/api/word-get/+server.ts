import { RequestHandler } from '@sveltejs/kit';
import { parseHTML } from 'linkedom';

function utf8_decode(a: string) {
	var b = [],
		c = 0,
		d = 0,
		e = 0,
		f = 0,
		g = 0;
	for (a += ''; c < a.length;)
		(e = a.charCodeAt(c)),
			128 > e
				? ((b[d++] = String.fromCharCode(e)), c++)
				: e > 191 && 224 > e
					? ((f = a.charCodeAt(c + 1)),
						(b[d++] = String.fromCharCode(((31 & e) << 6) | (63 & f))),
						(c += 2))
					: ((f = a.charCodeAt(c + 1)),
						(g = a.charCodeAt(c + 2)),
						(b[d++] = String.fromCharCode(((15 & e) << 12) | ((63 & f) << 6) | (63 & g))),
						(c += 3));
	return b.join('');
}

function base64_decode(a: string) {
	var b,
		c,
		d,
		e,
		f,
		g,
		h,
		i,
		j = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
		k = 0,
		ac = 0,
		l = '',
		m = [];
	if (!a) return a;
	a += '';
	do
		(e = j.indexOf(a.charAt(k++))),
			(f = j.indexOf(a.charAt(k++))),
			(g = j.indexOf(a.charAt(k++))),
			(h = j.indexOf(a.charAt(k++))),
			(i = (e << 18) | (f << 12) | (g << 6) | h),
			(b = (i >> 16) & 255),
			(c = (i >> 8) & 255),
			(d = 255 & i),
			64 == g
				? (m[ac++] = String.fromCharCode(b))
				: 64 == h
					? (m[ac++] = String.fromCharCode(b, c))
					: (m[ac++] = String.fromCharCode(b, c, d));
	while (k < a.length);
	return (l = m.join('')), (l = utf8_decode(l));
}

function getjp(falsedoc: Document) {
	const start = 'https://audio12.forvo.com/mp3/';
	const re = /Play\([0-9]*,'([a-zA-Z0-9=]*)'/;
	let jpsection = falsedoc.getElementById('pronunciations-list-ja');
	if (jpsection == null) {
		return [];
	}
	let ox = jpsection.getElementsByClassName('play');
	interface Result {
		name: string;
		path: string;
	}
	var children: Array<Result> = [];
	for (var i in ox) {
		let x = ox[i];
		let m: Array<string> = JSON.parse(JSON.stringify(x));
		const use_index = m.findIndex((x) => x == 'onclick') + 1;
		if (m[use_index]) {
			const found = m[use_index].match(re);
			if (found) {
				children.push({ name: found[1], path: start + base64_decode(found[1]) });
			}
		}
	}
	return children;
}

export const GET: RequestHandler = async ({ url }) => {
	const word = url.searchParams.get('word');
	const api = `https://forvo.com/word/${word}/`;
	const response = await fetch(api);
	if (!response.ok) {
		console.log(`Could not get ${word}: ${response.status}`);
		return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
	}

	const res = getjp(parseHTML(await response.text()).document);
	return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
}

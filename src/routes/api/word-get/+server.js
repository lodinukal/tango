import { FORVO_API } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { Json } from 'carbon-icons-svelte';
import { HTMLButtonElement, HTMLDivElement, parseHTML } from 'linkedom';

// export async function GET({ url }) {
//     const query = url.searchParams.get('word');

//     if (!query) {
//         error(400, 'No word provided');
//     }

//     const res = await fetch(`https://apifree.forvo.com/key/${FORVO_API}/format/json/action/word-pronunciations/word/${query}/language/ja`);
//     const got = await res.json();
//     return new Response(JSON.stringify(got), { headers: { 'Content-Type': 'application/json' } });
// }
/**
 *
 * @param {string} a
 * @returns
 */
function utf8_decode(a) {
	var b = [],
		c = 0,
		d = 0,
		e = 0,
		f = 0,
		g = 0;
	for (a += ''; c < a.length; )
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

function base64_decode(a) {
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

var print = function (o, maxLevel, level) {
	if (typeof level == 'undefined') {
		level = 0;
	}
	if (typeof maxlevel == 'undefined') {
		maxLevel = 0;
	}

	var str = '';
	// Remove this if you don't want the pre tag, but make sure to remove
	// the close pre tag on the bottom as well
	if (level == 0) {
		str = '<pre>'; // can also be <pre>
	}

	var levelStr = '<br>';
	for (var x = 0; x < level; x++) {
		levelStr += '    '; // all those spaces only work with <pre>
	}

	if (maxLevel != 0 && level >= maxLevel) {
		str += levelStr + '...<br>';
		return str;
	}

	for (var p in o) {
		switch (typeof o[p]) {
			case 'string':
			case 'number': // .tostring() gets automatically applied
			case 'boolean': // ditto
				str += levelStr + p + ': ' + o[p] + ' <br>';
				break;

			case 'object': // this is where we become recursive
			default:
				str += levelStr + p + ': [ <br>' + print(o[p], maxLevel, level + 1) + levelStr + ']</br>';
				break;
		}
	}

	// Remove this if you don't want the pre tag, but make sure to remove
	// the open pre tag on the top as well
	if (level == 0) {
		str += '</pre>'; // also can be </pre>
	}
	return str;
};

/**
 *
 * @param {Document} falsedoc
 * @returns
 */
function getjp(falsedoc) {
	const start = 'https://audio12.forvo.com/mp3/';
	const re = /Play\([0-9]*,'([a-zA-Z0-9=]*)'/;
	let jpsection = falsedoc.getElementById('pronunciations-list-ja');
	if (jpsection == null) {
		return [];
	}
	let ox = jpsection.getElementsByClassName('play');
	// console.log(jpsection.children.length);
	/**
	 * @typedef Result
	 * @prop {string} name
	 * @prop {string} path
	 */
	/**
	 * @type {Array<Result>}
	 */
	var children = [];
	for (var i in ox) {
		let x = ox[i];
		/** @type {Array<string>} */
		let m = JSON.parse(JSON.stringify(x));
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

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const word = url.searchParams.get('word');
	const api = `https://forvo.com/word/${word}/`;
	const response = await fetch(api);
	if (!response.ok) {
		return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
	}

	const res = getjp(parseHTML(await response.text()).document);
	return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
}

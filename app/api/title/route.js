
// Title generation API (fast & cheap)
// /app/api/title/route.js
import { GoogleGenAI } from '@google/genai';

export async function POST(req) {
	try {
		const body = await req.json().catch(() => ({}));
		const firstMessage = (body?.message || '').toString().trim();

		if (process.env.NODE_ENV === 'development') {
			return new Response(JSON.stringify({ title: firstMessage }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}


		if (!firstMessage) {
			return new Response(JSON.stringify({ error: 'First message is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const apiKey = body.apiKey || '';
		if (!apiKey) {
			// Do not attempt unauthenticated call; fallback in client will handle it.
			return new Response(JSON.stringify({ error: 'API key missing for title' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const ai = new GoogleGenAI({ apiKey });
		const model = body.model || 'gemini-2.5-flash-lite'; // fast, cheap
		const systemInstruction =
			'You are a title generator. Respond with a concise, 4-8 word title for the user message. No punctuation, no quotes.';

		const response = await ai.models.generateContent({
			model,
			contents: [{ role: 'user', parts: [{ text: firstMessage }] }],
			config: { systemInstruction },
		});

		let title = (response?.text || '').toString().trim();
		if (!title) {
			return new Response(JSON.stringify({ error: 'No title returned from model' }), {
				status: 502,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Keep it short and single line
		title = title = title.split('\n')[0].replace(/^["'\[] | ["'\]]$/g, '').slice(0, 60).trim();

		return new Response(JSON.stringify({ title }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		// if (err?.message === 'exception TypeError: fetch failed sending request') {
		// 	return new Response(JSON.stringify({ title: 'Testing' }), {
		// 		status: 200,
		// 		headers: { 'Content-Type': 'application/json' },
		// 	});
		// }
		return new Response(
			JSON.stringify({ error: 'Internal error', details: String(err && err.message ? err.message : err) }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}
}
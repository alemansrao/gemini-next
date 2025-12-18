
// Chat API using @google/genai
// /app/api/chat/route.js
import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
	try {
		const apiKey = request.headers.get('x-gemini-api-key');
		if (!apiKey) {
			return Response.json({ error: 'API key missing' }, { status: 401 });
		}

		const body = await request.json().catch(() => null);
		if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
			return Response.json({ error: 'messages must be a non-empty array' }, { status: 400 });
		}
		console.log('Received model from browser:', body.model);
		const modelName = String(body.model || 'gemini-2.5-flash');
		const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt.trim() : '';

		const ai = new GoogleGenAI({ apiKey });

		// Prepare history (role: 'user' | 'model')
		const history = body.messages.map((m) => ({
			role: m.role,
			parts: [{ text: String(m.content ?? '') }],
		}));

		// Create chat session (optionally attach system instruction through config)
		console.log('Creating chat session with model:', modelName);
		const chat = ai.chats.create({
			model: modelName,
			config: systemPrompt ? { systemInstruction: systemPrompt } : undefined,
			history,
		});

		// Optional fake delay for demo parity
		if (process.env.ENVIRONMENT) {
			await new Promise((res) => setTimeout(res, 800));
		}

		// Use the last user message as the "sendMessage" payload
		const last = body.messages[body.messages.length - 1];
		const lastText = String(last?.content ?? '').trim();
		if (!lastText) {
			return Response.json({ error: 'Last message content is empty' }, { status: 400 });
		}

		const response = await chat.sendMessage({ message: lastText });
		const reply = (response?.text || '').toString();

		if (!reply) {
			return Response.json({ error: 'Empty response from model' }, { status: 502 });
		}

		return Response.json({ reply });
	} catch (err) {
		console.error('Internal error:', err);
		if (err?.message === 'exception TypeError: fetch failed sending request') {
			return new Response(JSON.stringify({ reply: 'Testing reply' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		else if (err?.message === 'The model is overloaded. Please try again later.') {
			return new Response(JSON.stringify({ reply: 'Model Overloaded' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return Response.json(
			{
				error: 'Internal server error', details: String(err && err.message ? err.message : err)
			},
			{ status: 500 },
		);
	}
}

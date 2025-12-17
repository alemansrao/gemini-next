import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const GEMINI_API_KEY = request.headers.get("x-gemini-api-key");
    if (!GEMINI_API_KEY) {
      return Response.json({ error: "API key missing" }, { status: 401 });
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }

    const modelName = request.headers.get("x-gemini-model") || "gemini-2.5-flash";

    // Initialize SDK
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Create chat session
    const chat = ai.chats.create({
      model: modelName,
      history: messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    // Send last message
    const lastMessage = messages[messages.length - 1].content;
    const response = await chat.sendMessage({ message: lastMessage });

    return Response.json({ reply: response.text });
  } catch (err) {
    console.error("Internal error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

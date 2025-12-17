import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  const maskSecret = (v = "", visibleStart = 4, visibleEnd = 4) => {
    if (!v || typeof v !== "string") return v;
    if (v.length <= visibleStart + visibleEnd) return "[MASKED]";
    return v.slice(0, visibleStart) + "..." + v.slice(-visibleEnd);
  };

  const startTime = Date.now();

  try {
    // Masked header logging
    const headersObj = {};
    for (const [k, v] of request.headers.entries()) {
      const key = k.toLowerCase();
      if (key === "x-gemini-api-key" || key === "authorization") {
        headersObj[k] = maskSecret(v);
      } else {
        headersObj[k] = v;
      }
    }

    // Parse body
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { messages } = body || {};
    const GEMINI_API_KEY = request.headers.get("x-gemini-api-key");
    if (!GEMINI_API_KEY) {
      return Response.json({ error: "API key missing" }, { status: 401 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }

    // Convert messages to Gemini format
    const contents = messages.map((msg, idx) => {
      if (!msg || typeof msg !== "object") {
        throw new Error(`Invalid message at index ${idx}`);
      }
      return {
        role: msg.role,
        parts: [{ text: msg.content }],
      };
    });

    const model = request.headers.get("x-gemini-model") || "gemini-2.5-flash";

    // Use the official library instead of raw fetch
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    let reply;
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      reply = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text
        || "No response from model.";
    } catch (err) {
      return Response.json({ error: "Gemini API call failed", details: err.message }, { status: 502 });
    }

    const durationMs = Date.now() - startTime;

    return Response.json({
      reply,
      meta: {
        model,
        durationMs,
        headers: headersObj,
      },
    });
  } catch (err) {
    return Response.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}

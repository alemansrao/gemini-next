import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function GET(request) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hi, What is 2+2?",
    });

    // Extract common response shapes
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response?.text ||
      "No response from model.";

    return new Response(text, { status: 200 });
  } catch (err) {
    console.error("Demo GET handler error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export async function POST(req) {
  // Read incoming body  { message }
  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const firstMessage = body.message;


  if (!firstMessage) {
    return new Response(JSON.stringify({ error: "First message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt =
    "You are to act as a generator for chat titles. The user will send a query - you must generate a title for the chat based on it. Only reply with the short title, nothing else.";

  const payload = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: firstMessage },
    ],
  };

  try {
    const chatUrl = new URL("/api/chat", req.url).toString();
    const headers = { "Content-Type": "application/json" };

    // forward apiKey if provided (optional)
    if (body.apiKey) {
      headers["x-gemini-api-key"] = body.apiKey;
    };

    headers['x-gemini-model'] = 'gemini-2.5-flash-lite';
    const res = await fetch(chatUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Upstream chat API error", details: txt }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json().catch(() => null);

    // Try common response shapes to extract assistant text
    let assistantReply = data.reply || "New Chat";

    if (!assistantReply && typeof data === "string") assistantReply = data;

    if (!assistantReply) {
      return new Response(JSON.stringify({ error: "No title returned from chat API" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    assistantReply = String(assistantReply).trim().split("\n")[0].replace(/^["']|["']$/g, "").trim();

    return new Response(JSON.stringify({ title: assistantReply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

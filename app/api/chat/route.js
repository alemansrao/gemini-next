export async function POST(request) {
  // Enhanced logging, error handling, and secret masking

  const maskSecret = (v = "", visibleStart = 4, visibleEnd = 4) => {
    if (!v || typeof v !== "string") return v;
    if (v.length <= visibleStart + visibleEnd) return "[MASKED]";
    return v.slice(0, visibleStart) + "..." + v.slice(-visibleEnd);
  };

  const now = () => new Date().toISOString();


  const startTime = Date.now();

  // Clone request early so we can read headers/body safely for logging
  try {
    // Log headers with masking for sensitive keys
    const headersObj = {};
    for (const [k, v] of request.headers.entries()) {
      const key = k.toLowerCase();
      if (key === "x-gemini-api-key" || key === "authorization") {
        headersObj[k] = maskSecret(v);
      } else {
        headersObj[k] = v;
      }
    }


    let body;
    try {
      // attempt to parse JSON body; record raw text if parse fails
      const text = await request.text();
      try {
        body = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        // Return client error for invalid JSON
        return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
      }
    } catch (readErr) {
      return Response.json({ error: "Failed to read request body" }, { status: 400 });
    }


    const { messages } = body || {};

    const GEMINI_API_KEY = request.headers.get("x-gemini-api-key");
    if (!GEMINI_API_KEY) {
      return Response.json({ error: "API key missing" }, { status: 401 });
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }

    // Convert messages to Gemini REST format
    let contents;
    try {
      contents = messages.map((msg, idx) => {
        // Basic validation for each message
        if (!msg || typeof msg !== "object") {
          throw new Error(`Invalid message at index ${idx}`);
        }
        return {
          role: msg.role,
          parts: [{ text: msg.content }],
        };
      });
    } catch (convErr) {
      return Response.json({ error: "Invalid message format" }, { status: 400 });
    }


    //if headers have model then set model to that
    const model = request.headers.get("x-gemini-model") || "gemini-2.5-flash";

    const fetchUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
    const fetchBody = { contents };

    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(fetchBody),
    };

    // Log outbound request details, but mask API key
    const loggedFetchOptions = {
      method: fetchOptions.method,
      headers: {
        ...fetchOptions.headers,
        "x-goog-api-key": maskSecret(fetchOptions.headers["x-goog-api-key"]),
      },
      body: JSON.stringify(fetchBody, null, 2).slice(0, 2000),
    };

    let response;
    let responseText = "";
    try {











      //add fake delay of 5seconds
      if (process.env.ENVIRONMENT == 'DEV') {
        if (request.headers.get("x-gemini-model")) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
        else {

          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        return Response.json({ reply: "Reply from the API" }, { status: 200 });
      }














      //log the request
      console.log(`[${now()}] Request to Gemini API: ${JSON.stringify(loggedFetchOptions, null, 2)}`);



      response = await fetch(fetchUrl, fetchOptions);
      // Read response as text first to ensure we can log raw body on errors or non-JSON
      responseText = await response.text();
    } catch (networkErr) {
      const durationMs = Date.now() - startTime;
      return Response.json({ error: "Network error when contacting Gemini API" }, { status: 502 });
    }

    const durationMs = Date.now() - startTime;


    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseErr) {

      return Response.json({ error: "Invalid JSON from Gemini API" }, { status: 502 });
    }

    if (!response.ok) {

      return Response.json(
        { error: data.error?.message || "Error from Gemini API", details: data },
        { status: 500 }
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from model.";



    return Response.json({ reply });
  } catch (err) {

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

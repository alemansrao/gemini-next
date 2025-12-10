export async function POST(request) {
  // Enhanced logging, error handling, and secret masking

  const maskSecret = (v = "", visibleStart = 4, visibleEnd = 4) => {
    if (!v || typeof v !== "string") return v;
    if (v.length <= visibleStart + visibleEnd) return "[MASKED]";
    return v.slice(0, visibleStart) + "..." + v.slice(-visibleEnd);
  };

  const now = () => new Date().toISOString();

  const log = (level, msg, obj) => {
    // Structured, pretty logs for debugging; keep secrets masked in logged objects
    try {
      const payload = {
        timestamp: now(),
        level,
        message: msg,
        ...obj,
      };
      // Use console.log so logs appear in typical hosting environments
      console.log(JSON.stringify(payload, null, 2));
    } catch (e) {
      // Fallback minimal log if stringify fails
      console.error(`[${now()}] ${level} ${msg} - (failed to serialize log)`, e);
    }
  };

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

    log("INFO", "Incoming request received", {
      method: request.method,
      url: request.url || "N/A",
      headers: headersObj,
    });

    let body;
    try {
      // attempt to parse JSON body; record raw text if parse fails
      const text = await request.text();
      try {
        body = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        log("WARN", "Failed to parse JSON body; preserving raw text", {
          rawBody: text.slice(0, 2000), // limit length
          parseError: parseErr.message,
        });
        // Return client error for invalid JSON
        return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
      }
    } catch (readErr) {
      log("ERROR", "Failed to read request body", { error: readErr.stack || readErr.message });
      return Response.json({ error: "Failed to read request body" }, { status: 400 });
    }

    log("DEBUG", "Parsed request body", { body });

    const { messages } = body || {};

    const GEMINI_API_KEY = request.headers.get("x-gemini-api-key");

    if (!GEMINI_API_KEY) {
      log("ERROR", "Missing GEMINI API key header", {
        hint: "Ensure client sends x-gemini-api-key header",
      });
      return Response.json({ error: "API key missing" }, { status: 401 });
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      log("ERROR", "Invalid or empty messages array", { messages });
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
      log("ERROR", "Error converting messages to Gemini format", { error: convErr.message });
      return Response.json({ error: "Invalid message format" }, { status: 400 });
    }

    log("DEBUG", "Transformed contents for Gemini API", { contents });

    const fetchUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
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
    log("INFO", "Outgoing request to Gemini API", { url: fetchUrl, request: loggedFetchOptions });

    let response;
    let responseText = "";
    try {
      response = await fetch(fetchUrl, fetchOptions);
      // Read response as text first to ensure we can log raw body on errors or non-JSON
      responseText = await response.text();
    } catch (networkErr) {
      const durationMs = Date.now() - startTime;
      log("ERROR", "Network error while calling Gemini API", {
        error: networkErr.stack || networkErr.message,
        durationMs,
        fetchUrl,
      });
      return Response.json({ error: "Network error when contacting Gemini API" }, { status: 502 });
    }

    const durationMs = Date.now() - startTime;
    log("INFO", "Received response from Gemini API", {
      status: response.status,
      statusText: response.statusText,
      durationMs,
      responseHeaders: Object.fromEntries(response.headers.entries ? response.headers.entries() : []),
      responseBodyPreview: responseText.slice(0, 2000),
    });

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseErr) {
      log("ERROR", "Failed to parse JSON from Gemini response", {
        parseError: parseErr.message,
        rawResponse: responseText.slice(0, 2000),
      });
      return Response.json({ error: "Invalid JSON from Gemini API" }, { status: 502 });
    }

    if (!response.ok) {
      log("ERROR", "Gemini API returned non-OK status", {
        status: response.status,
        statusText: response.statusText,
        errorBody: data,
      });
      return Response.json(
        { error: data.error?.message || "Error from Gemini API", details: data },
        { status: 500 }
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from model.";

    log("INFO", "Successfully generated reply", {
      replyPreview: (typeof reply === "string" && reply.slice(0, 2000)) || reply,
      durationMs,
    });

    return Response.json({ reply });
  } catch (err) {
    // Catch-all unexpected server errors
    log("FATAL", "Unhandled server error in POST /api/chat", {
      error: err.stack || err.message,
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

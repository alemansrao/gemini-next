export async function POST(request) {
  try {
    const { messages } = await request.json();
    //get api from request x-gemini-api-key

    const GEMINI_API_KEY = request.headers.get("x-gemini-api-key");


    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY in environment.");
      return Response.json(
        { error: "API is not receiving the API key" },
        { status: 500 }
      );
    }

    // Convert your simple messages array → Gemini REST format
    const contents = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));



    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
          },
          body: JSON.stringify({ contents })
        }
      );
    } catch (error) {
      return Response.json(
        { error: "Error - Failed to Fetch" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("2Gemini API Error:", data);
      return Response.json(
        { error: data.error?.message || "Error from Gemini API" },
        { status: 500 }
      );
    }
    // const data = {
    //   "candidates": [
    //     {
    //       "content": {
    //         "parts": [
    //           {
    //             "text": "Hello, world!"
    //           }
    //         ]
    //       }
    //     }
    //   ]
    // }

    // add a 2 second artificial delay before replying
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Dummy reply
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from model.";

    return Response.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    return Response.json(
      { error: "Failed to fetch response" },
      { status: 500 }
    );
  }
}

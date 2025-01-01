// server.js (Node.js Backend)
const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle speech input and communicate with Groq API
app.post("/send_to_groq", async (req, res) => {
  const apiKey = "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"; // Groq API Key
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  const { speech } = req.body; // Get speech input from the request body

  if (!speech) {
    return res.status(400).json({ error: "No speech provided" });
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: speech },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const aiResponse =
      response.data.choices[0]?.message?.content || "No response from Groq";
    return res.json({ ai_response: aiResponse });
  } catch (error) {
    console.error("Error communicating with Groq:", error);
    return res.status(500).json({ error: "Error communicating with Groq" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

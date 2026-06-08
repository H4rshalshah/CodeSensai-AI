import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "codellama";

async function reviewWithGroq(prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Groq API failed");
  }

  return data?.choices?.[0]?.message?.content?.trim();
}

async function reviewWithOllama(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Ollama API failed");
  }

  return data?.response?.trim();
}

app.post("/api/review", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      const groqText = await reviewWithGroq(prompt);

      if (groqText) {
        return res.json({
          text: groqText,
          provider: "groq",
        });
      }

      throw new Error("Groq returned empty response");
    } catch (groqError) {
      console.log("Groq failed, trying Ollama:", groqError.message);

      const ollamaText = await reviewWithOllama(prompt);

      if (!ollamaText) {
        throw new Error("Ollama returned empty response");
      }

      return res.json({
        text: ollamaText,
        provider: "ollama",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error:
        error.message ||
        "Both Groq and Ollama failed. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CodeSensai backend running on http://localhost:${PORT}`);
});
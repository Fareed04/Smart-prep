import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: key || undefined,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/study-tips", async (req, res) => {
    try {
      const { userProfile, sessions } = req.body;
      
      const prompt = `Analyze this user's quiz sessions and provide 3 short, actionable study tips or a focused practice session. Focus on their weakest categories in the given sessions. Format as Markdown. Ensure the response is concise and helpful.

Profile: ${JSON.stringify(userProfile)}
Recent Sessions: ${JSON.stringify(sessions)}

Provide tailored advice:`;

      const ai = getAIClient();
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });
        responseText = response.text || "";
      } catch (firstErr) {
        console.warn("Retrying with gemini-flash-latest...", firstErr);
        const response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: prompt,
        });
        responseText = response.text || "";
      }

      res.json({ tips: responseText });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate tips." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

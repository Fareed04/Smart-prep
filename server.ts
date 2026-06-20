import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: prompt,
      });

      let fullOutput = "";
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          const textContent = step.content?.find(c => c.type === 'text');
          if (textContent && textContent.text) {
            fullOutput += textContent.text;
          }
        }
      }

      res.json({ tips: fullOutput });
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

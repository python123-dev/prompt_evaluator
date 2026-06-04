import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for evaluating prompt
  app.post("/api/evaluate-prompt", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Evaluate the following prompt based on clarity, specificity, and expected relevance.
Prompt to evaluate: "${prompt}"

Provide your evaluation in a structured JSON format with the following:
1. Overall score from 1 to 10.
2. Individual scores from 1 to 10 for: Clarity, Specificity, Expected Relevance.
3. Actionable feedback on how to improve it further to get a better result from an AI.
4. A re-written, optimized version of the prompt.
5. The prompt type, categorized as one of: 'Zero-Shot', 'Few-Shot/One-Shot', 'Role/Persona-Based', 'Chain-of-Thought', or 'Generic/Direct Instruction'.
`,
        config: {
          systemInstruction: "You are an expert AI prompt engineer who evaluates prompts.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: {
                type: Type.NUMBER,
                description: "Overall score from 1 to 10.",
              },
              clarityScore: {
                type: Type.NUMBER,
                description: "Clarity score from 1 to 10.",
              },
              specificityScore: {
                type: Type.NUMBER,
                description: "Specificity score from 1 to 10.",
              },
              relevanceScore: {
                type: Type.NUMBER,
                description: "Expected relevance score from 1 to 10.",
              },
              feedback: {
                type: Type.STRING,
                description: "Actionable feedback on how to improve it.",
              },
              optimizedPrompt: {
                type: Type.STRING,
                description: "A re-written, optimized version of the prompt.",
              },
              promptType: {
                type: Type.STRING,
                description: "Categorize the prompt type.",
                enum: [
                  "Zero-Shot",
                  "Few-Shot/One-Shot",
                  "Role/Persona-Based",
                  "Chain-of-Thought",
                  "Generic/Direct Instruction",
                ],
              },
            },
            required: [
              "overallScore",
              "clarityScore",
              "specificityScore",
              "relevanceScore",
              "feedback",
              "optimizedPrompt",
              "promptType",
            ],
          },
        },
      });

      let responseText = response.text;
      if (!responseText) {
        throw new Error("No response generated from the model.");
      }
      
      const evaluation = JSON.parse(responseText.trim());

      res.json(evaluation);
    } catch (error: any) {
      console.error("Error evaluating prompt:", error);
      res.status(500).json({ error: "Failed to evaluate prompt. Please check your API key and try again." });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

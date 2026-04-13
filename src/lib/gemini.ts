import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";
import * as mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PROMPT = `Act as a Senior Data Scientist and GMAT Tutor.
Data Processing: Analyze the uploaded files. Extract all unique questions. 

CRITICAL RULES:
1. If a question relies on an image, graph, or diagram that is not visible in the text, SKIP IT entirely. Do not include it.
2. For fractions and math equations, format them clearly using plain text or simple markdown (e.g., 1/2 or a/b). Ensure the question is properly structured and readable.
3. For verbal questions, ALWAYS include the instruction (e.g., 'Choose the antonym for the following word:', 'Select the synonym:'). If the original text lacks instructions, infer them from the options and add them explicitly to the question text.

Categorize each question strictly into one of the following categories:
- Numerical Reasoning
- Data Analysis
- Reading Comprehension
- Sentence Correction
- Antonyms/Synonyms
- Critical Reasoning
- Current Affairs

Logic Check: If a question is about Nigerian politics or economics, compare it against 2026 facts. If the answer in the PDF is outdated, update it and provide a "Context Note" in the explanation.
Explanation Style: Use "First Principles" thinking. Explain why the wrong options are wrong. Provide a "Work Smarter" explanation (shortcuts, GMAT logic, or "Elimination" tactics).

Convert these files into a JSON list of questions.`;

async function processWithGemini(parts: any[]): Promise<any[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [...parts, { text: PROMPT }],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "The question text, including explicit instructions for verbal questions" },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of multiple choice options" },
            answer: { type: Type.STRING, description: "The correct option exactly as it appears in the options list" },
            explanation: { type: Type.STRING, description: "Detailed explanation including 'Work Smarter' tips and context notes" },
            category: { type: Type.STRING, description: "Strictly one of: Numerical Reasoning, Data Analysis, Reading Comprehension, Sentence Correction, Antonyms/Synonyms, Critical Reasoning, Current Affairs" },
          },
          required: ["question", "options", "answer", "explanation", "category"],
        },
      },
    },
  });

  const jsonStr = response.text?.trim() || "[]";
  return JSON.parse(jsonStr);
}

export async function extractQuestionsFromFiles(files: File[], onProgress?: (progress: number) => void): Promise<Question[]> {
  const allQuestions: Question[] = [];
  const batchSize = 3; // Small batch size to avoid payload limits
  
  // Filter out empty files which can cause "The document has no pages" errors
  const validFiles = files.filter(f => f.size > 0);
  
  if (validFiles.length === 0) {
    console.warn("No valid files to process (files might be empty).");
    return [];
  }
  
  for (let i = 0; i < validFiles.length; i += batchSize) {
    const batch = validFiles.slice(i, i + batchSize);
    
    const parts = await Promise.all(
      batch.map(async (file) => {
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.docx')) {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return { text: result.value || "Empty document" };
          } catch (err) {
            console.error("Error parsing docx", err);
            return { text: "Error reading document" };
          }
        }

        if (fileName.endsWith('.txt')) {
          const text = await file.text();
          return { text: text || "Empty document" };
        }

        // Gemini doesn't support .doc natively, and mammoth doesn't either.
        // We will try to extract text directly, which might have artifacts, but prevents "no pages" error.
        if (fileName.endsWith('.doc')) {
          try {
            const text = await file.text();
            return { text: text.substring(0, 5000) || "Empty document" };
          } catch (err) {
            return { text: "Error reading .doc file" };
          }
        }

        const base64 = await fileToBase64(file);
        
        // Fallback for missing mime types
        let mimeType = file.type;
        if (!mimeType) {
          if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
          else if (fileName.endsWith('.png')) mimeType = 'image/png';
          else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
          else mimeType = 'text/plain';
        }

        return {
          inlineData: {
            mimeType,
            data: base64.split(",")[1],
          },
        };
      })
    );

    try {
      const parsed = await processWithGemini(parts);
      allQuestions.push(...parsed);
    } catch (e: any) {
      console.error("Failed to process batch", e);
      // If batch fails, try processing files individually to isolate the bad file
      console.log("Retrying files individually...");
      for (const part of parts) {
        try {
          const parsed = await processWithGemini([part]);
          allQuestions.push(...parsed);
        } catch (err) {
          console.error("Failed to process individual file", err);
        }
      }
    }
    
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + batch.length) / validFiles.length) * 100)));
    }
  }

  // Deduplicate based on question text (simple approach)
  const uniqueQuestions = deduplicateQuestions(allQuestions);
  
  // Return the entire pool of unique questions
  return uniqueQuestions.map((q, i) => ({ ...q, id: `pool-${i}` }));
}

export function generateQuizFromPool(pool: Question[]): Question[] {
  // Apply quotas to get exactly 50 questions with the requested breakdown
  const quotas: Record<string, number> = {
    "Numerical Reasoning": 15,
    "Data Analysis": 5,
    "Reading Comprehension": 5,
    "Sentence Correction": 5,
    "Antonyms/Synonyms": 5,
    "Critical Reasoning": 5,
    "Current Affairs": 10,
  };

  const grouped: Record<string, Question[]> = {};
  for (const q of pool) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  const finalQuestions: Question[] = [];
  const remainingPool: Question[] = [];

  for (const [category, quota] of Object.entries(quotas)) {
    const available = grouped[category] || [];
    // Shuffle available questions
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    // Take up to the quota
    finalQuestions.push(...shuffled.slice(0, quota));
    // Keep the rest for filling gaps
    remainingPool.push(...shuffled.slice(quota));
  }

  // If we don't have 50 questions (because some categories were short),
  // fill the remaining spots from the rest of the pool
  if (finalQuestions.length < 50 && remainingPool.length > 0) {
    const needed = 50 - finalQuestions.length;
    const shuffledRemaining = [...remainingPool].sort(() => Math.random() - 0.5);
    finalQuestions.push(...shuffledRemaining.slice(0, needed));
  }

  // Final shuffle of the 50 questions
  const fullyShuffled = [...finalQuestions].sort(() => Math.random() - 0.5);

  // Assign fresh IDs for the quiz session
  return fullyShuffled.map((q, i) => ({ ...q, id: `q-${i}` }));
}

export function deduplicateQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    // Normalize question text for comparison
    const normalized = (q.question || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

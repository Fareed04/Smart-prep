import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionProgress } from "../types";
import * as mammoth from "mammoth";
import { PDFDocument } from "pdf-lib";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMockAssessment(company: string): Promise<Question[]> {
  const prompt = `Generate a realistic, high-quality mock assessment test for ${company}.
If the company is "PwC", specifically emulate the "PwC Cornerstone Assessment Nigeria" which is typically comprised of SHL or Predictive Index style questions encompassing Deductive Reasoning, Inductive Reasoning, Numerical Reasoning, and Work Style Preferences (Situational Judgement).

Create exactly 15 unique questions spread evenly across the following categories based on typical Big 4 testing formats:
- Numerical Reasoning (include data interpretation, percentages, ratios, probability)
- Verbal Reasoning / Reading Comprehension
- Logical / Inductive / Deductive Reasoning
- Situational Judgement / Soft Skills

Make the questions challenging, mimicking real assessment difficulty. Provide 4 or 5 options for each question.
Ensure the final output is a JSON list.`;

  try {
    const apiPromise = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct." },
              category: { type: Type.STRING, description: "One of: Numerical Reasoning, Verbal Reasoning, Logical Reasoning, Situational Judgement" },
            },
            required: ["question", "options", "answer", "explanation", "category"],
          },
        },
      },
    });

    const response = await withTimeout(apiPromise, 180000, "Gemini API timeout while generating mock data");
    const jsonStr = response.text?.trim() || "[]";
    const questions = JSON.parse(jsonStr);
    
    // Add unique IDs
    return questions.map((q: any, i: number) => ({ ...q, id: `mock-${company}-${Date.now()}-${i}`, company }));
  } catch (error) {
    console.error("Error generating mock assessment:", error);
    throw new Error("Failed to generate mock assessment. Please try again.");
  }
}

const PROMPT = `Act as a Senior Data Scientist and GMAT Tutor.
Data Processing: Analyze the uploaded files. Extract unique questions. 

IMPORTANT: Extract a MAXIMUM of 30 high-quality unique questions per file. If the file has more, only take the first 30. This ensures the output does not get cut off.

CRITICAL RULES:
1. If a question relies on a chart, graph, table, or diagram, DO NOT SKIP IT. Instead, meticulously analyze the visual data and convert it into a well-formatted Markdown table or detailed text description. Embed this directly at the beginning of the 'question' text so the user has all the data required to solve it. Only skip pure spatial reasoning questions (e.g., 'which shape comes next') that absolutely cannot be represented as text or tables.
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
- Soft Skills / Situational Judgment

Logic Check: If a question is about Nigerian politics or economics, compare it against 2026 facts. If the answer in the PDF is outdated, update it and provide a "Context Note" in the explanation.
Explanation Style: Use "First Principles" thinking. Explain why the wrong options are wrong. Provide a "Work Smarter" explanation (shortcuts, GMAT logic, or "Elimination" tactics).

Convert these files into a JSON list of questions.`;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.error(`[Timeout] ${message} after ${ms}ms`);
      reject(new Error(message));
    }, ms);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

async function processWithGemini(parts: any[], retryCount = 0): Promise<any[]> {
  const MAX_RETRIES = 3;
  
  try {
    const apiPromise = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [...parts, { text: PROMPT }],
      },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 16384, // Increased to handle more questions
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The question text, including explicit instructions for verbal questions" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of multiple choice options" },
              answer: { type: Type.STRING, description: "The correct option exactly as it appears in the options list" },
              explanation: { type: Type.STRING, description: "Detailed explanation including 'Work Smarter' tips and context notes" },
              category: { type: Type.STRING, description: "Strictly one of: Numerical Reasoning, Data Analysis, Reading Comprehension, Sentence Correction, Antonyms/Synonyms, Critical Reasoning, Current Affairs, Soft Skills / Situational Judgment" },
            },
            required: ["question", "options", "answer", "explanation", "category"],
          },
        },
      },
    });

    const response = await withTimeout(apiPromise, 300000, "Gemini API timeout");
    let jsonStr = response.text?.trim() || "[]";
    
    // Attempt to repair truncated JSON if it looks like an array that didn't close
    if (jsonStr.startsWith('[') && !jsonStr.endsWith(']')) {
      console.warn("[Gemini] Truncated JSON detected. Attempting repair...");
      // Find the last complete object in the array
      const lastObjectEnd = jsonStr.lastIndexOf('}');
      if (lastObjectEnd !== -1) {
        jsonStr = jsonStr.substring(0, lastObjectEnd + 1) + ']';
      } else {
        jsonStr += ']';
      }
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[Gemini] JSON Parse Error after repair attempt:", parseErr);
      console.log("[Gemini] Raw response snippet:", jsonStr.substring(jsonStr.length - 100));
      throw parseErr;
    }
  } catch (err: any) {
    const isQuotaError = err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.status === 429;
    const isNetworkError = err?.message?.includes("Rpc failed") || err?.message?.includes("xhr error") || err?.message?.includes("fetch");
    
    if ((isQuotaError || isNetworkError) && retryCount < MAX_RETRIES) {
      const baseDelay = isQuotaError ? 10000 : 2000; // 10s base for quota errors
      const delay = Math.pow(2, retryCount) * baseDelay + Math.random() * 2000;
      console.log(`${isQuotaError ? 'Quota (429)' : 'Network'} error detected. Retrying in ${Math.round(delay)}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return processWithGemini(parts, retryCount + 1);
    }
    throw err;
  }
}

export async function extractQuestionsFromFiles(
  files: File[], 
  onProgress?: (progress: number, status?: string) => void,
  company?: string
): Promise<Question[]> {
  const allQuestions: Question[] = [];
  const batchSize = 1; // Process one file at a time to avoid payload limits and timeouts
  
  // Filter out empty files and files that are too large for the proxy (approx 15MB limit)
  let validFiles = files.filter(f => {
    if (f.size === 0) return false;
    if (f.size > 15 * 1024 * 1024) {
      console.warn(`File ${f.name} is too large (>15MB) and may fail. Skipping.`);
      return false;
    }
    // Basic check for very small PDFs which are often invalid
    if (f.name.toLowerCase().endsWith('.pdf') && f.size < 100) {
      console.warn(`File ${f.name} is too small to be a valid PDF. Skipping.`);
      return false;
    }
    return true;
  });
  
  if (validFiles.length === 0) {
    if (files.some(f => f.size > 15 * 1024 * 1024)) {
      throw new Error("The files you uploaded are too large (>15MB). Please compress them or split them into smaller parts.");
    }
    console.warn("No valid files to process (files might be empty).");
    return [];
  }

  // Pre-process valid files to split large PDFs
  const expandedFiles: File[] = [];
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        if (onProgress) onProgress(5, `Analyzing PDF structure: ${file.name}...`);
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const totalPages = pdfDoc.getPageCount();
        const MAX_PAGES_PER_CHUNK = 10;

        if (totalPages > MAX_PAGES_PER_CHUNK) {
          console.log(`[Gemini] Splitting ${file.name} (${totalPages} pages) into chunks of ${MAX_PAGES_PER_CHUNK}...`);
          if (onProgress) onProgress(10, `Splitting large PDF: ${file.name} (${totalPages} pages)...`);
          for (let start = 0; start < totalPages; start += MAX_PAGES_PER_CHUNK) {
            try {
              const chunkDoc = await PDFDocument.create();
              const end = Math.min(start + MAX_PAGES_PER_CHUNK, totalPages);
              const pageIndices = Array.from({ length: end - start }, (_, idx) => start + idx);
              const copiedPages = await chunkDoc.copyPages(pdfDoc, pageIndices);
              copiedPages.forEach(p => chunkDoc.addPage(p));
              
              const chunkBytes = await chunkDoc.save();
              const chunkFile = new File([chunkBytes], `${file.name.replace(/\.pdf$/i, '')}_pages_${start + 1}-${end}.pdf`, { type: 'application/pdf' });
              expandedFiles.push(chunkFile);
            } catch (chunkErr) {
              console.error(`[Gemini] Error chunking pages ${start + 1}-${Math.min(start + MAX_PAGES_PER_CHUNK, totalPages)} for ${file.name}:`, chunkErr);
            }
          }
        } else {
          expandedFiles.push(file);
        }
      } catch (err) {
        console.error(`[Gemini] Error loading PDF ${file.name} for chunking:`, err);
        // Fallback to original file if loading fails
        expandedFiles.push(file);
      }
    } else {
      expandedFiles.push(file);
    }
  }
  
  validFiles = expandedFiles;
  
  for (let i = 0; i < validFiles.length; i += batchSize) {
    const batch = validFiles.slice(i, i + batchSize);
    const currentFile = batch[0];
    
    if (onProgress) {
      // Show progress before reading files
      const p = Math.min(90, Math.round((i / validFiles.length) * 100) + 5);
      onProgress(p, `Reading ${currentFile.name}...`);
      // Yield to the browser to allow UI to update before potentially heavy operations
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const parts = await Promise.all(
      batch.map(async (file) => {
        const fileName = file.name.toLowerCase();
        console.log(`[Gemini] Starting processing for: ${fileName} (${(file.size / 1024).toFixed(2)} KB)`);
        
        if (fileName.endsWith('.docx')) {
          try {
            if (onProgress) onProgress(Math.min(90, Math.round((i / validFiles.length) * 100) + 5), `Extracting text from ${fileName}...`);
            console.log(`[Gemini] Reading docx: ${fileName}`);
            const arrayBuffer = await withTimeout(file.arrayBuffer(), 20000, "arrayBuffer timeout");
            console.log(`[Gemini] Extracting text from docx: ${fileName}`);
            const result = await withTimeout(mammoth.extractRawText({ arrayBuffer }), 45000, "mammoth timeout");
            console.log(`[Gemini] Finished docx extraction: ${fileName}`);
            return { text: result.value || "Empty document" };
          } catch (err: any) {
            console.error(`[Gemini] Error parsing docx: ${fileName}`, err);
            return { text: `Error reading document: ${err.message}` };
          }
        }

        if (fileName.endsWith('.txt')) {
          try {
            console.log(`[Gemini] Reading txt: ${fileName}`);
            const text = await withTimeout(file.text(), 15000, "text timeout");
            return { text: text || "Empty document" };
          } catch (err: any) {
            console.error(`[Gemini] Error reading txt: ${fileName}`, err);
            return { text: `Error reading txt: ${err.message}` };
          }
        }

        if (fileName.endsWith('.doc')) {
          console.warn(`[Gemini] Legacy .doc file detected: ${fileName}. This format is not fully supported.`);
          return { text: `Error: .doc files are not supported. Please save as .docx or .pdf and try again.` };
        }

        try {
          if (onProgress) onProgress(Math.min(90, Math.round((i / validFiles.length) * 100) + 5), `Preparing ${fileName} for AI...`);
          console.log(`[Gemini] Converting to base64: ${fileName} (Type: ${file.type})`);
          const base64 = await withTimeout(fileToBase64(file), 60000, "base64 timeout");
          console.log(`[Gemini] Finished base64 conversion: ${fileName}`);
          
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
        } catch (err: any) {
          console.error(`[Gemini] Error converting to base64: ${fileName}`, err);
          return { text: `Error converting file: ${err.message}` };
        }
      })
    );

    try {
      if (onProgress) onProgress(Math.min(90, Math.round((i / validFiles.length) * 100) + 5), `AI is analyzing ${currentFile.name}...`);
      console.log(`[Gemini] Sending batch to AI...`);
      const parsed = await processWithGemini(parts);
      console.log(`[Gemini] AI response received. Extracted ${parsed.length} questions.`);
      allQuestions.push(...parsed);
    } catch (e: any) {
      console.error("Failed to process batch", e);
      
      // Handle specific "no pages" error from Gemini
      if (e.message?.includes("The document has no pages")) {
        console.warn(`[Gemini] Skipping ${currentFile.name}: Document has no pages or is unreadable by AI.`);
        if (onProgress) onProgress(undefined as any, `Skipping ${currentFile.name} (unreadable format)...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Let user see the skip message
        continue; // Skip this file and move to the next
      }

      let anySuccess = false;
      // If batch fails, try processing files individually to isolate the bad file
      console.log("Retrying files individually...");
      for (const part of parts) {
        try {
          const parsed = await processWithGemini([part]);
          allQuestions.push(...parsed);
          anySuccess = true;
        } catch (err: any) {
          console.error("Failed to process individual file", err);
          
          // Handle specific "no pages" error during individual retry
          if (err.message?.includes("The document has no pages")) {
            console.warn(`[Gemini] Skipping file: Document has no pages or is unreadable.`);
            continue;
          }

          // If we are processing one file at a time and it fails, throw the error
          if (batchSize === 1) {
            throw new Error(`Failed to process file: ${err.message}`);
          }
        }
      }
      if (!anySuccess && batchSize > 1) {
        throw new Error(`Failed to process files: ${e.message}`);
      }
    }
    
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + batch.length) / validFiles.length) * 100)));
    }

    // Add a small delay between files to avoid hitting rate limits (429)
    if (i + batchSize < validFiles.length) {
      console.log("[Gemini] Waiting 3s before next file to avoid rate limits...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Deduplicate based on question text (simple approach)
  const uniqueQuestions = deduplicateQuestions(allQuestions);
  
  // Return the entire pool of unique questions with company tag
  return uniqueQuestions.map((q, i) => ({ ...q, id: `pool-${i}`, company }));
}

export function generateQuizFromPool(
  pool: Question[], 
  progress: Record<string, QuestionProgress> = {},
  masteryMode: boolean = false,
  company?: string,
  category?: string
): Question[] {
  // If mastery mode, we prioritize questions that are NOT mastered.
  let workingPool = [...pool];

  // Filter by company if specified (treat undefined as 'KPMG' for legacy)
  if (company && company !== 'All') {
    workingPool = workingPool.filter(q => (q.company || 'KPMG') === company);
  }

  // Filter by category if specified
  if (category && category !== 'All') {
    workingPool = workingPool.filter(q => q.category === category);
  }
  
  if (masteryMode) {
    // Sort by mastery status (unmastered first) and then by least correct answers
    workingPool.sort((a, b) => {
      const pA = progress[a.id];
      const pB = progress[b.id];
      
      const masteredA = pA?.mastered ? 1 : 0;
      const masteredB = pB?.mastered ? 1 : 0;
      
      if (masteredA !== masteredB) return masteredA - masteredB;
      
      const correctA = pA?.correctCount || 0;
      const correctB = pB?.correctCount || 0;
      
      return correctA - correctB;
    });
  }

  if (category && category !== 'All') {
    // If a specific category is selected, ignore quotas and just take up to 30
    const finalQuestions = masteryMode 
      ? workingPool.slice(0, 30) 
      : [...workingPool].sort(() => Math.random() - 0.5).slice(0, 30);
    
    // Final shuffle of the selected questions
    const fullyShuffled = [...finalQuestions].sort(() => Math.random() - 0.5);
    return fullyShuffled.map((q) => ({ ...q }));
  }

  // Apply quotas to get exactly 50 questions with the requested breakdown
  let quotas: Record<string, number> = {
    "Numerical Reasoning": 15,
    "Data Analysis": 5,
    "Reading Comprehension": 5,
    "Sentence Correction": 5,
    "Antonyms/Synonyms": 5,
    "Critical Reasoning": 5,
    "Current Affairs": 10,
  };

  // Adjust quotas specifically for EY's 4-section format: Numeracy, Literacy, Critical Reasoning, Soft Skills
  if (company === 'EY') {
    quotas = {
      "Numerical Reasoning": 10,
      "Data Analysis": 5,
      "Reading Comprehension": 7,
      "Sentence Correction": 4,
      "Antonyms/Synonyms": 4,
      "Critical Reasoning": 10,
      "Soft Skills / Situational Judgment": 10,
    };
  }

  const grouped: Record<string, Question[]> = {};
  for (const q of workingPool) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  const finalQuestions: Question[] = [];
  const remainingPool: Question[] = [];

  for (const [category, quota] of Object.entries(quotas)) {
    const available = grouped[category] || [];
    
    // If mastery mode, we already sorted workingPool, so we should maintain that order within categories
    // but maybe add a little randomness among similar mastery levels
    const candidates = masteryMode 
      ? available.slice(0, quota * 2).sort(() => Math.random() - 0.5).slice(0, quota)
      : [...available].sort(() => Math.random() - 0.5).slice(0, quota);

    finalQuestions.push(...candidates);
    
    // Keep track of what's left
    const candidateIds = new Set(candidates.map(c => c.id));
    remainingPool.push(...available.filter(a => !candidateIds.has(a.id)));
  }

  // 2. Add ANY category that was present in the workingPool but completely missing from the quotas map
  for (const [category, available] of Object.entries(grouped)) {
    if (!(category in quotas)) {
      remainingPool.push(...available);
    }
  }

  // If we don't have 30 questions (because some categories were short),
  // fill the remaining spots from the rest of the pool
  if (finalQuestions.length < 30 && remainingPool.length > 0) {
    const needed = 30 - finalQuestions.length;
    // In mastery mode, remainingPool is also somewhat ordered by mastery
    const extra = masteryMode
      ? remainingPool.slice(0, needed)
      : [...remainingPool].sort(() => Math.random() - 0.5).slice(0, needed);
      
    finalQuestions.push(...extra);
  }

  // Final shuffle of the 30 questions for the actual test experience
  const fullyShuffled = [...finalQuestions].sort(() => Math.random() - 0.5);

  // Assign fresh IDs for the quiz session
  return fullyShuffled.map((q) => ({ ...q })); // Keep original IDs for progress tracking
}

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.slice(i, i + 2));
  }
  return bigrams;
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const b1 = getBigrams(str1);
  const b2 = getBigrams(str2);
  
  if (b1.size === 0 || b2.size === 0) return 0;

  const intersection = new Set([...b1].filter(x => b2.has(x)));
  
  // Sørensen–Dice coefficient
  return (2 * intersection.size) / (b1.size + b2.size);
}

export function deduplicateQuestions(questions: any[]): any[] {
  const uniqueQuestions: any[] = [];
  
  for (const q of questions) {
    // Create a comprehensive string representation of the question
    const qStr = [
      q.question || "",
      ...(Array.isArray(q.options) ? q.options : []),
      q.explanation || ""
    ].join(" ").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

    let isDuplicate = false;
    for (const existingQ of uniqueQuestions) {
      const existingStr = [
        existingQ.question || "",
        ...(Array.isArray(existingQ.options) ? existingQ.options : []),
        existingQ.explanation || ""
      ].join(" ").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
      
      const similarity = calculateSimilarity(qStr, existingStr);
      if (similarity > 0.85) { // 85% similarity threshold
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueQuestions.push(q);
    }
  }
  return uniqueQuestions;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

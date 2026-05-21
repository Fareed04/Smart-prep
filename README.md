# Smart-Prep

Smart-Prep is an intelligent, AI-powered mock assessment and study platform designed to help users prepare for corporate aptitude tests and interviews. Using the Gemini API, the platform parses uploaded materials, dynamically generates tailored practice simulations, and creates personalized study guides.

## Key Features

- **AI-Powered Simulations:** Upload past questions (PDFs, images) and generate realistic mock assessments customized for specific target companies (e.g., KPMG, EY, PwC, Deloitte, or any custom company you add).
- **Personalized Dashboard:** Track your preparation journey with an interactive dashboard that monitors Experience Points (XP), Mastery Progress, daily study streaks, and professional achievements (badges).
- **Interactive Study Hub:** Automatically generate deeply structured study guides from your uploaded materials or past performance. Includes Table of Contents generation and integrated Knowledge Checks (mini-quizzes generated on the fly) to test comprehension of the study material.
- **Detailed Analytics & Reports:** Get immediate feedback after every simulation, featuring category-by-category breakdowns, time-taken metrics, and targeted "Work Smarter" advice driven by AI.
- **Cross-Device Sync:** Features Firebase Authentication and Firestore integration to securely save progress, question pools, reports, and active sessions across devices.
- **Session Persistence:** Leave a simulation mid-way and resume exactly where you left off, supported by local storage and cloud syncing.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **UI Components:** Lucide Icons, Recharts (for data visualization), Canvas Confetti (for progress celebrations), React Markdown (for rendering study guides).
- **Backend & Database:** Firebase (Authentication & Firestore)
- **AI Integration:** Google Gemini API (@google/genai) for parsing documents, generating dynamically structured mock tests, building study guides, and formulating targeted knowledge-check quizzes.

## Getting Started

1. **Prerequisites:** You will need a valid Google Gemini API key and a Firebase project configuration. Provide these across `.env.local` or environment variables accordingly. 
2. **Setup:**
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`
3. **Using the App:** 
   - Sign in using an email and password or Google Auth (via Firebase).
   - Use the "Upload Files" feature to provide source documents.
   - Click "Generate Mock" or "Start Processing" to parse and create your question pool.
   - Navigate to the **Study Hub** for generated guides, or the **Simulation** menu to take a mock assessment.

## License

This project is open-source and intended for personal learning and corporate assessment preparation.

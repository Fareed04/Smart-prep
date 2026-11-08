# Smart-Prep: High-Velocity AI Assessment & Study Intelligence Platform

Smart-Prep is an enterprise-grade, AI-driven assessment simulation and study intelligence platform designed to accelerate candidate preparation for high-stakes corporate aptitude tests, Big 4 graduate trainee assessments (KPMG, EY, PwC, Deloitte), banking assessments, and professional certifications.

Powered by Google Gemini models (`gemini-3.8-flash`, with multi-tier fallback to `gemini-flash-latest` and `gemini-2.5-flash`), the system ingests bulk past questions from PDFs, images (OCR), Word documents, and text, deduplicating and validating them to contemporary 2026 cognitive standards to generate precision-timed mock simulations, interactive study guides, and company-specific research dossiers.

---

## 🌟 Key System Functionalities

### 1. ⚡ Zen Quiz Engine & Assessment Simulations
- **Zero-Scroll Zen Mode**: Viewport-optimized layout designed so that every millisecond taking the quiz is utilized efficiently without vertical page scrolling.
- **Dual Dynamic Layouts**:
  - **Layout A (Reading Comprehension / Passage-Based)**: Side-by-side passage and question panel on desktop, scroll-isolated reference viewer on mobile devices.
  - **Layout B (Standard Questions)**: Distraction-free, centered question stem and option matrix for Numerical, Verbal, Logical, and Situational Judgement tests.
- **Test-Taking Toolkit**:
  - **Option Elimination Mode (`Cmd/Ctrl+E` or button)**: Strike through unlikely choices to calculate probability and narrow down answers.
  - **Question Flagging & Navigation**: Flag difficult questions for review; jump between questions with one click.
  - **Keyboard Shortcuts**: Select choices with `1`-`4` or `A`-`D`, navigate with `Enter` / `N` (Next) and `P` (Previous), toggle elimination with `E`.
  - **Mastery Mode vs. Standard Mode**: Choose between standard test simulation or mastery mode (which dynamically queues missed questions for retention reinforcement).
  - **Pacing Timer & Warning**: Real-time timer with pulse animations when time is low to build time-management discipline.

### 2. 📊 Visual Linear Progress Extraction Screen (`ProcessingScreen`)
- **Animated Linear Progress Bar**: Real-time visual progress bar tracking multi-file document extraction and question generation.
- **Dynamic Shimmer Sweep**: Hardware-accelerated light beam (`animate-progress-shimmer`) gliding across the gradient fill to provide continuous visual activity during heavy OCR or LLM token processing.
- **4-Phase Extraction Milestones**:
  1. *Ingestion & OCR* (15%): Multi-format parsing and text extraction.
  2. *Pattern Extraction* (40%): Question stem, choices, answer key, and explanation identification.
  3. *Deduplication & Verification* (70%): Duplicate elimination and alignment with 2026 cognitive standards.
  4. *Finalizing Question Pool* (95%): Shuffling, categorizing, and preparing simulation pools.
- **Live Metrics**: Tabular percentage readout (`{progress}%`) with real-time status activity stream.

### 3. 🏢 Company Intelligence & Organization Research (`CompanyIntel`)
- **Automated Background Research**: Deep-dive intelligence reports on corporate recruitment tests across major employers (Big 4, investment banks, FMCG, technology).
- **Core Intelligence Modules**:
  - **Assessment Provider Profile**: Test format identification (e.g., SHL, Korn Ferry, Cappfinity, Cubiks) with speed vs. accuracy weighting.
  - **Company Pillars & Core Values**: Cultural competencies evaluated during Situational Judgement and behavioral assessments.
  - **Representative Sample Questions**: Realistic practice questions modeled after the firm's authentic assessment style.
  - **Preparation & Interview Strategy**: Concrete tactics to ace the firm's testing and interview stages.
- **Export & Portability**: Download comprehensive dossiers as formatted PDF reports (`jspdf`) or copy structured summaries to the clipboard.
- **Resilient Fallback Engine**: Built-in structured research generator ensures preparation is never interrupted by external API quotas or offline status.

### 4. 🧮 Interactive Floating & Minimized Calculator (`Calculator`)
- **Frictionless Floating Widget**: Non-obstructive draggable calculator with smooth boundary confinement.
- **Standard & Unary Math Modes**: Basic four-function arithmetic plus square root ($\sqrt{x}$), square ($x^2$), percentage ($\%$), reciprocal ($1/x$), and negation ($\pm$).
- **Tape / Calculation History**: Searchable history roll allowing candidates to review and recall prior calculations directly into the active display.
- **Fluid Cross-Device Adaptation**: Desktop floating modal transitions smoothly into a compact, responsive mobile pill (`max-w-[calc(100vw-1.5rem)]`) with guaranteed touch-friendly key targets ($\ge 44\text{px}$).

### 5. 📚 Interactive Study Hub (`StudyHub`)
- **Custom AI Study Guides**: Generate comprehensive study guides across categories (*Numerical Reasoning*, *Verbal Reasoning*, *Logical / Inductive Reasoning*, *Situational Judgement (SJT)*, *General Strategy*) or from custom uploaded reference PDFs.
- **Interactive Knowledge Checks**: Section-by-section mini-quizzes embedded directly in guides to test comprehension with immediate feedback and detailed rationale.
- **Zen Reader Mode**: Distraction-free reading experience with adjustable font sizing (*Normal*, *Large*, *Huge*) and theme options (*Default*, *Warm Sepia*).
- **Focus Calendar**: Integrated visual monthly calendar tracking daily assessment activity, completed mock exams, and streak consistency.
- **3D Interactive Flashcards**: Interactive double-sided cards with flip animation, category tagging, difficulty levels (*Easy*, *Medium*, *Hard*), and click-to-reveal explanations.

### 6. 📈 Dashboard & Recent Sessions Tracking (`RecentSessionsList`)
- **Responsive Bento Dashboard**: Modular grid layout balancing daily study targets, XP level progression, streak counters, and categorical mastery stats across mobile (1-column), tablet (7:5 split), and desktop (12-column).
- **Recent Sessions Tracker**: Searchable and filterable history of past mock exams mapping:
  - Date and timestamp
  - Target company or test style
  - Accuracy percentage score
  - Total duration / elapsed time
  - Total questions attempted and category tags
  - Direct one-click session review
- **AI Study Coach**: Context-aware "Work Smarter" recommendations generated by Gemini analyzing recent test scores and pacing bottlenecks.

### 7. ☁️ Hybrid Local + Cloud Resilience
- **Firebase Firestore & Authentication**: Real-time cloud sync for user accounts, question pools, session results, and study guides.
- **Quota-Exhaustion Protection Circuit**: Intelligent detection of Firestore write quota limits (`resource-exhausted`); automatically pivots to local cache storage (`localStorage`) so test taking, guide generation, and session reviews continue uninterrupted.

### 8. 📱 Cross-Device Responsiveness
- **Mobile Navigation Drawer**: Accessible slide-out navigation with $\ge 44\text{px}$ touch targets for rapid switching between Dashboard, Company Intel, Study Hub, and Simulations.
- **Lenis Smooth Scroll Isolation**: Configured with `data-lenis-prevent` on horizontal filter chips, calendar tables, and tabs to prevent touch gesture conflicts.

---

## 🔄 End-to-End System Workflows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. AUTHENTICATION & ONBOARDING                  │
│       Sign in with Firebase Auth or continue with local state          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. BENTO DASHBOARD & ROADMAP                    │
│   Review Daily Goal, XP, Mastery Stats, Focus Calendar, Past Sessions  │
└───────┬───────────────────────────┼───────────────────────────┬────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐    ┌────────────────────────┐    ┌──────────────────┐
│   UPLOAD FILES   │    │     COMPANY INTEL      │    │    STUDY HUB     │
│ Ingest PDFs,     │    │ Research target firm,  │    │ Generate guides, │
│ DOCX, images     │    │ test providers (SHL),  │    │ 3D flashcards,   │
│ & past questions │    │ export PDF dossiers    │    │ Focus Calendar   │
└───────┬──────────┘    └────────────────────────┘    └──────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   3. ANIMATED EXTRACTION SCREEN                        │
│   Linear progress bar with live shimmer, OCR parsing, 4 milestones     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       4. ASSESSMENT CONFIGURATION                      │
│   Select category, difficulty, duration, Zen Mode, or Mastery Mode     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     5. TIMED ZEN SIMULATION (QUIZ)                     │
│  Dual layouts (Passage vs Standard), floating calculator, elimination  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     6. COMPREHENSIVE PERFORMANCE REPORT                │
│    Score breakdown, category analysis, question review, AI coaching    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   7. RECENT SESSIONS & ROADMAP UPDATE                  │
│  Results synced to Dashboard Recent Sessions list, XP & badges updated │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Workflow Walkthrough:

1. **Ingesting Past Papers & Generating a Question Pool**:
   - Navigate to **Upload Files**.
   - Drag and drop past assessment documents (PDF, DOCX, PNG, JPG).
   - Select or add your target company (e.g., KPMG, EY, PwC, Deloitte, or a custom firm).
   - Click **Process & Start Simulation**. The app transitions to the **ProcessingScreen**, displaying the animated linear progress bar as files pass through OCR, extraction, deduplication, and 2026 cognitive fact verification.

2. **Conducting Company Background Research**:
   - Open **Company Intel** from the top header or mobile menu.
   - Select a target company or type a new organization name.
   - The AI synthesizes assessment provider details (SHL, Korn Ferry, Cappfinity), cultural evaluation pillars, sample test items, and interview strategy.
   - Click **Export PDF** to save the briefing for offline review.

3. **Taking an Assessment in Zen Mode**:
   - From the **Ready Screen**, select test parameters: Category (*All, Numerical, Verbal, Logical, SJT*), Difficulty (*Easy, Medium, Hard*), Duration, and Mode (*Standard* or *Mastery*).
   - Toggle **Zen Mode** for an unscrollable, viewport-contained simulation.
   - Use the **Floating Calculator** for fast computations; drag it anywhere on the screen or minimize it to a floating chip.
   - Strikethrough options using elimination mode (`Cmd/Ctrl+E`), flag tricky questions, and track remaining time.

4. **Reviewing Performance & Tracking Recent Sessions**:
   - Upon completion, the **Report Screen** highlights your accuracy score, time spent per question, category strengths/weaknesses, and detailed explanations.
   - The session automatically registers on your **Dashboard** in the **Recent Sessions** component, updating your cumulative XP, mastery progress, daily streak, and unlockable badges.

5. **Self-Paced Study & Retention Reinforcement**:
   - In the **Study Hub**, generate topic-specific study guides with nested Table of Contents.
   - Switch to **Zen Reader** for sepia/large-print distraction-free reading.
   - Take interactive **Knowledge Checks** at the end of each topic.
   - Practice with interactive **3D Flashcards** and review mock test consistency on the **Focus Calendar**.

---

## 🛠 Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 6 |
| **Styling & Motion** | Tailwind CSS v4, Motion (`motion/react`), Lenis Smooth Scroll |
| **Visuals & Icons** | Lucide React, Recharts (data visualization), Canvas Confetti |
| **Backend & Server** | Node.js, Express (`server.ts` full-stack proxy), TSX |
| **AI Integration** | Google Gemini API (`@google/genai`) using `gemini-3.8-flash` with resilient model fallbacks (`gemini-flash-latest`, `gemini-2.5-flash`) |
| **Document Processing** | `pdf-lib` (PDF parsing), `mammoth` (DOCX extraction), Canvas/Image OCR |
| **Export Engines** | `jspdf`, `html-to-image` |
| **Database & Auth** | Firebase Authentication & Cloud Firestore with automatic local-storage fallback |

---

## 💻 Developer Setup & Running Locally

### Prerequisites
- Node.js 18+ or 20+
- A Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- A Firebase project (Authentication & Firestore enabled)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory (referencing `.env.example`):
   ```env
   # Firebase Web Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Gemini API Key (accessed server-side via server.ts proxy)
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application runs at `http://localhost:3000` with the Vite-Express integration.

4. **Verify Type-Safety & Build:**
   ```bash
   npm run lint   # Runs tsc --noEmit
   npm run build  # Builds production client and server bundles
   ```

---

## 📄 License

This project is open-source and intended for personal learning and corporate assessment preparation.

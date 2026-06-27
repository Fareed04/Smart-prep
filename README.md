# Smart-Prep: AI-Powered Assessment & Study Platform

Smart-Prep is an intelligent, AI-powered mock assessment and study platform designed to help users prepare for corporate aptitude tests, professional certifications, and interviews. Leveraging the power of the Gemini API, the platform parses uploaded materials, dynamically generates tailored practice simulations, and creates personalized, deeply structured study guides.

---

## 🌟 Key Features

### 🧠 AI-Powered Simulations
- **Dynamic Generation:** Upload past questions (PDFs, images) and generate realistic mock assessments.
- **Customized Targeting:** Tailor your simulations for specific target companies (e.g., KPMG, EY, PwC, Deloitte, or any custom company you add).
- **Adaptive Difficulty:** Experience dynamic quizzes that match the rigor of real corporate assessments.

### 📊 Personalized Dashboard
- **Gamified Tracking:** Monitor your preparation journey with Experience Points (XP) and Mastery Progress metrics.
- **Consistency Tracking:** Keep up your momentum with daily study streaks.
- **Achievements:** Earn professional badges as you reach milestones and master different topics.

### 📚 Interactive Study Hub
- **Automated Study Guides:** Automatically generate deeply structured study guides from your uploaded materials or past performance.
- **Smart Organization:** Includes Table of Contents generation for easy navigation.
- **Knowledge Checks:** Integrated mini-quizzes generated on the fly to test comprehension of the study material as you read.

### 🧮 Built-in Floating Calculator
- **Always Accessible:** A draggable, floating calculator accessible anytime, especially useful during quantitative live quizzes.
- **Advanced Operations:** Features standard arithmetic and unary operations (square root, square, percentage, reciprocal, negate).
- **User-Friendly:** Includes calculation history, keyboard shortcuts, and a transparent, non-obstructive design.

### 📈 Detailed Analytics & Reports
- **Immediate Feedback:** Get comprehensive reports immediately after every simulation.
- **Performance Breakdown:** View category-by-category breakdowns and time-taken metrics.
- **AI Advice:** Receive targeted "Work Smarter" advice driven by AI to focus on your weak points.

### ☁️ Cross-Device Sync & Session Persistence
- **Cloud Saving:** Features Firebase Authentication and Firestore integration to securely save progress, question pools, reports, and active sessions across devices.
- **Resume Anytime:** Leave a simulation mid-way and resume exactly where you left off, supported by local storage and cloud syncing.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **UI Components:** Lucide Icons, Recharts (data visualization), Canvas Confetti (progress celebrations), React Markdown (rendering study guides), Motion/React (draggable components and animations).
- **Backend & Database:** Firebase (Authentication & Firestore)
- **AI Integration:** Google Gemini API (`@google/genai`) for parsing documents, generating dynamically structured mock tests, building study guides, and formulating targeted knowledge-check quizzes.

---

## 🚀 How to Use the System

### 1. Account Creation & Dashboard Overview
- **Sign In/Sign Up:** Launch the app and authenticate using your email and password.
- **Explore Dashboard:** Upon logging in, you'll land on your Personalized Dashboard. Here you can view your current XP, daily streak, recent mock assessment scores, and earned badges.

### 2. Uploading Study Materials
- **Navigate to Uploads:** Click on the **Upload Files** section or the plus icon.
- **Select Files:** Drag and drop or browse to select your source documents (PDFs, images, past questions, or syllabi).
- **Select Target:** Choose a target company or role to contextualize the AI's generation.
- **Process Content:** Click **Generate Mock** or **Start Processing**. The AI will read your documents and extract relevant concepts, questions, and topics.

### 3. Using the Study Hub
- **Access Guides:** Go to the **Study Hub** to view study materials generated from your uploads.
- **Read & Learn:** Navigate through the dynamically generated Table of Contents to study different topics.
- **Knowledge Checks:** Take the integrated mini-quizzes at the end of sections to test your retention.

### 4. Taking a Mock Assessment (Simulation)
- **Start Simulation:** Navigate to the **Simulation** or **Quiz** section to begin a new mock test.
- **Answer Questions:** Proceed through the generated questions. Use the **Floating Calculator** (accessible via the calculator icon at the bottom right) for quantitative problems. You can drag it around so it doesn't block the question.
- **Pause & Resume:** Need a break? You can safely close the app; your session is automatically saved and can be resumed later.

### 5. Reviewing Analytics
- **Finish Assessment:** Once you complete a quiz, you will be taken to the **Report Screen**.
- **Analyze Performance:** Review your overall score, category breakdown, and time spent on questions.
- **Actionable Feedback:** Read the AI-generated "Work Smarter" tips to understand what areas need more focus before your real test.

---

## 💻 Getting Started (For Developers)

### Prerequisites
You will need a valid **Google Gemini API key** and a **Firebase project configuration**.

### Setup Instructions

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and fill in your Gemini and Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

## 📄 License

This project is open-source and intended for personal learning and corporate assessment preparation.

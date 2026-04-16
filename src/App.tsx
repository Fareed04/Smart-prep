import React, { useState, useEffect } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ReadyScreen } from './components/ReadyScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReportScreen } from './components/ReportScreen';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { extractQuestionsFromFiles, generateQuizFromPool, deduplicateQuestions } from './lib/gemini';
import { QuizState, Question, QuestionProgress } from './types';
import { auth, logOut, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LogOut, LayoutDashboard } from 'lucide-react';

type AppState = 'login' | 'dashboard' | 'upload' | 'processing' | 'ready' | 'quiz' | 'report';

const STORAGE_KEY_STATE = 'smartprep_quiz_state';
const STORAGE_KEY_POOL = 'smartprep_question_pool';
const STORAGE_KEY_APP_STATE = 'smartprep_app_state';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedPool, setExtractedPool] = useState<Question[]>([]);
  const [questionProgress, setQuestionProgress] = useState<Record<string, QuestionProgress>>({});
  const [masteryMode, setMasteryMode] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quizDuration, setQuizDuration] = useState<number>(60);
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: {},
    isFinished: false,
    timeRemaining: 60 * 60, // Default 60 minutes
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isViewingPastReport, setIsViewingPastReport] = useState(false);

  // Load saved state on mount (Local Storage)
  useEffect(() => {
    try {
      const savedPool = localStorage.getItem(STORAGE_KEY_POOL);
      const savedQuizState = localStorage.getItem(STORAGE_KEY_STATE);
      const savedAppState = localStorage.getItem(STORAGE_KEY_APP_STATE);

      if (savedPool) setExtractedPool(JSON.parse(savedPool));
      if (savedQuizState) setQuizState(JSON.parse(savedQuizState));
      
      // Only restore app state if it's quiz or ready, to allow resuming locally
      if (savedAppState && (savedAppState === 'quiz' || savedAppState === 'ready')) {
        setAppState(savedAppState as AppState);
      }
    } catch (e) {
      console.error("Failed to restore local session", e);
    }
  }, []);

  // Save state on change (Local Storage)
  useEffect(() => {
    if (extractedPool.length > 0) {
      localStorage.setItem(STORAGE_KEY_POOL, JSON.stringify(extractedPool));
    } else {
      localStorage.removeItem(STORAGE_KEY_POOL);
    }
  }, [extractedPool]);

  useEffect(() => {
    if (quizState.questions.length > 0 && !quizState.isFinished) {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(quizState));
    } else if (quizState.isFinished) {
      localStorage.removeItem(STORAGE_KEY_STATE);
    }
  }, [quizState]);

  useEffect(() => {
    if (['quiz', 'ready'].includes(appState)) {
      localStorage.setItem(STORAGE_KEY_APP_STATE, appState);
    } else {
      localStorage.removeItem(STORAGE_KEY_APP_STATE);
    }
  }, [appState]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth & Cloud Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch cloud pool so documents persist across devices (like Desktop -> Mobile)
        try {
          const poolDoc = await getDoc(doc(db, 'questionPools', currentUser.uid));
          if (poolDoc.exists()) {
            const data = poolDoc.data();
            if (data.pool) {
              try {
                const parsedPool = JSON.parse(data.pool);
                if (parsedPool.length > 0) {
                  setExtractedPool(parsedPool);
                }
              } catch (e) {
                console.error("Failed to parse pool from cloud", e);
              }
            }
            if (data.progress) {
              try {
                const parsedProgress = JSON.parse(data.progress);
                setQuestionProgress(parsedProgress);
              } catch (e) {
                console.error("Failed to parse progress from cloud", e);
              }
            }
          }
        } catch (e) {
          console.error("Error fetching cloud pool", e);
        }

        const savedAppState = localStorage.getItem(STORAGE_KEY_APP_STATE);
        if (savedAppState && (savedAppState === 'quiz' || savedAppState === 'ready')) {
          setAppState(savedAppState as AppState);
        } else {
          setAppState('dashboard');
        }
      } else {
        setAppState('login');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleStartProcessing = React.useCallback(async (company: string) => {
    if (files.length === 0) return;
    setAppState('processing');
    setProgress(0);
    setProcessingStatus("Initializing...");
    setErrorMessage(null);
    
    try {
      const newQuestions = await extractQuestionsFromFiles(files, (p, status) => {
        setProgress(p);
        if (status) setProcessingStatus(status);
      }, company);
      
      if (newQuestions.length === 0) {
        setErrorMessage("Could not extract any questions from the provided files. Please ensure they contain readable text.");
        setAppState('upload');
        return;
      }

      // Merge with existing pool and deduplicate
      const mergedPool = deduplicateQuestions([...extractedPool, ...newQuestions]);
      setExtractedPool(mergedPool);
      
      // Save to cloud so it's available on other devices
      if (user) {
        setDoc(doc(db, 'questionPools', user.uid), { 
          pool: JSON.stringify(mergedPool),
          progress: JSON.stringify(questionProgress)
        }).catch(console.error);
      }

      setAppState('ready');
    } catch (error) {
      console.error("Processing failed:", error);
      setErrorMessage(error instanceof Error ? `Processing failed: ${error.message}` : "An error occurred while processing the files. Please try again.");
      setAppState('upload');
    }
  }, [files, extractedPool, questionProgress, user]);

  const handleStartQuiz = React.useCallback(() => {
    const quizQuestions = generateQuizFromPool(extractedPool, questionProgress, masteryMode, selectedCompany, selectedCategory);
    setQuizState({
      questions: quizQuestions,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      timeRemaining: quizDuration * 60,
    });
    setIsViewingPastReport(false);
    setAppState('quiz');
  }, [extractedPool, questionProgress, masteryMode, selectedCompany, selectedCategory, quizDuration]);

  const handleRestart = React.useCallback(() => {
    setErrorMessage(null);
    setIsViewingPastReport(false);
    setAppState('ready');
  }, []);

  const handleAddMore = React.useCallback(() => {
    setErrorMessage(null);
    setIsViewingPastReport(false);
    setAppState('upload');
  }, []);

  const updateMasteryProgress = React.useCallback((questions: Question[], answers: Record<string, string>) => {
    const newProgress = { ...questionProgress };
    
    questions.forEach(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.answer;
      
      const current = newProgress[q.id] || {
        correctCount: 0,
        incorrectCount: 0,
        lastAttemptCorrect: false,
        mastered: false
      };
      
      if (isCorrect) {
        current.correctCount += 1;
      } else {
        current.incorrectCount += 1;
      }
      
      current.lastAttemptCorrect = isCorrect;
      
      // Mastery logic: Correct at least twice and last attempt was correct
      if (current.correctCount >= 2 && isCorrect) {
        current.mastered = true;
      } else if (!isCorrect) {
        // If they get it wrong, they lose mastery
        current.mastered = false;
      }
      
      newProgress[q.id] = current;
    });
    
    setQuestionProgress(newProgress);
    if (user) {
      setDoc(doc(db, 'questionPools', user.uid), { 
        pool: JSON.stringify(extractedPool),
        progress: JSON.stringify(newProgress)
      }).catch(console.error);
    }
  }, [questionProgress, user, extractedPool]);

  const handleFinishQuiz = React.useCallback(() => {
    updateMasteryProgress(quizState.questions, quizState.answers);
    setQuizState(prev => ({ ...prev, isFinished: true }));
    setAppState('report');
  }, [quizState.questions, quizState.answers, updateMasteryProgress]);

  const handleUploadDifferent = React.useCallback(() => {
    setFiles([]);
    setExtractedPool([]);
    setQuestionProgress({});
    
    // Clear from cloud
    if (user) {
      setDoc(doc(db, 'questionPools', user.uid), { 
        pool: "[]",
        progress: "{}"
      }).catch(console.error);
    }

    setErrorMessage(null);
    setIsViewingPastReport(false);
    setAppState('upload');
  }, [user]);

  const handleDashboard = React.useCallback(() => {
    setFiles([]);
    setErrorMessage(null);
    setIsViewingPastReport(false);
    setAppState('dashboard');
  }, []);

  const handleViewReport = React.useCallback((session: any) => {
    if (session.questions && session.answers) {
      try {
        const parsedQuestions = JSON.parse(session.questions);
        const parsedAnswers = JSON.parse(session.answers);
        setQuizState({
          questions: parsedQuestions,
          answers: parsedAnswers,
          currentIndex: parsedQuestions.length - 1,
          isFinished: true,
          timeRemaining: 3600 - session.timeTaken,
        });
        setIsViewingPastReport(true);
        setAppState('report');
      } catch (e) {
        console.error("Failed to parse session data", e);
        setErrorMessage("Could not load the full report for this session.");
      }
    } else {
      setErrorMessage("Full report data is not available for this older session.");
    }
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => user && setAppState('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Smart-Prep</span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {user && (
              <>
                <button 
                  onClick={() => setAppState('dashboard')}
                  className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Dashboard</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                <button 
                  onClick={logOut}
                  className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="py-8">
        {appState === 'login' && <LoginScreen />}
        {appState === 'dashboard' && (
          <Dashboard 
            onStartNew={() => {
              if (extractedPool.length > 0) {
                setAppState('ready');
              } else {
                setAppState('upload');
              }
            }}
            onViewReport={handleViewReport}
            errorMessage={errorMessage}
            pool={extractedPool}
            progress={questionProgress}
          />
        )}
        {appState === 'upload' && (
          <UploadScreen files={files} setFiles={setFiles} onStartProcessing={handleStartProcessing} errorMessage={errorMessage} />
        )}
        {appState === 'processing' && (
          <ProcessingScreen progress={progress} status={processingStatus} />
        )}
        {appState === 'ready' && (
          <ReadyScreen 
            pool={extractedPool}
            onStart={handleStartQuiz} 
            onAddMore={handleAddMore}
            onUploadDifferent={handleUploadDifferent} 
            masteryMode={masteryMode}
            setMasteryMode={setMasteryMode}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            quizDuration={quizDuration}
            setQuizDuration={setQuizDuration}
          />
        )}
        {appState === 'quiz' && (
          <QuizScreen 
            state={quizState} 
            setState={setQuizState} 
            onFinish={handleFinishQuiz} 
          />
        )}
        {appState === 'report' && (
          <ReportScreen 
            state={quizState} 
            onRestart={handleRestart} 
            onDashboard={handleDashboard} 
            isViewingPastReport={isViewingPastReport}
            company={selectedCompany}
          />
        )}
      </main>
    </div>
  );
}

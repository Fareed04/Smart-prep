import React, { useState, useEffect } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ReadyScreen } from './components/ReadyScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReportScreen } from './components/ReportScreen';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { StudyHub } from './components/StudyHub';
import { extractQuestionsFromFiles, generateQuizFromPool, deduplicateQuestions, generateMockAssessment, migrateLegacyQuestions } from './lib/gemini';
import { QuizState, Question, QuestionProgress, UserProfile } from './types';
import { auth, logOut, db, handleFirestoreError, OperationType, onFirestoreQuotaStateChange, isFirestoreQuotaExceeded, isFirestoreQuotaExceeded as initialQuotaStatus } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment, deleteField } from 'firebase/firestore';
import { LogOut, LayoutDashboard, BookOpen, Trophy, Battery, BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';

type AppState = 'login' | 'dashboard' | 'upload' | 'processing' | 'ready' | 'quiz' | 'report' | 'study';

const STORAGE_KEY_STATE = 'smartprep_quiz_state';
const STORAGE_KEY_POOL = 'smartprep_question_pool';
const STORAGE_KEY_APP_STATE = 'smartprep_app_state';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [quizDuration, setQuizDuration] = useState<number>(60);
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    answers: {},
    isFinished: false,
    timeRemaining: 60 * 60, // Default 60 minutes
    flaggedQuestions: []
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isViewingPastReport, setIsViewingPastReport] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(initialQuotaStatus);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [dismissedBatteryWarning, setDismissedBatteryWarning] = useState<boolean>(false);
  const [hasBatteryAutoSaved, setHasBatteryAutoSaved] = useState<boolean>(false);

  // Trigger auto-save on critical battery level
  useEffect(() => {
    if (batteryLevel !== null && batteryLevel < 0.10 && !isCharging) {
      if (appState === 'quiz' && quizState.questions.length > 0 && !quizState.isFinished) {
        if (!hasBatteryAutoSaved) {
          try {
            localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(quizState));
            localStorage.setItem(STORAGE_KEY_APP_STATE, 'quiz');
            setHasBatteryAutoSaved(true);
            console.log("[Battery] Critical battery auto-save completed successfully.");
          } catch (e) {
            console.error("[Battery] Critical battery auto-save failed:", e);
          }
        }
      }
    } else {
      // Reset auto-save state if battery is healthy or charging
      setHasBatteryAutoSaved(false);
    }
  }, [batteryLevel, isCharging, appState, quizState, hasBatteryAutoSaved]);

  // Battery Status Listener
  useEffect(() => {
    if ('getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);

        const updateBatteryInfo = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
          if (battery.charging || battery.level >= 0.1) {
            setDismissedBatteryWarning(false);
          }
        };

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
        };
      });
    }
  }, []);

  // Online/Offline Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firestore Quota Listener
  useEffect(() => {
    return onFirestoreQuotaStateChange((status) => {
      setIsQuotaExceeded(status);
      if (status) {
        setErrorMessage("Notice: Cloud database quota exceeded. Your progress will be saved locally in this browser, and we will try to sync it to the cloud once limits reset (usually every 24 hours).");
      }
    });
  }, []);

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
        // Fetch cloud pool and profile
        let hasActiveSession = false;
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              xp: 0,
              level: 1,
              streak: 1,
              lastActive: new Date().toISOString(),
              achievements: [],
              dailyGoal: 20
            };
            await setDoc(doc(db, 'profiles', currentUser.uid), initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (e) {
          console.error("Error fetching/setting cloud profile", e);
          try {
            handleFirestoreError(e, OperationType.GET, `profiles/${currentUser.uid}`);
          } catch (err: any) {
            setErrorMessage(err.message);
          }
        }

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
            if (data.activeSession) {
              try {
                const parsedSession = JSON.parse(data.activeSession);
                const cleared = JSON.parse(localStorage.getItem('smartprep_cleared_sessions') || '[]');
                
                // For legacy sessions without an ID, we'll check if we generally cleared a legacy session recently.
                const isSessionClearedLocally = (parsedSession.sessionId && cleared.includes(parsedSession.sessionId)) || 
                                                (!parsedSession.sessionId && localStorage.getItem('smartprep_cleared_legacy') === 'true');
                
                if (!isSessionClearedLocally) {
                  // Give it an ID now so we can clear it later if needed
                  if (!parsedSession.sessionId) {
                    parsedSession.sessionId = "legacy_" + Math.random().toString(36).substring(2, 10);
                  }
                  setQuizState(parsedSession);
                  hasActiveSession = true;
                } else {
                  console.log("Ignoring cloud session because it was cleared locally.");
                  // Make an attempt to clean up the zombie session
                  try {
                    updateDoc(doc(db, 'questionPools', currentUser.uid), {
                      activeSession: deleteField()
                    });
                  } catch(e) {}
                }
              } catch (e) {
                console.error("Failed to parse active session from cloud", e);
              }
            }
          }
        } catch (e: any) {
          console.error("Error fetching cloud pool", e);
          try {
            handleFirestoreError(e, OperationType.GET, `questionPools/${currentUser.uid}`);
          } catch (err: any) {
            setErrorMessage(err.message);
          }
        }

        const savedAppState = localStorage.getItem(STORAGE_KEY_APP_STATE);
        if (hasActiveSession) {
          setAppState('quiz');
        } else if (savedAppState && (savedAppState === 'quiz' || savedAppState === 'ready')) {
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

  const handleGenerateMock = React.useCallback(async (company: string, isAdaptive?: boolean) => {
    setAppState('processing');
    setProgress(0);
    setProcessingStatus(`Generating ${isAdaptive ? 'adaptive AI' : 'mock'} assessment for ${company}...`);
    setErrorMessage(null);
    setSelectedCompany(company);

    try {
      // Create a fake progress loop to show activity
      let simProgress = 0;
      const progressInterval = setInterval(() => {
        simProgress += 5;
        if (simProgress <= 90) {
          setProgress(simProgress);
        }
      }, 500);

      // We still generate a base set of questions. For adaptive, we'll only use the first one and discard the rest.
      const mockQuestions = await generateMockAssessment(company);
      clearInterval(progressInterval);
      setProgress(100);
      setProcessingStatus("Assessment initialized successfully!");

      const mergedPool = deduplicateQuestions([...extractedPool, ...mockQuestions]);
      setExtractedPool(mergedPool);

      if (user && !isFirestoreQuotaExceeded) {
        setDoc(doc(db, 'questionPools', user.uid), { 
          pool: JSON.stringify(mergedPool),
          progress: JSON.stringify(questionProgress)
        }, { merge: true }).catch((err) => {
          console.error(err);
          try {
            handleFirestoreError(err, OperationType.WRITE, 'questionPools');
          } catch (e: any) {
            setErrorMessage(e.message);
          }
        });
      }

      setTimeout(() => {
        setQuizDuration(10);
        setQuizState({
          questions: isAdaptive ? [mockQuestions[0]] : mockQuestions,
          currentIndex: 0,
          answers: {},
          isFinished: false,
          timeRemaining: 10 * 60,
          flaggedQuestions: [],
          isAdaptive: isAdaptive,
          categoryDifficulties: isAdaptive ? {
            "Numerical Reasoning": "medium",
            "Verbal Reasoning": "medium",
            "Logical / Inductive / Deductive Reasoning": "medium",
            "Situational Judgement / Soft Skills": "medium"
          } : undefined
        });
        setIsViewingPastReport(false);
        setAppState('quiz');
      }, 1000);
    } catch (error) {
      console.error("Mock generation failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate mock assessment. Please try again.");
      setAppState('upload');
    }
  }, [extractedPool, questionProgress, user]);

  const handleStartProcessing = React.useCallback(async (company: string) => {
    if (files.length === 0) return;
    setAppState('processing');
    setProgress(0);
    setProcessingStatus("Initializing...");
    setErrorMessage(null);
    
    let currentPool = [...extractedPool];

    try {
      const resultQuestions = await extractQuestionsFromFiles(
        files, 
        (p, status) => {
          setProgress(p);
          if (status) setProcessingStatus(status);
        }, 
        company,
        (batch) => {
          // Incremental update
          currentPool = deduplicateQuestions([...currentPool, ...batch]);
          setExtractedPool(currentPool);
          
          // Save to cloud incrementally
          if (user && !isFirestoreQuotaExceeded) {
            setDoc(doc(db, 'questionPools', user.uid), { 
              pool: JSON.stringify(currentPool),
              progress: JSON.stringify(questionProgress)
            }, { merge: true }).catch(err => {
              console.error("Incremental sync failed", err);
              // Call handleFirestoreError so quota state updates
              try {
                handleFirestoreError(err, OperationType.WRITE, 'questionPools');
              } catch (e: any) {
                // Ignore the UI error throw from handleFirestoreError during background sync
              }
            });
          }
        },
        extractedPool // Pass existing pool for intelligent skipping
      );
      
      if (currentPool.length === 0 && resultQuestions.length === 0) {
        setErrorMessage("Could not extract any questions from the provided files. Please ensure they contain readable text.");
        setAppState('upload');
        return;
      }

      setAppState('ready');
    } catch (error) {
      console.error("Processing failed:", error);
      // If we already got some questions, we can let them stay in 'ready' state instead of going back to 'upload'
      if (currentPool.length > extractedPool.length) {
        setErrorMessage(`Note: Processing was interrupted (${error instanceof Error ? error.message : "Error"}), but some questions were saved.`);
        setAppState('ready');
      } else {
        setErrorMessage(error instanceof Error ? `Processing failed: ${error.message}` : "An error occurred while processing the files. Please try again.");
        setAppState('upload');
      }
    }
  }, [files, extractedPool, questionProgress, user]);

  const handleStartQuiz = React.useCallback(() => {
    const quizQuestions = generateQuizFromPool(extractedPool, questionProgress, masteryMode, selectedCompany, selectedCategory, selectedDifficulty);
    setQuizState({
      sessionId: Math.random().toString(36).substring(2, 15),
      questions: quizQuestions,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      timeRemaining: quizDuration * 60,
      flaggedQuestions: []
    });
    setIsViewingPastReport(false);
    setAppState('quiz');
  }, [extractedPool, questionProgress, masteryMode, selectedCompany, selectedCategory, selectedDifficulty, quizDuration]);

  const handleQuickStart = React.useCallback(() => {
    // Select 10 random questions from the pool
    const shuffledPool = [...extractedPool].sort(() => Math.random() - 0.5);
    const quizQuestions = shuffledPool.slice(0, 10);
    
    if (quizQuestions.length === 0) {
      alert("No questions available in the pool. Please upload study materials or generate mock assessments first.");
      setAppState('upload');
      return;
    }

    setQuizDuration(5);
    setQuizState({
      sessionId: Math.random().toString(36).substring(2, 15),
      questions: quizQuestions,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      timeRemaining: 5 * 60,
      flaggedQuestions: []
    });
    setIsViewingPastReport(false);
    setAppState('quiz');
  }, [extractedPool]);

  const handleUpgradePool = React.useCallback(async () => {
    try {
      const legacyQuestions = extractedPool.filter(q => q.category === 'Reading Comprehension' && !q.passage && q.question.length > 200);
      if (legacyQuestions.length === 0) return;

      setAppState('processing');
      setProgress(50);
      setProcessingStatus(`Upgrading ${legacyQuestions.length} legacy Reading Comprehension questions...`);

      // Try to migrate them using the LLM helper
      const upgraded = await migrateLegacyQuestions(legacyQuestions);
      
      setProgress(100);
      setProcessingStatus("Format upgrade complete!");

      const updatedPool = extractedPool.map(q => {
        const upgradedQuestion = upgraded.find(u => u.id === q.id);
        if (upgradedQuestion) {
          return upgradedQuestion;
        }
        return q;
      });

      setExtractedPool(updatedPool);
      if (user && !isFirestoreQuotaExceeded) {
        setDoc(doc(db, 'questionPools', user.uid), { 
          pool: JSON.stringify(updatedPool),
          progress: JSON.stringify(questionProgress)
        }, { merge: true }).catch((err) => {
          console.error(err);
        });
      }

      setTimeout(() => {
        setAppState('dashboard');
      }, 1500);

    } catch (e: any) {
      console.error(e);
      alert("Upgrade failed: " + e.message);
      setAppState('dashboard');
    }
  }, [extractedPool, user, questionProgress]);

  const handleLeaveQuiz = React.useCallback(() => {
    if (quizState.sessionId) {
      const cleared = JSON.parse(localStorage.getItem('smartprep_cleared_sessions') || '[]');
      cleared.push(quizState.sessionId);
      localStorage.setItem('smartprep_cleared_sessions', JSON.stringify(cleared.slice(-10))); // keep last 10
      if (quizState.sessionId.startsWith('legacy_')) {
        localStorage.setItem('smartprep_cleared_legacy', 'true');
      }
    } else {
      localStorage.setItem('smartprep_cleared_legacy', 'true');
    }
    
    setQuizState(prev => ({ ...prev, isFinished: true })); // Force clear local storage
    if (user) {
      updateDoc(doc(db, 'questionPools', user.uid), {
        activeSession: deleteField()
      }).catch((err) => {
        console.error("Failed to clear active session from cloud", err);
      });
    }
    setAppState('ready');
  }, [user, quizState.sessionId]);

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
    if (user && !isFirestoreQuotaExceeded) {
      setDoc(doc(db, 'questionPools', user.uid), { 
        pool: JSON.stringify(extractedPool),
        progress: JSON.stringify(newProgress)
      }, { merge: true }).catch((err) => {
        console.error(err);
        try {
          handleFirestoreError(err, OperationType.WRITE, 'questionPools');
        } catch (e: any) {
          setErrorMessage(e.message);
        }
      });
    }
  }, [questionProgress, user, extractedPool]);

  const handleFinishQuiz = React.useCallback(() => {
    updateMasteryProgress(quizState.questions, quizState.answers);
    
    // XP Calculation
    const correctCount = quizState.questions.filter(q => quizState.answers[q.id] === q.answer).length;
    const gainedXp = (correctCount * 50) + 200; // 50 per correct, 200 for finishing
    
    if (user && userProfile && !isFirestoreQuotaExceeded) {
      const newXp = userProfile.xp + gainedXp;
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      const today = new Date().toISOString().split('T')[0];
      const lastActiveDate = userProfile.lastActive?.split('T')[0];
      let newStreak = userProfile.streak;
      
      if (lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActiveDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const updatedProfile = {
        ...userProfile,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActive: new Date().toISOString()
      };
      
      setUserProfile(updatedProfile);
      setDoc(doc(db, 'profiles', user.uid), updatedProfile).catch((err) => {
        console.error(err);
      });

      // Level up celebration!
      if (newLevel > userProfile.level) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b']
        });
      }
    }

    if (quizState.sessionId) {
      const cleared = JSON.parse(localStorage.getItem('smartprep_cleared_sessions') || '[]');
      cleared.push(quizState.sessionId);
      localStorage.setItem('smartprep_cleared_sessions', JSON.stringify(cleared.slice(-10)));
      if (quizState.sessionId.startsWith('legacy_')) {
        localStorage.setItem('smartprep_cleared_legacy', 'true');
      }
    } else {
      localStorage.setItem('smartprep_cleared_legacy', 'true');
    }
    
    if (user) {
      // Clear activeSession unconditionally (even if quota exceeded we try, or at least we don't tie it)
      updateDoc(doc(db, 'questionPools', user.uid), {
        activeSession: deleteField()
      }).catch((err) => {
        console.error("Failed to clear active session from cloud", err);
      });
    }

    setQuizState(prev => ({ ...prev, isFinished: true }));
    setAppState('report');
  }, [quizState.questions, quizState.answers, updateMasteryProgress, user, userProfile, quizState.sessionId]);

  const handleUploadDifferent = React.useCallback(() => {
    setFiles([]);
    setExtractedPool([]);
    setQuestionProgress({});
    
    // Clear from cloud
    if (user && !isFirestoreQuotaExceeded) {
      setDoc(doc(db, 'questionPools', user.uid), { 
        pool: "[]",
        progress: "{}"
      }).catch((err) => {
        console.error(err);
        try {
          handleFirestoreError(err, OperationType.WRITE, 'questionPools');
        } catch (e: any) {
          setErrorMessage(e.message);
        }
      });
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
          flaggedQuestions: []
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

  const handleAddCompany = React.useCallback((company: string) => {
    if (user && userProfile) {
      const updatedProfile = {
        ...userProfile,
        customCompanies: Array.from(new Set([...(userProfile.customCompanies || []), company]))
      };
      setUserProfile(updatedProfile);
      setDoc(doc(db, 'profiles', user.uid), updatedProfile).catch((err) => {
        console.error("Failed to add custom company", err);
      });
    }
  }, [user, userProfile]);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => user && setAppState('dashboard')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Smart-Prep</span>
            {!isOnline && (
              <span className="ml-3 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                Offline
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {batteryLevel !== null && (
              <div 
                className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-full"
                title={isCharging ? "Charging" : `Battery: ${Math.round(batteryLevel * 100)}%`}
              >
                {isCharging ? (
                  <BatteryCharging className="w-4 h-4 text-green-500" />
                ) : batteryLevel > 0.5 ? (
                  <BatteryFull className="w-4 h-4" />
                ) : batteryLevel > 0.2 ? (
                  <BatteryMedium className="w-4 h-4" />
                ) : (
                  <BatteryLow className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs hidden sm:inline">{Math.round(batteryLevel * 100)}%</span>
              </div>
            )}

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

      {batteryLevel !== null && batteryLevel < 0.10 && !isCharging && !dismissedBatteryWarning && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800/50 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start sm:items-center justify-between">
            <div className="flex items-start sm:items-center space-x-3">
              <BatteryWarning className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 sm:mt-0 flex-shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <span className="font-semibold block sm:inline mb-1 sm:mb-0 sm:mr-2">Low Battery Warning ({Math.round(batteryLevel * 100)}%)</span>
                {appState === 'quiz' && hasBatteryAutoSaved ? (
                  <span className="inline-flex items-center gap-1.5 flex-wrap sm:inline">
                    Your current quiz progress has been <span className="font-semibold text-green-700 dark:text-green-400 inline-flex items-center gap-0.5"><CheckCircle2 className="w-4 h-4 inline-block align-text-bottom" /> automatically saved</span> to local storage to prevent data loss. Please connect to a power source.
                  </span>
                ) : (
                  "Please connect to a power source or save your progress before starting a long assessment."
                )}
              </div>
            </div>
            <button 
              onClick={() => setDismissedBatteryWarning(true)}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-lg text-red-600 dark:text-red-400 transition-colors ml-4 flex-shrink-0"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className={cn("flex-1 flex flex-col", appState !== 'quiz' ? "py-8" : "py-4")}>
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
            onQuickStart={handleQuickStart}
            onUpgradePool={handleUpgradePool}
            onViewReport={handleViewReport}
            onOpenStudyHub={() => setAppState('study')}
            errorMessage={errorMessage}
            pool={extractedPool}
            progress={questionProgress}
            userProfile={userProfile}
          />
        )}
        {(appState === 'upload' || appState === 'processing') && (
          <UploadScreen 
            files={files} 
            setFiles={setFiles} 
            onStartProcessing={handleStartProcessing} 
            onGenerateMock={handleGenerateMock}
            customCompanies={userProfile?.customCompanies}
            onAddCompany={handleAddCompany}
            errorMessage={errorMessage} 
            isProcessing={appState === 'processing'}
            processingStatus={processingStatus}
            progress={progress}
          />
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
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            quizDuration={quizDuration}
            setQuizDuration={setQuizDuration}
          />
        )}
        {appState === 'quiz' && (
          <QuizScreen 
            state={quizState} 
            setState={setQuizState} 
            onFinish={handleFinishQuiz} 
            onLeave={handleLeaveQuiz}
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
        {appState === 'study' && user && (
          <StudyHub 
            user={user}
            pool={extractedPool}
            onBack={() => setAppState('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

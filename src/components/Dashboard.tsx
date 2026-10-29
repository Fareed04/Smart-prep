import React, { useEffect, useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirestoreQuotaExceeded, FIRESTORE_DATABASE_UPGRADE_URL, FIRESTORE_PRICING_URL } from '../lib/firebase';
import { getLocalQuizSessions } from './ReportScreen';
import { QuizSession, Question, QuestionProgress, UserProfile } from '../types';
import { Play, TrendingUp, Clock, Target, History, AlertCircle, Award, BookOpen, Flame, Zap, Trophy, Star, Sparkles, Database, ExternalLink, X, CheckCircle2, Building2, ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, parseISO, isSameDay, isToday } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { StudyRoadmap } from './StudyRoadmap';
import { RecentSessionsList } from './RecentSessionsList';
import { cn } from '../lib/utils';

interface DashboardProps {
  onStartNew: () => void;
  onQuickStart: () => void;
  onStartZen?: () => void;
  onUpgradePool?: () => void;
  onViewReport: (session: QuizSession) => void;
  onOpenStudyHub: () => void;
  onOpenCompanyIntel?: (company?: string) => void;
  onPracticeCategory?: (category: string) => void;
  errorMessage?: string | null;
  pool: Question[];
  progress: Record<string, QuestionProgress>;
  userProfile: UserProfile | null;
}

export function Dashboard({ onStartNew, onQuickStart, onStartZen, onUpgradePool, onViewReport, onOpenStudyHub, onOpenCompanyIntel, onPracticeCategory, errorMessage, pool, progress, userProfile }: DashboardProps) {
  const [sessions, setSessions] = useState<QuizSession[]>(() => getLocalQuizSessions());
  const [loading, setLoading] = useState(false);
  const [isFetchingTips, setIsFetchingTips] = useState(false);
  const [studyTips, setStudyTips] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<'history' | 'badges'>('history');
  const [showQuotaBanner, setShowQuotaBanner] = useState(true);

  const fetchStudyTips = async () => {
    setIsFetchingTips(true);
    try {
      const response = await fetch('/api/study-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile, sessions: sessions.slice(0, 5) }),
      });
      const data = await response.json();
      if (data.tips) {
        setStudyTips(data.tips);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingTips(false);
    }
  };

  useEffect(() => {
    // Initial local sessions fallback
    const local = getLocalQuizSessions();
    if (local.length > 0) {
      setSessions(local.map(loc => ({
        ...loc,
        createdAt: loc.createdAt ? new Date(loc.createdAt) : new Date(),
      })));
    }

    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'quizSessions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    let unsubscribe: () => void;
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()),
      })) as QuizSession[];

      // Merge cloud data with locally stored sessions (local sessions have prefix 'local_')
      const merged = [...cloudData];
      const localSessions = getLocalQuizSessions();
      for (const loc of localSessions) {
        const locDate = loc.createdAt ? new Date(loc.createdAt) : new Date();
        const alreadyInCloud = merged.some(m => m.id === loc.id || (m.createdAt && new Date(m.createdAt).getTime() === locDate.getTime()));
        if (!alreadyInCloud) {
          merged.push({
            ...loc,
            createdAt: locDate,
          });
        }
      }
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSessions(merged);
      setLoading(false);
    }, (error) => {
      console.warn("Unable to sync sessions from cloud; using local offline storage:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'quizSessions');
      } catch (e: any) {
        // Quota or network error handled gracefully
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)
    : 0;

  const totalQuestionsAnswered = sessions.reduce((acc, s) => acc + s.totalQuestions, 0);

  const totalPoolSize = pool.length;
  const masteredCount = Object.values(progress).filter(p => p.mastered).length;
  const attemptedCount = Object.keys(progress).length;
  const masteryPercentage = totalPoolSize > 0 ? Math.round((masteredCount / totalPoolSize) * 100) : 0;

  const getRank = (level: number) => {
    if (level >= 76) return "Partner";
    if (level >= 51) return "Director";
    if (level >= 36) return "Senior Manager";
    if (level >= 21) return "Manager";
    if (level >= 11) return "Senior Associate";
    if (level >= 6) return "Associate";
    return "Intern";
  };

  const getRankColor = (level: number) => {
    if (level >= 76) return "text-purple-600 dark:text-purple-400";
    if (level >= 51) return "text-red-600 dark:text-red-400";
    if (level >= 36) return "text-orange-600 dark:text-orange-400";
    if (level >= 21) return "text-amber-600 dark:text-amber-400";
    if (level >= 11) return "text-blue-600 dark:text-blue-400";
    if (level >= 6) return "text-green-600 dark:text-green-400";
    return "text-slate-600 dark:text-slate-400";
  };

  const xpProgress = userProfile ? (userProfile.xp % 1000) / 10 : 0;

  // Calendar logic
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const activeStreakDates: Date[] = [];
  if (userProfile && userProfile.streak > 0 && userProfile.lastActive) {
    const lastActiveDate = parseISO(userProfile.lastActive);
    for (let i = 0; i < userProfile.streak; i++) {
      activeStreakDates.push(subDays(lastActiveDate, i));
    }
  }

  const isDayInStreak = (day: Date) => {
    return activeStreakDates.some(activeDate => isSameDay(activeDate, day));
  };
    
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const questionsAnsweredToday = useMemo(() => {
    return sessions
      .filter(s => isToday(s.createdAt))
      .reduce((total, session) => total + session.totalQuestions, 0);
  }, [sessions]);
    
  const dailyGoal = userProfile?.dailyGoal || 20;
  const goalProgress = Math.min((questionsAnsweredToday / dailyGoal) * 100, 100);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; mastered: number }> = {};
    pool.forEach(q => {
      const cat = q.category || 'General';
      if (!stats[cat]) {
        stats[cat] = { total: 0, mastered: 0 };
      }
      stats[cat].total += 1;
      if (progress[q.id]?.mastered) {
        stats[cat].mastered += 1;
      }
    });

    return Object.entries(stats).map(([category, data]) => {
      return {
        category,
        mastery: data.total > 0 ? (data.mastered / data.total) * 100 : 0,
        total: data.total
      };
    }).sort((a, b) => a.mastery - b.mastery);
  }, [pool, progress]);

  const recommendedCategories = categoryStats.filter(c => c.mastery < 100).slice(0, 3);

  const chartData = [...sessions]
    .slice(0, 10)
    .reverse()
    .map((session) => ({
      name: format(session.createdAt, 'MMM d'),
      score: session.score,
    }));

  const numericalQuestions = pool.filter(q => q.category === 'Numerical Reasoning');
  const masteredNumerical = numericalQuestions.filter(q => progress[q.id]?.mastered).length;
  const isNumericalMaster = numericalQuestions.length > 0 && (masteredNumerical / numericalQuestions.length) >= 0.5;

  const verbalQuestions = pool.filter(q => q.category === 'Verbal Reasoning');
  const masteredVerbal = verbalQuestions.filter(q => progress[q.id]?.mastered).length;
  const isVerbalMaster = verbalQuestions.length > 0 && (masteredVerbal / verbalQuestions.length) >= 0.5;

  const isEarlyBird = sessions.some(s => new Date(s.createdAt).getHours() < 8);
  const isNightOwl = sessions.some(s => new Date(s.createdAt).getHours() >= 22);
  const tenDayStreak = (userProfile?.streak || 0) >= 10;

  const badges = [
    { id: 'first', title: 'First Steps', icon: '🌱', active: sessions.length > 0, desc: 'Complete 1 simulation' },
    { id: 'streak3', title: 'Consistent', icon: '🔥', active: (userProfile?.streak || 0) >= 3, desc: '3-day streak' },
    { id: 'streak10', title: 'Unstoppable', icon: '⚡', active: tenDayStreak, desc: '10-day streak' },
    { id: 'early', title: 'Early Bird Learner', icon: '🌅', active: isEarlyBird, desc: 'Practice before 8 AM' },
    { id: 'night', title: 'Night Owl', icon: '🌙', active: isNightOwl, desc: 'Practice after 10 PM' },
    { id: 'numerical', title: 'Numbers Whiz', icon: '🧮', active: isNumericalMaster, desc: 'Master 50% of Numerical' },
    { id: 'verbal', title: 'Wordsmith', icon: '📖', active: isVerbalMaster, desc: 'Master 50% of Verbal' },
    { id: 'master5', title: 'Rising Star', icon: '⭐', active: masteredCount >= 5, desc: 'Master 5 questions' },
  ];

  const userDisplayName = auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : '');

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back{userDisplayName ? `, ${userDisplayName}` : ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Ready to continue your preparation?</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {userProfile && (
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className={`w-5 h-5 ${userProfile.streak > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{userProfile.streak} Day Streak</div>
              </div>
            </div>
          )}

          {userProfile && (
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Award className={`w-5 h-5 ${getRankColor(userProfile.level)}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{getRank(userProfile.level)}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Level {userProfile.level}</div>
              </div>
            </div>
          )}

          <button
            onClick={onQuickStart}
            className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-2xl font-bold transition-all border border-slate-200 dark:border-slate-700"
          >
            <Zap className="w-5 h-5 text-amber-500 fill-current" />
            <span>Quick 15 Qs</span>
          </button>

          <button
            onClick={onStartZen ? onStartZen : onStartNew}
            className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-5 py-3 rounded-2xl font-bold transition-all border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs group"
            title="Start a distraction-free Zen Assessment"
          >
            <Sparkles className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Zen Quiz</span>
          </button>

          {onOpenCompanyIntel && (
            <button
              onClick={() => onOpenCompanyIntel('KPMG')}
              className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-5 py-3 rounded-2xl font-bold transition-all border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs group"
              title="Research organization background, culture & assessment style"
            >
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Company Intel</span>
            </button>
          )}
          
          <button
            onClick={onStartNew}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-sm hover:shadow group"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>New Simulation</span>
          </button>
        </div>
      </div>

      {isFirestoreQuotaExceeded && showQuotaBanner && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 sm:p-5 relative shadow-xs">
          <button
            onClick={() => setShowQuotaBanner(false)}
            aria-label="Dismiss banner"
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start space-x-3.5 pr-6">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300">
                  Offline Mode Active
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Daily Cloud Write Quota Reached</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                The free daily write limit for this Firestore project database has been reached. <strong>Your assessments, scores, answers, and study progress are safely preserved locally on this device</strong>. Cloud database synchronization will resume automatically when limits reset tomorrow.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <a
                  href={FIRESTORE_DATABASE_UPGRADE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 font-semibold text-amber-800 dark:text-amber-300 hover:underline"
                >
                  <span>Open Firebase Upgrade / Quota Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <a
                  href={FIRESTORE_PRICING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 font-medium text-slate-600 dark:text-slate-400 hover:underline"
                >
                  <span>Firebase Spark Pricing & Limits</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && !errorMessage.includes("quota") && !errorMessage.includes("Quota") && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-start space-x-3 border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {studyTips && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-24 h-24 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="relative z-10 flex items-start space-x-4">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm shrink-0">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Study Recommendations</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-blue">
                <Markdown>{studyTips}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Employer Background Research & Intelligence Dossier */}
      {onOpenCompanyIntel && (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Company Background & Culture Dossier</span>
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Assessment & Interview Prep Engine
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Organization Background Research
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Most top organizations look closely to see whether you've done your homework on their business model, values, and strategic direction. Generate comprehensive intelligence reports with values fit matrices, recent 2024–2026 strategic bets, "Why Us?" talking points, and smart reverse interview questions.
              </p>

              {/* Quick Preset Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Quick presets:</span>
                {[
                  { name: 'KPMG', label: 'KPMG' },
                  { name: 'PwC', label: 'PwC' },
                  { name: 'Deloitte', label: 'Deloitte' },
                  { name: 'EY', label: 'EY' },
                  { name: 'Goldman Sachs', label: 'Goldman Sachs' },
                  { name: 'McKinsey', label: 'McKinsey' },
                  { name: 'Google', label: 'Google' },
                ].map(comp => (
                  <button
                    key={comp.name}
                    onClick={() => onOpenCompanyIntel(comp.name)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-emerald-500/30 text-slate-200 hover:text-white border border-white/10 hover:border-emerald-400/40 transition-all cursor-pointer"
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-64">
              <button
                onClick={() => onOpenCompanyIntel('KPMG')}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer text-sm"
              >
                <Building2 className="w-4 h-4" />
                <span>Research KPMG</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => onOpenCompanyIntel()}
                className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-2xl transition-all border border-white/15 cursor-pointer text-xs"
              >
                <span>Research Custom Employer...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BALANCED BENTO GRID: Rows designed to avoid dangling columns or bottom void */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* ROW 1: Hero Roadmap (8 cols) & Daily Goal + Progression (4 cols) */}
        <div className="xl:col-span-8 flex flex-col justify-between">
          <StudyRoadmap
            pool={pool}
            progress={progress}
            sessions={sessions}
            userProfile={userProfile}
            onPracticeCategory={onPracticeCategory}
            onOpenStudyHub={onOpenStudyHub}
          />
        </div>

        <div className="xl:col-span-4 space-y-6 flex flex-col justify-between">
          {/* Daily Goal Card */}
          {userProfile && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
              <div className="space-y-3 w-full max-w-sm text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Target className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily Target</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Target: {dailyGoal} questions today</p>
                <div className="flex justify-center my-3">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        className="stroke-slate-100 dark:stroke-slate-800" 
                        strokeWidth="8" 
                        fill="none" 
                      />
                      <motion.circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        className="stroke-emerald-500" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40}`}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - goalProgress / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {goalProgress >= 100 ? (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1.5, type: 'spring' }}
                          className="text-emerald-500 text-center"
                        >
                          <Trophy className="w-8 h-8 fill-current mx-auto" />
                          <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">Goal Met!</span>
                        </motion.div>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{questionsAnsweredToday}</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ {dailyGoal}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {goalProgress >= 100 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Outstanding! Daily objective achieved.</span>
                  ) : (
                    <span>{dailyGoal - questionsAnsweredToday} more to reach your target!</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Unified Level XP & Pool Mastery Progression Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            {/* Level XP */}
            {userProfile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Level {userProfile.level} Progression</div>
                      <div className="text-[10px] text-slate-500">{userProfile.xp % 1000} / 1000 XP</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{Math.round(xpProgress)}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Pool Mastery */}
            {totalPoolSize > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Question Bank Mastery</div>
                      <div className="text-[10px] text-slate-500">{masteredCount} of {totalPoolSize} mastered</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{masteryPercentage}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${masteryPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Stats & Performance Trends (8 cols) & Monthly Streak Calendar (4 cols) */}
        <div className="xl:col-span-8 space-y-4 flex flex-col justify-between">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{averageScore}%</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pool Size</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalPoolSize}</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Answers</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalQuestionsAnswered}</div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Trend (Last 10)</h2>
              </div>
              {sessions.length > 0 && (
                <span className="text-xs text-slate-500">Latest: {sessions[0].score}%</span>
              )}
            </div>
            <div className="h-48 sm:h-52 w-full">
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  Complete your first assessment to view performance trends
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Streak Calendar in Row 2 (Right side) */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>{format(today, 'MMMM yyyy')}</span>
            </h2>
            {userProfile && userProfile.streak > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">
                {userProfile.streak}d Streak
              </span>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-[10px] font-bold text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm flex-1">
            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="p-0.5" />
            ))}
            {monthDays.map(day => {
              const active = isDayInStreak(day);
              const todayMark = isToday(day);
              return (
                <div 
                  key={format(day, 'yyyy-MM-dd')}
                  className="aspect-square flex items-center justify-center p-0.5"
                >
                  <div className={`w-full h-full rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                    active 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-amber-400 dark:ring-amber-500' 
                      : todayMark
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-400 dark:border-blue-600'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Practice Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-blue-500 inline-block" />
              Today
            </span>
          </div>
        </div>

        {/* ROW 3: Recent Sessions (8 cols) & Professional Badges (4 cols) */}
        <div className="xl:col-span-8 flex flex-col justify-between">
          <RecentSessionsList
            sessions={sessions}
            loading={loading}
            onViewReport={onViewReport}
            onStartNew={onStartNew}
            onQuickStart={onQuickStart}
          />
        </div>

        {/* Professional Badges in Row 3 (4 cols) - BALANCED & RESPONSIVE */}
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Achievements & Badges</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Milestones earned through quiz mastery</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/60 dark:border-blue-800/60">
              {badges.filter(b => b.active).length} / {badges.length} Unlocked
            </span>
          </div>

          <div className="p-4 overflow-y-auto flex-1 overscroll-contain-y gpu-scroll space-y-2.5" data-lenis-prevent>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={cn(
                    "p-3 rounded-2xl border transition-all flex items-center space-x-3",
                    badge.active 
                      ? "bg-blue-50/70 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-2xs" 
                      : "bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/80 opacity-60"
                  )}
                >
                  <div className={cn(
                    "text-2xl shrink-0 p-2 rounded-xl shadow-2xs",
                    badge.active ? "bg-white dark:bg-slate-800" : "bg-slate-100 dark:bg-slate-800 grayscale"
                  )}>
                    {badge.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{badge.title}</span>
                      {badge.active && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

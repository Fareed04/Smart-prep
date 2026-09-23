import React, { useEffect, useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { QuizSession, Question, QuestionProgress, UserProfile } from '../types';
import { Play, TrendingUp, Clock, Target, History, AlertCircle, Award, BookOpen, Flame, Zap, Trophy, Star, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, parseISO, isSameDay, isToday } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { StudyRoadmap } from './StudyRoadmap';

interface DashboardProps {
  onStartNew: () => void;
  onQuickStart: () => void;
  onUpgradePool?: () => void;
  onViewReport: (session: QuizSession) => void;
  onOpenStudyHub: () => void;
  onPracticeCategory?: (category: string) => void;
  errorMessage?: string | null;
  pool: Question[];
  progress: Record<string, QuestionProgress>;
  userProfile: UserProfile | null;
}

export function Dashboard({ onStartNew, onQuickStart, onUpgradePool, onViewReport, onOpenStudyHub, onPracticeCategory, errorMessage, pool, progress, userProfile }: DashboardProps) {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingTips, setIsFetchingTips] = useState(false);
  const [studyTips, setStudyTips] = useState<string | null>(null);

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
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'quizSessions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    let unsubscribe: () => void;
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as QuizSession[];
      setSessions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sessions:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'quizSessions');
      } catch (e: any) {
        console.error("Dashboard Quota/Firestore Error:", e.message);
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
    <div className="max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-500">
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
            onClick={onStartNew}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-sm hover:shadow group"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>New Simulation</span>
          </button>
        </div>
      </div>

      {errorMessage && (
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
        <div className="xl:col-span-8 space-y-6 flex flex-col justify-between">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
              <div className="p-3.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Score</div>
                <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{averageScore}%</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
              <div className="p-3.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pool Size</div>
                <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{totalPoolSize}</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
              <div className="p-3.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Answers</div>
                <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{totalQuestionsAnswered}</div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Trend (Last 10)</h2>
              </div>
              {sessions.length > 0 && (
                <span className="text-xs text-slate-500">Latest: {sessions[0].score}%</span>
              )}
            </div>
            <div className="h-60 w-full">
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
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>{format(today, 'MMMM yyyy')}</span>
            </h2>
            {userProfile && userProfile.streak > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-full">
                {userProfile.streak}d Streak
              </span>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-xs font-bold text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-sm flex-1">
            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="p-1" />
            ))}
            {monthDays.map(day => {
              const active = isDayInStreak(day);
              const todayMark = isToday(day);
              return (
                <div 
                  key={format(day, 'yyyy-MM-dd')}
                  className="aspect-square flex items-center justify-center p-0.5"
                >
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                    active 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-2 ring-amber-400 dark:ring-amber-500' 
                      : todayMark
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold border-2 border-blue-400 dark:border-blue-600'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Practice Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-blue-500 inline-block" />
              Today
            </span>
          </div>
        </div>

        {/* ROW 3: Recent Activity (7 cols) & Professional Badges (5 cols) - BALANCED BOTTOM! */}
        <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[420px] overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Simulation History</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
              {sessions.length} {sessions.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-3 sm:p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading activity...</div>
            ) : sessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center">
                  <History className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">No Simulation History Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm">Take your first 15-minute mock assessment or category practice to track your progress.</p>
                <button
                  onClick={onStartNew}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Start First Simulation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <button 
                    key={session.id} 
                    onClick={() => onViewReport(session)}
                    className="w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {format(session.createdAt, 'MMM d, yyyy')}
                        </span>
                        {session.company && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            {session.company}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {Math.floor(session.timeTaken / 60)}m {session.timeTaken % 60}s
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {session.categoriesAttempted.join(' · ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <div className={`text-base font-black ${session.score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {session.score}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {session.correctAnswers}/{session.totalQuestions}
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-slate-100 group-hover:bg-blue-600 dark:bg-slate-800 dark:group-hover:bg-blue-600 text-slate-600 group-hover:text-white dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                        <span>Review</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Professional Badges in Row 3 (5 cols) - MATCHING HEIGHT! */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[420px] overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Achievements & Badges</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {badges.filter(b => b.active).length} / {badges.length} Unlocked
            </span>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border ${
                    badge.active 
                      ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-sm' 
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 grayscale opacity-60'
                  } flex items-center space-x-3 transition-all`}
                >
                  <div className="text-2xl shrink-0 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-xs">{badge.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{badge.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 4: Grounding Quick Action Bar at the Bottom */}
      <div className="bg-slate-900 dark:bg-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg font-bold">Sharpen Specific Assessment Domains</h3>
          <p className="text-xs text-slate-400">Launch a targeted rapid-fire module or explore deep AI study guides.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {['Numerical Reasoning', 'Verbal Reasoning', 'Logical Reasoning', 'Situational Judgement'].map((category) => (
            <button
              key={category}
              onClick={() => onPracticeCategory?.(category)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {category}
            </button>
          ))}
          <button
            onClick={onOpenStudyHub}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm ml-1"
          >
            Study Guides →
          </button>
        </div>
      </div>
    </div>
  );
}

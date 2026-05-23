import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { QuizSession, Question, QuestionProgress, UserProfile } from '../types';
import { Play, TrendingUp, Clock, Target, History, AlertCircle, Award, BookOpen, Flame, Zap, Trophy, Star } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  onStartNew: () => void;
  onViewReport: (session: QuizSession) => void;
  onOpenStudyHub: () => void;
  errorMessage?: string | null;
  pool: Question[];
  progress: Record<string, QuestionProgress>;
  userProfile: UserProfile | null;
}

export function Dashboard({ onStartNew, onViewReport, onOpenStudyHub, errorMessage, pool, progress, userProfile }: DashboardProps) {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);

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
        // App.tsx will handle the errorMessage via state if we wanted to be perfectly clean,
        // but let's just log it here for now or we could pass a setError to Dashboard.
        console.error("Dashboard Quota/Firestore Error:", e.message);
      }
      setLoading(false);
      if (unsubscribe) unsubscribe();
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

  const chartData = [...sessions]
    .slice(0, 10)
    .reverse()
    .map((session) => ({
      name: format(session.createdAt, 'MMM d'),
      score: session.score,
    }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          {userProfile && (
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {userProfile.level}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-950">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {auth.currentUser?.displayName?.split(' ')[0] || 'User'}</h1>
              {userProfile && (
                 <span className={`px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold uppercase tracking-widest ${getRankColor(userProfile.level)}`}>
                   {getRank(userProfile.level)}
                 </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Ready to continue your assessment prep?</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {userProfile && (
            <div className="flex items-center space-x-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-800/50">
              <Flame className="w-5 h-5 fill-current" />
              <span className="font-bold text-lg">{userProfile.streak}</span>
              <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Day Streak</span>
            </div>
          )}
          <button
            onClick={onOpenStudyHub}
            className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Study Hub</span>
          </button>
          <button
            onClick={onStartNew}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          >
            <Play className="w-5 h-5" />
            <span>Simulation</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Gamified Progress row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* XP Progress */}
        {userProfile && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
             <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Experience Points</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Level up at {((Math.floor(userProfile.xp / 1000) + 1) * 1000)} XP</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userProfile.xp.toLocaleString()}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total XP</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-blue-600"
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>{userProfile.xp % 1000} / 1000 XP for Level {userProfile.level + 1}</span>
                <span>{Math.round(xpProgress)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Mastery Progress */}
        {totalPoolSize > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mastery Progress</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{masteredCount} of {totalPoolSize} mastered</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{masteryPercentage}%</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mastery</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${masteryPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-amber-500"
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                 <span>Master the entire pool to earn "Prep Legend"</span>
                <span>{masteryPercentage}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Achievements / Badges */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center space-x-2">
          <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Professional Badges</span>
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'first', title: 'First Steps', icon: '🌱', active: sessions.length > 0, desc: 'Complete 1 simulation' },
            { id: 'streak', title: 'Consistent', icon: '🔥', active: (userProfile?.streak || 0) >= 3, desc: '3-day streak' },
            { id: 'master', title: 'Assessment Specialist', icon: '🎓', active: masteryPercentage >= 50, desc: '50% Mastery' },
            { id: 'perfect', title: 'Flawless', icon: '💎', active: sessions.some(s => s.score === 100), desc: '100% Score' }
          ].map((badge) => (
            <div 
              key={badge.id}
              className={`p-4 rounded-2xl border text-center transition-all duration-300 ${
                badge.active 
                  ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 grayscale-0 opacity-100 shadow-sm' 
                  : 'border-slate-100 dark:border-slate-800 opacity-40 grayscale'
              }`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">{badge.title}</div>
              <div className="text-[9px] text-slate-500 line-clamp-1">{badge.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Score</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{averageScore}%</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pool Size</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalPoolSize}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center space-x-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Answers</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalQuestionsAnswered}</div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Performance Trend (Last 10)</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Progress Report / History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            <span>Progress Report</span>
          </h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading history...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full mb-2">
              <History className="w-8 h-8" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">No simulations yet</p>
            <p className="text-slate-500 dark:text-slate-400">Start a new simulation to see your progress here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((session) => (
              <button 
                key={session.id} 
                onClick={() => onViewReport(session)}
                className="w-full text-left p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {format(session.createdAt, 'MMM d, yyyy • h:mm a')}
                    </span>
                    {session.company && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md uppercase tracking-wider">
                        {session.company}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                    {session.categoriesAttempted.map(cat => (
                      <span key={cat} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">{cat}</span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Time</div>
                    <div className="font-medium text-slate-900 dark:text-white">{Math.floor(session.timeTaken / 60)}m {session.timeTaken % 60}s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Score</div>
                    <div className={`text-xl font-bold ${session.score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {session.score}%
                    </div>
                  </div>
                  <div className="text-slate-400 group-hover:text-blue-600 transition-colors hidden md:block">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  );
}

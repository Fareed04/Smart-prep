import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { QuizSession, Question, QuestionProgress } from '../types';
import { Play, TrendingUp, Clock, Target, History, AlertCircle, Award, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  onStartNew: () => void;
  onViewReport: (session: QuizSession) => void;
  errorMessage?: string | null;
  pool: Question[];
  progress: Record<string, QuestionProgress>;
}

export function Dashboard({ onStartNew, onViewReport, errorMessage, pool, progress }: DashboardProps) {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'quizSessions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as QuizSession[];
      setSessions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sessions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)
    : 0;

  const totalQuestionsAnswered = sessions.reduce((acc, s) => acc + s.totalQuestions, 0);

  const totalPoolSize = pool.length;
  const masteredCount = Object.values(progress).filter(p => p.mastered).length;
  const attemptedCount = Object.keys(progress).length;
  const masteryPercentage = totalPoolSize > 0 ? Math.round((masteredCount / totalPoolSize) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {auth.currentUser?.displayName?.split(' ')[0] || 'User'}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Ready to continue your KPMG assessment prep?</p>
        </div>
        <button
          onClick={onStartNew}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
          <Play className="w-5 h-5" />
          <span>Start New Simulation</span>
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Mastery Progress */}
      {totalPoolSize > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mastery Progress</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Memorize all {totalPoolSize} questions in your pool</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{masteryPercentage}%</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Mastery</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{masteredCount} Mastered</span>
              <span className="text-slate-400 dark:text-slate-500">{attemptedCount} Attempted • {totalPoolSize} Total</span>
            </div>
          </div>
        </div>
      )}

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
                  <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {format(session.createdAt, 'MMM d, yyyy • h:mm a')}
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

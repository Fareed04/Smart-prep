import React, { useEffect, useState } from 'react';
import { Trophy, Target, AlertCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { QuizState } from '../types';
import confetti from 'canvas-confetti';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface ReportScreenProps {
  state: QuizState;
  onRestart: () => void;
  onDashboard: () => void;
  isViewingPastReport?: boolean;
}

export function ReportScreen({ state, onRestart, onDashboard, isViewingPastReport = false }: ReportScreenProps) {
  const totalQuestions = state.questions.length;
  const correctAnswers = state.questions.filter(q => state.answers[q.id] === q.answer).length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const timeTaken = (60 * 60) - state.timeRemaining;
  const [isSaved, setIsSaved] = useState(isViewingPastReport);

  useEffect(() => {
    if (score >= 70 && !isViewingPastReport) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Save to Firestore
    const saveSession = async () => {
      if (!auth.currentUser || isSaved || isViewingPastReport) return;
      
      try {
        const categories = Array.from(new Set(state.questions.map(q => q.category)));
        
        await addDoc(collection(db, 'quizSessions'), {
          userId: auth.currentUser.uid,
          score,
          correctAnswers,
          totalQuestions,
          timeTaken,
          categoriesAttempted: categories,
          questions: JSON.stringify(state.questions),
          answers: JSON.stringify(state.answers),
          createdAt: serverTimestamp()
        });
        setIsSaved(true);
      } catch (error) {
        console.error("Error saving quiz session:", error);
      }
    };

    saveSession();
  }, [score, correctAnswers, totalQuestions, timeTaken, state.questions, isSaved]);

  // Calculate weakness report
  const categoryStats = state.questions.reduce((acc, q) => {
    if (!acc[q.category]) {
      acc[q.category] = { total: 0, correct: 0 };
    }
    acc[q.category].total++;
    if (state.answers[q.id] === q.answer) {
      acc[q.category].correct++;
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number }>);

  const weaknesses = Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      score: (stats.correct / stats.total) * 100,
      total: stats.total
    }))
    .filter(stat => stat.score < 70)
    .sort((a, b) => a.score - b.score);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mb-4">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Simulation Complete</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Here's how you performed on the KPMG assessment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Final Score</div>
          <div className="text-5xl font-bold text-slate-900 dark:text-white">{score}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correct</div>
          <div className="text-5xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">out of {totalQuestions}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Time Used</div>
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Weakness Report</span>
          </h2>
        </div>
        <div className="p-6">
          {weaknesses.length > 0 ? (
            <div className="space-y-6">
              {weaknesses.map((w, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-900 dark:text-white">{w.category}</span>
                    <span className="text-red-600 dark:text-red-400">{Math.round(w.score)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 dark:bg-red-400 rounded-full"
                      style={{ width: `${w.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    You need more practice here. Focus on "Work Smarter" tactics for this section.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">Excellent Work!</p>
              <p className="text-slate-600 dark:text-slate-400">You scored above 70% in all categories.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <button
          onClick={onDashboard}
          className="flex items-center justify-center space-x-2 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <span>Back to Dashboard</span>
        </button>
        <button
          onClick={onRestart}
          className="flex items-center justify-center space-x-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg hover:shadow-xl"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Start New Simulation</span>
        </button>
      </div>
    </div>
  );
}

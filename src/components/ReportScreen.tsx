import React, { useEffect, useState } from 'react';
import { Trophy, Target, AlertCircle, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
import { QuizState } from '../types';
import confetti from 'canvas-confetti';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

interface ReportScreenProps {
  state: QuizState;
  onRestart: () => void;
  onDashboard: () => void;
  isViewingPastReport?: boolean;
  company?: string;
}

export function ReportScreen({ state, onRestart, onDashboard, isViewingPastReport = false, company }: ReportScreenProps) {
  const totalQuestions = state.questions.length;
  const correctAnswers = state.questions.filter(q => state.answers[q.id] === q.answer).length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const timeTaken = (60 * 60) - state.timeRemaining;
  const [isSaved, setIsSaved] = useState(isViewingPastReport);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveInProgress = React.useRef(false);

  // XP is calculated in App.tsx but we can mirror the logic here for display
  const gainedXp = (correctAnswers * 50) + 200;

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
      if (!auth.currentUser || isSaved || isViewingPastReport || saveInProgress.current) return;
      
      saveInProgress.current = true;
      try {
        const categories = Array.from(new Set(state.questions.map(q => q.category)));
        
        await addDoc(collection(db, 'quizSessions'), {
          userId: auth.currentUser.uid,
          score,
          correctAnswers,
          totalQuestions,
          timeTaken,
          categoriesAttempted: categories,
          company: company || 'All',
          questions: JSON.stringify(state.questions),
          answers: JSON.stringify(state.answers),
          createdAt: serverTimestamp()
        });
        setIsSaved(true);
      } catch (error) {
        console.error("Error saving quiz session:", error);
        saveInProgress.current = false;
        try {
          handleFirestoreError(error, OperationType.WRITE, 'quizSessions');
        } catch (e: any) {
          setSaveError(e.message);
        }
      }
    };

    saveSession();
  }, [score, correctAnswers, totalQuestions, timeTaken, state.questions, isSaved, isViewingPastReport, company]);

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
    .filter(stat => stat.score < 80) // Consider a weakness if below 80%
    .sort((a, b) => a.score - b.score)
    .slice(0, 3); // Top 1-3 categories

  const getActionableAdvice = (category: string) => {
    const adviceMap: Record<string, string> = {
      'Numerical Reasoning': 'Brush up on mental math shortcuts and percentage calculations. Practice GMAT-style Quantitative questions.',
      'Data Analysis': 'Focus on reading charts and tables quickly. Practice identifying trends and performing multi-step calculations.',
      'Reading Comprehension': 'Improve your reading speed and focus on identifying the main point. Look for signal words in the text.',
      'Sentence Correction': 'Review core grammar rules (Subject-Verb Agreement, Parallelism). Practice identifying "conciseness" errors.',
      'Antonyms/Synonyms': 'Build your vocabulary through consistent reading. Focus on understanding word roots and context clues.',
      'Critical Reasoning': 'Learn to map arguments. Practice identifying assumptions and weakening/strengthening factors.',
      'Current Affairs': 'Review Nigerian and global political/economic facts for 2024-2026. Focus on key leadership and policy changes.',
      'Soft Skills / Situational Judgment': 'Study generic core values and professional ethics. Focus on empathy, leadership, and conflict resolution.',
    };
    return adviceMap[category] || 'You need more practice here. Focus on "Work Smarter" tactics for this section.';
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mb-4">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Simulation Complete</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Here's how you performed on the {company ? `${company} ` : ''}assessment.</p>
      </div>

      {saveError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Warning: {saveError} (Your results are shown below but might not be saved to your history).</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Final Score</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{score}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Correct</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">/{totalQuestions}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Time Used</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {Math.floor(timeTaken / 60)}m
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{timeTaken % 60}s</div>
        </div>
        {!isViewingPastReport && (
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg border border-blue-500 text-center text-white relative overflow-hidden group">
            <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-blue-500/20 group-hover:scale-110 transition-transform duration-500" />
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">XP Gained</div>
            <div className="text-3xl font-bold relative z-10">+{gainedXp}</div>
            <div className="text-[10px] opacity-80 relative z-10">Experience Points</div>
          </div>
        )}
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
                    {getActionableAdvice(w.category)}
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
              <p className="text-slate-600 dark:text-slate-400">You scored above 80% in all categories.</p>
            </div>
          )}
        </div>
      </div>

      {state.flaggedQuestions && state.flaggedQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
              <span>Flagged for Review</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Questions you marked as difficult during the simulation.</p>
          </div>
          <div className="p-6 space-y-6">
            {state.flaggedQuestions.map((flaggedId, index) => {
              const question = state.questions.find(q => q.id === flaggedId);
              if (!question) return null;
              const isCorrect = state.answers[question.id] === question.answer;
              
              return (
                <div key={question.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                       <span className="font-semibold text-slate-900 dark:text-white">Q{index + 1}</span>
                       <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">{question.category}</span>
                    </div>
                    {isCorrect ? (
                      <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1"/> Correct</span>
                    ) : (
                      <span className="flex items-center text-xs font-medium text-red-600 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1"/> Incorrect</span>
                    )}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-sm line-clamp-2 mb-3">
                    {question.question.substring(0, 150)}...
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800">
                     <span className="font-semibold text-amber-600 dark:text-amber-400">Work Smarter: </span>
                     {question.explanation.substring(0, 100)}...
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

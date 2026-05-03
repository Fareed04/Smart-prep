import React, { useState, useEffect } from 'react';
import { Clock, Lightbulb, ChevronRight, ChevronLeft, CheckCircle2, Pause, Play, X, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question, QuizState } from '../types';
import { cn } from '../lib/utils';
import { Calculator } from './Calculator';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirestoreQuotaExceeded } from '../lib/firebase';

interface QuizScreenProps {
  state: QuizState;
  setState: React.Dispatch<React.SetStateAction<QuizState>>;
  onFinish: () => void;
  onLeave: () => void;
}

const MarkdownComponents = {
  table: ({node, ...props}: any) => (
    <div className="overflow-x-auto w-full">
      <table {...props} className="w-full whitespace-nowrap sm:whitespace-normal" />
    </div>
  )
};

export function QuizScreen({ state, setState, onFinish, onLeave }: QuizScreenProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  const currentQuestion = state.questions[state.currentIndex];

  const stateRef = React.useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const saveProgress = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || isFinishing || stateRef.current.isFinished || isFirestoreQuotaExceeded) return;
      try {
        await updateDoc(doc(db, 'questionPools', currentUser.uid), {
           activeSession: JSON.stringify(stateRef.current)
        });
      } catch (error) {
        console.error("Failed to auto-save progress", error);
        try {
          handleFirestoreError(error, OperationType.UPDATE, `questionPools/${currentUser.uid}`);
        } catch (e) {
          // Just log it for auto-save, don't interrupt user
          console.error("Critical Firestore Error during auto-save:", e);
        }
      }
    };
    
    // Save progress periodically (e.g., every 15 seconds)
    const saveInterval = setInterval(saveProgress, 15000);
    return () => clearInterval(saveInterval);
  }, [isFinishing]);

  const handleFinish = React.useCallback(() => {
    if (isFinishing) return;
    setIsFinishing(true);
    onFinish();
  }, [isFinishing, onFinish]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setState((prev) => {
          if (prev.timeRemaining <= 0) {
            clearInterval(timer);
            handleFinish();
            return prev;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [handleFinish, setState, isPaused]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = React.useCallback((option: string) => {
    if (isAnswerChecked || isPaused || isFinishing) return;
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: option },
    }));
  }, [isAnswerChecked, isPaused, isFinishing, currentQuestion.id, setState]);

  const handleCheckAnswer = React.useCallback(() => {
    if (!state.answers[currentQuestion.id] || isPaused || isFinishing) return;
    setIsAnswerChecked(true);
  }, [state.answers, currentQuestion.id, isPaused, isFinishing]);

  const handleNext = React.useCallback(() => {
    if (isFinishing) return;
    setShowExplanation(false);
    setIsAnswerChecked(false);
    if (state.currentIndex < state.questions.length - 1) {
      setState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      handleFinish();
    }
  }, [isFinishing, state.currentIndex, state.questions.length, handleFinish, setState]);

  const handlePrev = React.useCallback(() => {
    if (state.currentIndex > 0) {
      setShowExplanation(false);
      setIsAnswerChecked(!!state.answers[state.questions[state.currentIndex - 1].id]);
      setState((prev) => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  }, [state.currentIndex, state.answers, state.questions, setState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (isPaused || isFinishing) return;

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isAnswerChecked && state.answers[currentQuestion.id]) {
          handleCheckAnswer();
        } else if (isAnswerChecked) {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (!isAnswerChecked) {
        const keyMap: Record<string, number> = {
          '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
          'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4
        };
        const index = keyMap[e.key.toLowerCase()];
        if (index !== undefined && index < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isFinishing, isAnswerChecked, state.answers, currentQuestion, handleCheckAnswer, handleNext, handlePrev, handleOptionSelect]);

  const selectedOption = state.answers[currentQuestion.id];
  const isCorrect = selectedOption === currentQuestion.answer;

  const toggleFlag = () => {
    setState(prev => {
      const isFlagged = prev.flaggedQuestions?.includes(currentQuestion.id);
      return {
        ...prev,
        flaggedQuestions: isFlagged
          ? prev.flaggedQuestions.filter(id => id !== currentQuestion.id)
          : [...(prev.flaggedQuestions || []), currentQuestion.id]
      };
    });
  };

  const isCurrentFlagged = state.flaggedQuestions?.includes(currentQuestion.id);

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
           <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
            Question {state.currentIndex + 1} of {state.questions.length}
          </div>
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
            {currentQuestion.category}
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={toggleFlag}
            className={cn(
              "p-2 rounded-full transition-colors flex items-center space-x-1 px-3",
              isCurrentFlagged 
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={isCurrentFlagged ? "Remove Flag" : "Flag for Review"}
          >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isCurrentFlagged ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
           <span className="hidden sm:inline text-sm font-medium">{isCurrentFlagged ? 'Flagged' : 'Flag'}</span>
          </button>
          <button
            onClick={() => setShowLeaveConfirmation(true)}
            className="p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
            title="Leave Simulation"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={isPaused ? "Resume Simulation" : "Pause Simulation"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <div className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-full font-mono font-medium text-base sm:text-lg transition-colors",
            state.timeRemaining > 0 && state.timeRemaining <= 300 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
          )}>
            <Clock className={cn("w-4 h-4 sm:w-5 sm:h-5", state.timeRemaining > 0 && state.timeRemaining <= 300 && "animate-pulse")} />
            <span>{formatTime(state.timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {state.timeRemaining > 0 && state.timeRemaining <= 300 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium">Less than 5 minutes remaining! Please review your answers before the simulation ends.</p>
        </div>
      )}

      {/* Question Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
        {isPaused && (
          <div className="absolute inset-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center">
            <Pause className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Simulation Paused</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">The timer has been stopped.</p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Resume Simulation</span>
            </button>
          </div>
        )}

        <div className="p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-table:my-4 prose-th:p-2 prose-td:p-2">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {currentQuestion.question}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="p-5 sm:p-8 bg-slate-50 dark:bg-slate-800/50 space-y-3">
          {currentQuestion.options.map((option, i) => {
            const isSelected = selectedOption === option;
            let optionClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300";
            
            if (isAnswerChecked) {
              if (option === currentQuestion.answer) {
                optionClass = "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
              } else if (isSelected) {
                optionClass = "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
              } else {
                optionClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-50";
              }
            } else if (isSelected) {
              optionClass = "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-600 dark:ring-blue-500";
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswerChecked || isPaused}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between",
                  optionClass
                )}
              >
                <span className="text-base sm:text-lg">{option}</span>
                {isAnswerChecked && option === currentQuestion.answer && (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Explanation */}
      <div className="space-y-6">
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={state.currentIndex === 0 || isPaused}
            className="flex items-center justify-center space-x-2 px-6 py-3 text-slate-600 dark:text-slate-400 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {!isAnswerChecked ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption || isPaused}
              className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md w-full sm:w-auto"
            >
              Check Answer
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                disabled={isPaused}
                className={cn(
                  "flex items-center justify-center space-x-2 px-6 py-3 font-medium rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto",
                  showExplanation ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Lightbulb className={cn("w-5 h-5", showExplanation ? "text-amber-600 dark:text-amber-400" : "text-amber-500")} />
                <span>Work Smarter</span>
              </button>
              <button
                onClick={handleNext}
                disabled={isPaused}
                className="flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md w-full sm:w-auto"
              >
                <span>{state.currentIndex === state.questions.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {showExplanation && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 animate-in slide-in-from-top-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg shrink-0">
                <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2 max-w-full overflow-hidden">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300">AI Explanation & Strategy</h3>
                <div className="text-amber-800 dark:text-amber-200/80 leading-relaxed whitespace-pre-wrap prose prose-amber dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentQuestion.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Leave Simulation?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Are you sure you want to leave this simulation? None of your answers or progress will be saved.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLeaveConfirmation(false)}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onLeave}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-md"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <Calculator />
    </div>
  );
}

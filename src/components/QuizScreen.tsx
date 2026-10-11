import React, { useState, useEffect } from 'react';
import { 
  Clock, Lightbulb, ChevronRight, ChevronLeft, CheckCircle2, Pause, Play, X, 
  AlertCircle, Loader2, Cloud, Focus, Volume2, VolumeX, Maximize2, Minimize2, 
  Sparkles, Edit3, ChevronDown, BookOpen, Calculator as CalcIcon, Eye, EyeOff, 
  Palette, Type, CloudRain, Waves, Trees, Brain, Shield
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question, QuizState } from '../types';
import { cn } from '../lib/utils';
import { zenAudio, SoundscapeType } from '../lib/zenAudio';
import { Calculator } from './Calculator';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, isFirestoreQuotaExceeded } from '../lib/firebase';
import { generateAdaptiveQuestion } from '../lib/gemini';

interface QuizScreenProps {
  state: QuizState;
  setState: React.Dispatch<React.SetStateAction<QuizState>>;
  onFinish: () => void;
  onLeave: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

const MarkdownComponents = {
  table: ({node, ...props}: any) => (
    <div className="overflow-x-auto w-full">
      <table {...props} className="w-full whitespace-nowrap sm:whitespace-normal" />
    </div>
  )
};

export function QuizScreen({ state, setState, onFinish, onLeave, isZenMode, onToggleZenMode }: QuizScreenProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showExitZenConfirm, setShowExitZenConfirm] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [activeHints, setActiveHints] = useState<Record<string, boolean>>({});
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [internalZenMode, setInternalZenMode] = useState<boolean>(state.isZenMode ?? true);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [focusSoundscape, setFocusSoundscape] = useState<SoundscapeType>('off');
  const [soundVolume, setSoundVolume] = useState(0.4);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [zenTheme, setZenTheme] = useState<'midnight' | 'nordic' | 'sepia'>(() => {
    return (localStorage.getItem('smartprep_zen_theme') as any) || 'midnight';
  });
  const [zenFontSize, setZenFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [scratchpadNotes, setScratchpadNotes] = useState(() => localStorage.getItem('smartprep_quiz_scratchpad') || '');

  const zenActive = isZenMode !== undefined ? isZenMode : internalZenMode;

  const handleToggleZen = () => {
    if (onToggleZenMode) {
      onToggleZenMode();
    } else {
      setInternalZenMode(prev => !prev);
    }
  };

  useEffect(() => {
    localStorage.setItem('smartprep_quiz_scratchpad', scratchpadNotes);
  }, [scratchpadNotes]);

  useEffect(() => {
    localStorage.setItem('smartprep_zen_theme', zenTheme);
  }, [zenTheme]);

  // Distraction Shield: Warn if closing or reloading during active quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!state.isFinished && !isFinishing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isFinished, isFinishing]);

  // Stop ambient sound on unmount
  useEffect(() => {
    return () => {
      zenAudio.stopSoundscape();
    };
  }, []);

  const toggleQuizSoundscape = (type: SoundscapeType) => {
    if (focusSoundscape === type) {
      setFocusSoundscape('off');
      zenAudio.stopSoundscape();
    } else {
      setFocusSoundscape(type);
      zenAudio.playSoundscape(type, soundVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    zenAudio.setVolume(vol);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentQuestion = state.questions[state.currentIndex];

  useEffect(() => {
    if (hintCooldown > 0 && !isPaused) {
      const timer = setTimeout(() => setHintCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [hintCooldown, isPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && zenActive && !isPaused && !state.isFinished && !isFinishing && !showFocusWarning) {
        setShowFocusWarning(true);
        setIsPaused(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [zenActive, isPaused, state.isFinished, isFinishing, showFocusWarning]);

  const stateRef = React.useRef(state);
  const questionCardRef = React.useRef<HTMLDivElement>(null);
  const passageRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Smoothly reset scroll position when moving between questions
  useEffect(() => {
    if (passageRef.current) {
      passageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.currentIndex]);

  useEffect(() => {
    const saveProgress = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || isFinishing || stateRef.current.isFinished || isFirestoreQuotaExceeded) return;
      try {
        await updateDoc(doc(db, 'questionPools', currentUser.uid), {
           activeSession: JSON.stringify(stateRef.current)
        });
        setShowSyncToast(true);
        setTimeout(() => setShowSyncToast(false), 2000);
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
          if (prev.isPracticeMode) {
            const currentQuestionId = prev.questions[prev.currentIndex].id;
            const currentSpent = prev.timeSpentPerQuestion?.[currentQuestionId] || 0;
            return {
              ...prev,
              timeSpentPerQuestion: {
                ...(prev.timeSpentPerQuestion || {}),
                [currentQuestionId]: currentSpent + 1
              }
            };
          }

          if (prev.timeRemaining <= 0) {
            clearInterval(timer);
            handleFinish();
            return prev;
          }
          const currentQuestionId = prev.questions[prev.currentIndex].id;
          const currentSpent = prev.timeSpentPerQuestion?.[currentQuestionId] || 0;
          return { 
            ...prev, 
            timeRemaining: prev.timeRemaining - 1,
            timeSpentPerQuestion: {
              ...(prev.timeSpentPerQuestion || {}),
              [currentQuestionId]: currentSpent + 1
            }
          };
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

  const [isGeneratingAdaptive, setIsGeneratingAdaptive] = useState(false);

  const handleNext = React.useCallback(async () => {
    if (isFinishing || isGeneratingAdaptive) return;
    
    // If we're an adaptive quiz and we at the end but need more questions
    if (state.isAdaptive && state.currentIndex === state.questions.length - 1 && state.questions.length < 15) {
      setShowExplanation(false);
      setIsAnswerChecked(false);
      setIsGeneratingAdaptive(true);
      try {
        const category = currentQuestion.category;
        const currentDiff = state.categoryDifficulties?.[category] || 'medium';
        const isCorrect = state.answers[currentQuestion.id] === currentQuestion.answer;
        
        let nextDiff: 'easy' | 'medium' | 'hard' = currentDiff;
        if (isCorrect) {
          nextDiff = currentDiff === 'easy' ? 'medium' : 'hard';
        } else {
          nextDiff = currentDiff === 'hard' ? 'medium' : 'easy';
        }

        const nextQuestion = await generateAdaptiveQuestion(
          currentQuestion.company || 'Smart-Prep',
          category,
          nextDiff,
          { question: currentQuestion.question, answeredCorrectly: isCorrect }
        );

        setState(prev => ({
          ...prev,
          questions: [...prev.questions, nextQuestion],
          currentIndex: prev.currentIndex + 1,
          categoryDifficulties: {
            ...prev.categoryDifficulties,
            [category]: nextDiff
          }
        }));
      } catch (err) {
        console.error("Failed to generate adaptive question", err);
        alert("Failed to connect to AI engine. Ending assessment early based on current responses.");
        handleFinish();
      } finally {
        setIsGeneratingAdaptive(false);
      }
      return;
    }

    if (isFinishing) return;
    setShowExplanation(false);
    setIsAnswerChecked(false);
    if (state.currentIndex < state.questions.length - 1) {
      setState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      handleFinish();
    }
  }, [isFinishing, isGeneratingAdaptive, state.currentIndex, state.questions.length, state.isAdaptive, state.answers, currentQuestion, state.categoryDifficulties, handleFinish, setState]);

  const handlePrev = React.useCallback(() => {
    if (state.currentIndex > 0) {
      setShowExplanation(false);
      setIsAnswerChecked(!!state.answers[state.questions[state.currentIndex - 1].id]);
      setState((prev) => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  }, [state.currentIndex, state.answers, state.questions, setState]);

  const selectedOption = state.answers[currentQuestion.id];
  const isCorrect = selectedOption === currentQuestion.answer;

  const toggleFlag = React.useCallback(() => {
    setState(prev => {
      const isFlagged = prev.flaggedQuestions?.includes(currentQuestion.id);
      return {
        ...prev,
        flaggedQuestions: isFlagged
          ? prev.flaggedQuestions.filter(id => id !== currentQuestion.id)
          : [...(prev.flaggedQuestions || []), currentQuestion.id]
      };
    });
  }, [currentQuestion.id, setState]);

  const isCurrentFlagged = state.flaggedQuestions?.includes(currentQuestion.id);

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
      } else if (e.key.toLowerCase() === 'f') {
        toggleFlag();
      } else if (e.key.toLowerCase() === 'c') {
        setIsCalculatorOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'n') {
        setShowScratchpad((prev) => !prev);
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
  }, [isPaused, isFinishing, isAnswerChecked, state.answers, currentQuestion, handleCheckAnswer, handleNext, handlePrev, handleOptionSelect, toggleFlag]);

  return (
    <div className={cn(
      "animate-in fade-in duration-500",
      zenActive 
        ? cn(
            "fixed inset-0 z-50 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7 flex flex-col selection:bg-indigo-500/30",
            zenTheme === 'midnight' && "bg-[#030712] text-slate-100",
            zenTheme === 'nordic' && "bg-[#0a0f1d] text-slate-100",
            zenTheme === 'sepia' && "bg-[#181412] text-[#f4ece1]"
          )
        : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8"
    )}>
      {/* Distraction Shield: Thin Top Progress Indicator */}
      {zenActive && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800/40 z-[60]">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${((state.currentIndex + 1) / state.questions.length) * 100}%` }}
          />
        </div>
      )}

      <div className={cn(
        zenActive ? "w-full max-w-4xl mx-auto flex-1 flex flex-col justify-start" : "w-full"
      )}>
        {/* Sync Toast */}
        {showSyncToast && !zenActive && (
          <div className="fixed top-20 right-4 sm:right-8 bg-slate-900/90 dark:bg-slate-800/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 z-50">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Progress synced</span>
          </div>
        )}

        {/* Zen Mode Distraction-Free HUD vs Standard Header */}
        {zenActive ? (
          <div className={cn(
            "flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6 p-3.5 sm:p-4 rounded-2xl shadow-xl backdrop-blur-md border transition-colors",
            zenTheme === 'midnight' && "bg-slate-900/90 border-slate-800/80",
            zenTheme === 'nordic' && "bg-[#0f172a]/90 border-blue-900/40",
            zenTheme === 'sepia' && "bg-[#231d18]/90 border-[#382f27]"
          )}>
            {/* Left: Zen Status & Counter */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Zen Mode</span>
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-300">
                Question <span className="font-bold text-white text-base">{state.currentIndex + 1}</span>
                <span className="text-slate-500"> / {state.questions.length}</span>
              </div>
              <div className="hidden sm:inline-block px-2.5 py-0.5 rounded-lg bg-slate-800/70 text-slate-400 text-xs font-medium truncate max-w-[170px]">
                {currentQuestion.category}
              </div>
            </div>

            {/* Center: Clean Timer with Hide Option */}
            <div className="flex items-center justify-center space-x-2">
              {state.isPracticeMode ? (
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-900/50">
                  Untimed Practice
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <div className={cn(
                    "font-mono font-bold text-base sm:text-lg px-4 py-1 rounded-xl transition-colors tracking-wider flex items-center gap-2",
                    state.timeRemaining > 0 && state.timeRemaining <= 300 
                      ? "bg-red-950/80 border border-red-500/40 text-red-400 animate-pulse" 
                      : "bg-slate-950/80 border border-slate-800 text-white"
                  )}>
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{hideTimer ? "--:--" : formatTime(state.timeRemaining)}</span>
                  </div>
                  <button
                    onClick={() => setHideTimer(!hideTimer)}
                    className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    title={hideTimer ? "Show Timer" : "Hide Timer (Anxiety-Free Mode)"}
                  >
                    {hideTimer ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Soundscape, Tools, Theme, Fullscreen & Controls */}
            <div className="flex items-center justify-end flex-wrap gap-1.5 sm:gap-2">
              {/* Soundscape Dropdown / Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSoundMenu(!showSoundMenu)}
                  className={cn(
                    "p-2 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-medium border",
                    focusSoundscape !== 'off'
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30"
                      : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                  )}
                  title="Ambient Focus Soundscapes"
                >
                  <Volume2 className={cn("w-4 h-4", focusSoundscape !== 'off' && "animate-pulse text-indigo-200")} />
                  <span className="hidden sm:inline capitalize">{focusSoundscape !== 'off' ? focusSoundscape : 'Audio'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showSoundMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Soundscapes</span>
                      {focusSoundscape !== 'off' && (
                        <button onClick={() => toggleQuizSoundscape('off')} className="text-red-400 hover:underline">Mute</button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {[
                        { id: 'rain', label: 'Gentle Rain', icon: CloudRain },
                        { id: 'waves', label: 'Ocean Waves', icon: Waves },
                        { id: 'forest', label: 'Forest Breeze', icon: Trees },
                        { id: 'alpha', label: '432Hz Deep Focus', icon: Brain },
                        { id: 'off', label: 'Mute / Off', icon: VolumeX }
                      ].map(s => {
                        const Icon = s.icon;
                        const isSelected = focusSoundscape === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              toggleQuizSoundscape(s.id as SoundscapeType);
                              if (s.id === 'off') setShowSoundMenu(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                              isSelected 
                                ? "bg-indigo-600 text-white" 
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{s.label}</span>
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />}
                          </button>
                        );
                      })}
                    </div>
                    {focusSoundscape !== 'off' && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Volume</span>
                          <span>{Math.round(soundVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="1"
                          step="0.05"
                          value={soundVolume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Calculator Toggle */}
              <button
                onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                className={cn(
                  "p-2 rounded-xl transition-colors text-xs flex items-center space-x-1 border",
                  isCalculatorOpen 
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30" 
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                )}
                title="Toggle Calculator (C)"
              >
                <CalcIcon className="w-4 h-4" />
                <span className="hidden xl:inline">Calc</span>
              </button>

              {/* Rough Work Scratchpad */}
              <button
                onClick={() => setShowScratchpad(!showScratchpad)}
                className={cn(
                  "p-2 rounded-xl transition-colors text-xs flex items-center space-x-1 border",
                  showScratchpad 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                )}
                title="Toggle Scratchpad (N)"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden xl:inline">Notes</span>
              </button>

              {/* Theme Switcher */}
              <button
                onClick={() => setZenTheme(prev => prev === 'midnight' ? 'nordic' : prev === 'nordic' ? 'sepia' : 'midnight')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title={`Zen Theme: ${zenTheme} (Click to switch)`}
              >
                <Palette className="w-4 h-4" />
              </button>

              {/* Font Size Switcher */}
              <button
                onClick={() => setZenFontSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xl' : 'normal')}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-bold"
                title={`Text size: ${zenFontSize} (Click to switch)`}
              >
                <span className="text-xs">A{zenFontSize === 'xl' ? '++' : zenFontSize === 'large' ? '+' : ''}</span>
              </button>

              {/* Flag Question */}
              <button
                onClick={toggleFlag}
                className={cn(
                  "p-2 rounded-xl transition-colors border",
                  isCurrentFlagged 
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40" 
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
                )}
                title={isCurrentFlagged ? "Remove Flag (F)" : "Flag for Review (F)"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isCurrentFlagged ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Pause */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isPaused ? "Resume Simulation" : "Pause Simulation"}
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Exit Zen Button */}
              <button
                onClick={() => setShowExitZenConfirm(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                title="Switch back to standard quiz layout"
              >
                Exit Zen
              </button>

              {/* Leave simulation */}
              <button
                onClick={() => setShowLeaveConfirmation(true)}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Leave simulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Mode Header */
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
                onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                className={cn(
                  "p-2 rounded-full transition-colors flex items-center space-x-1 px-3",
                  isCalculatorOpen
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                )}
                title="Toggle Calculator (C)"
              >
                <CalcIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Calc</span>
              </button>
              <button
                onClick={handleToggleZen}
                className="p-2 rounded-full transition-colors flex items-center space-x-1 px-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                title="Enter Distraction-Free Zen Mode"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline text-sm font-medium">Zen Mode</span>
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
              {state.isPracticeMode ? (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full font-mono font-medium text-sm sm:text-base transition-colors bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Practice Mode</span>
                </div>
              ) : (
                <div className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-full font-mono font-medium text-base sm:text-lg transition-colors",
                  state.timeRemaining > 0 && state.timeRemaining <= 300 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                )}>
                  <Clock className={cn("w-4 h-4 sm:w-5 sm:h-5", state.timeRemaining > 0 && state.timeRemaining <= 300 && "animate-pulse")} />
                  <span>{formatTime(state.timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rough Work Scratchpad in Zen Mode */}
        {zenActive && showScratchpad && (
          <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl animate-in slide-in-from-top-2 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                Rough Work Scratchpad (Auto-saved)
              </span>
              <button
                onClick={() => setScratchpadNotes('')}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear Scratchpad
              </button>
            </div>
            <textarea
              value={scratchpadNotes}
              onChange={(e) => setScratchpadNotes(e.target.value)}
              placeholder="Use this space for formulas, quick calculations, or notes during this question..."
              className="w-full h-24 bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
            />
          </div>
        )}

      {/* Warning Banner */}
      {!state.isPracticeMode && state.timeRemaining > 0 && state.timeRemaining <= 300 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium">Less than 5 minutes remaining! Please review your answers before the simulation ends.</p>
        </div>
      )}

      {/* Question Card */}
      <div 
        ref={questionCardRef}
        className={cn(
          "relative rounded-3xl shadow-sm border overflow-hidden mb-6 flex flex-col transition-colors",
          zenActive ? (
            zenTheme === 'midnight' 
              ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-2xl" 
              : zenTheme === 'nordic'
              ? "bg-[#0f172a]/95 border-blue-900/40 text-slate-100 shadow-2xl"
              : "bg-[#231d18]/95 border-[#382f27] text-[#f4ece1] shadow-2xl"
          ) : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
          currentQuestion.passage ? "lg:grid lg:grid-cols-2 lg:divide-x divide-slate-100 dark:divide-slate-800" : ""
        )}
      >
        {isPaused && (
          <div className="absolute inset-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center col-span-full">
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

        {currentQuestion.passage ? (
          <>
            <div 
              ref={passageRef}
              className={cn(
                "p-5 sm:p-8 border-b lg:border-b-0 border-slate-100 dark:border-slate-800 lg:max-h-[700px] lg:overflow-y-auto overscroll-contain-y gpu-scroll transition-colors",
                zenActive ? (
                  zenTheme === 'midnight' ? "bg-slate-950/70" : zenTheme === 'nordic' ? "bg-[#090e1c]/80" : "bg-[#1a1512]/80"
                ) : "bg-slate-50 dark:bg-slate-900/50"
              )}
              data-lenis-prevent
            >
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3 uppercase tracking-wider">Reference Passage</div>
              <div className={cn(
                "leading-relaxed markdown-body prose prose-slate dark:prose-invert max-w-none prose-p:my-2",
                zenActive && zenFontSize === 'xl' ? "text-lg sm:text-xl" : zenActive && zenFontSize === 'large' ? "text-base sm:text-lg" : "text-[15px]"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={MarkdownComponents}
                >
                  {currentQuestion.passage}
                </ReactMarkdown>
              </div>
            </div>

            <div className={cn(
              "flex flex-col lg:max-h-[700px] transition-colors",
              zenActive ? (
                zenTheme === 'midnight' ? "bg-slate-900" : zenTheme === 'nordic' ? "bg-[#0f172a]" : "bg-[#231d18]"
              ) : "bg-white dark:bg-slate-900"
            )}>
              <div 
                className="p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800 lg:overflow-y-auto shrink-0 lg:max-h-[50%] overscroll-contain-y gpu-scroll"
                data-lenis-prevent
              >
                <div className={cn(
                  "font-medium leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-table:my-4 prose-th:p-2 prose-td:p-2",
                  zenActive && zenFontSize === 'xl' ? "text-2xl sm:text-3xl" : zenActive && zenFontSize === 'large' ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl",
                  zenActive ? (zenTheme === 'sepia' ? "text-[#f4ece1]" : "text-white") : "text-slate-900 dark:text-white"
                )}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {currentQuestion.question}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div 
                className={cn(
                  "p-5 sm:p-8 space-y-3 flex-1 lg:overflow-y-auto overscroll-contain-y gpu-scroll transition-colors",
                  zenActive ? (
                    zenTheme === 'midnight' ? "bg-slate-950/40" : zenTheme === 'nordic' ? "bg-[#090e1c]/50" : "bg-[#1a1512]/50"
                  ) : "bg-slate-50 dark:bg-slate-800/50"
                )}
                data-lenis-prevent
              >
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedOption === option;
                  let optionClass = zenActive ? (
                    zenTheme === 'midnight' 
                      ? "border-slate-800 bg-slate-950/80 hover:border-indigo-500/60 hover:bg-slate-900 text-slate-200"
                      : zenTheme === 'nordic'
                      ? "border-slate-800/80 bg-[#090e1c] hover:border-blue-500/60 hover:bg-[#11192e] text-slate-200"
                      : "border-[#382f27] bg-[#1a1512] hover:border-amber-600/60 hover:bg-[#251e19] text-[#ecd8c2]"
                  ) : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300";
                  
                  if (isAnswerChecked) {
                    if (option === currentQuestion.answer) {
                      optionClass = "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
                    } else if (isSelected) {
                      optionClass = "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
                    } else {
                      optionClass = "border-slate-800/60 bg-slate-950/40 opacity-40 text-slate-500";
                    }
                  } else if (isSelected) {
                    optionClass = "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/40";
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
                      <span className="flex items-center space-x-3">
                        <kbd className="hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-medium text-slate-500 dark:text-slate-400">
                          {i + 1}
                        </kbd>
                        <span className={cn(
                          zenActive && zenFontSize === 'xl' ? "text-lg sm:text-xl" : zenActive && zenFontSize === 'large' ? "text-base sm:text-lg" : "text-base sm:text-lg"
                        )}>
                          {option}
                        </span>
                      </span>
                      {isAnswerChecked && option === currentQuestion.answer && (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={cn(
              "p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors",
              zenActive ? (
                zenTheme === 'midnight' ? "bg-slate-900" : zenTheme === 'nordic' ? "bg-[#0f172a]" : "bg-[#231d18]"
              ) : "bg-white dark:bg-slate-900"
            )}>
              <div className={cn(
                "font-medium leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-table:my-4 prose-th:p-2 prose-td:p-2",
                zenActive && zenFontSize === 'xl' ? "text-2xl sm:text-3xl" : zenActive && zenFontSize === 'large' ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl",
                zenActive ? (zenTheme === 'sepia' ? "text-[#f4ece1]" : "text-white") : "text-slate-900 dark:text-white"
              )}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={MarkdownComponents}
                >
                  {currentQuestion.question}
                </ReactMarkdown>
              </div>
            </div>

            <div className={cn(
              "p-5 sm:p-8 flex flex-col justify-center transition-colors",
              zenActive ? (
                zenTheme === 'midnight' ? "bg-slate-950/40" : zenTheme === 'nordic' ? "bg-[#090e1c]/50" : "bg-[#1a1512]/50"
              ) : "bg-slate-50 dark:bg-slate-800/50"
            )}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedOption === option;
                  let optionClass = zenActive ? (
                    zenTheme === 'midnight' 
                      ? "border-slate-800 bg-slate-950/80 hover:border-indigo-500/60 hover:bg-slate-900 text-slate-200"
                      : zenTheme === 'nordic'
                      ? "border-slate-800/80 bg-[#090e1c] hover:border-blue-500/60 hover:bg-[#11192e] text-slate-200"
                      : "border-[#382f27] bg-[#1a1512] hover:border-amber-600/60 hover:bg-[#251e19] text-[#ecd8c2]"
                  ) : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300";
                  
                  if (isAnswerChecked) {
                    if (option === currentQuestion.answer) {
                      optionClass = "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
                    } else if (isSelected) {
                      optionClass = "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
                    } else {
                      optionClass = "border-slate-800/60 bg-slate-950/40 opacity-40 text-slate-500";
                    }
                  } else if (isSelected) {
                    optionClass = "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/40";
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
                      <span className="flex items-center space-x-3">
                        <kbd className="hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans font-medium text-slate-500 dark:text-slate-400">
                          {i + 1}
                        </kbd>
                        <span className={cn(
                          zenActive && zenFontSize === 'xl' ? "text-lg sm:text-xl" : zenActive && zenFontSize === 'large' ? "text-base sm:text-lg" : "text-base sm:text-lg"
                        )}>
                          {option}
                        </span>
                      </span>
                      {isAnswerChecked && option === currentQuestion.answer && (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Question Navigation Grid: Drawer in Zen Mode vs full grid in standard */}
      {zenActive ? (
        <div className="mb-6 flex flex-col items-center">
          <button
            onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 shadow-sm transition-all group"
          >
            <span>{showPaletteDrawer ? 'Hide Question Grid' : `Jump to Question (${state.currentIndex + 1}/${state.questions.length})`}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform group-hover:text-indigo-400", showPaletteDrawer && "rotate-180")} />
          </button>

          {showPaletteDrawer && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-2xl p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
              {state.questions.map((q, idx) => {
                const isAnswered = !!state.answers[q.id];
                const isCurrent = idx === state.currentIndex;
                const isFlagged = state.flaggedQuestions?.includes(q.id);

                return (
                  <button
                    key={`${q.id}-${idx}`}
                    onClick={() => {
                      setShowExplanation(false);
                      setIsAnswerChecked(!!state.answers[q.id]);
                      setState((prev) => ({ ...prev, currentIndex: idx }));
                    }}
                    disabled={isPaused}
                    className={cn(
                      "relative flex items-center justify-center w-9 h-9 rounded-lg text-xs font-semibold transition-all border",
                      isCurrent
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-2 ring-indigo-500/30"
                        : isAnswered
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    )}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {state.questions.map((q, idx) => {
            const isAnswered = !!state.answers[q.id];
            const isCurrent = idx === state.currentIndex;
            const isFlagged = state.flaggedQuestions?.includes(q.id);

            return (
              <button
                key={`${q.id}-${idx}`}
                onClick={() => {
                  setShowExplanation(false);
                  setIsAnswerChecked(!!state.answers[q.id]);
                  setState((prev) => ({ ...prev, currentIndex: idx }));
                }}
                disabled={isPaused}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold transition-all border-2",
                  isCurrent
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : isAnswered
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/50 dark:text-emerald-400"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                )}
              >
                {idx + 1}
                {isFlagged && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      )}

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
              <span>{showExplanation ? 'Hide Explanation' : 'Show Explanation'}</span>
            </button>
            {!isAnswerChecked && (
              <button
                onClick={() => {
                  setActiveHints(prev => ({ ...prev, [currentQuestion.id]: true }));
                  setHintCooldown(30);
                }}
                disabled={isPaused || hintCooldown > 0 || activeHints[currentQuestion.id]}
                className="flex items-center justify-center space-x-2 px-6 py-3 font-medium rounded-xl border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                <Lightbulb className="w-5 h-5" />
                <span>{activeHints[currentQuestion.id] ? 'Hint Active' : hintCooldown > 0 ? `Hint (${hintCooldown}s)` : 'Get Hint'}</span>
              </button>
            )}
            {!isAnswerChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedOption || isPaused}
                className="flex items-center justify-center space-x-3 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md w-full sm:w-auto"
              >
                <span>Check Answer</span>
                <kbd className="hidden sm:inline-flex items-center justify-center px-2 h-5 rounded bg-slate-800 dark:bg-slate-200 text-[10px] font-sans font-medium text-slate-300 dark:text-slate-600">
                  Enter
                </kbd>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isPaused || isGeneratingAdaptive}
                className="flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md w-full sm:w-auto"
              >
                {isGeneratingAdaptive ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span>{(state.currentIndex === state.questions.length - 1 && (!state.isAdaptive || state.questions.length >= 15)) ? 'Finish' : 'Next'}</span>
                      <kbd className="hidden sm:inline-flex items-center justify-center px-2 h-5 rounded bg-blue-500 dark:bg-blue-800 text-[10px] font-sans font-medium text-white/90">
                        Enter
                      </kbd>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {activeHints[currentQuestion.id] && !showExplanation && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-2xl p-6 animate-in slide-in-from-top-4 mt-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0">
                <Lightbulb className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-2 max-w-full overflow-hidden">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Subtle Clue</h3>
                <div className="text-indigo-900 dark:text-indigo-300 prose prose-indigo dark:prose-invert max-w-none">
                   {currentQuestion.explanation.split('.')[0]}.
                </div>
              </div>
            </div>
          </div>
        )}

        {showExplanation && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 animate-in slide-in-from-top-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg shrink-0">
                <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2 max-w-full overflow-hidden">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300">AI Explanation & Strategy</h3>
                <div className="text-amber-900 dark:text-amber-300 prose prose-amber dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-strong:text-amber-900 dark:prose-strong:text-amber-200 prose-code:text-amber-900 dark:prose-code:text-amber-200 prose-code:bg-amber-100 dark:prose-code:bg-amber-900/50 prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                  >
                    {currentQuestion.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Focus Warning Modal */}
      {showFocusWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md px-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Focus Protected</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
              You switched away from your assessment window. In Zen Mode, distractions are blocked out to simulate true exam conditions. Take a breath and resume when you're ready.
            </p>
            <button
              onClick={() => {
                setShowFocusWarning(false);
                setIsPaused(false);
              }}
              className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-md text-base"
            >
              Resume Assessment
            </button>
          </div>
        </div>
      )}

      {/* Exit Zen Confirmation Modal */}
      {showExitZenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Exit Zen Mode?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              This will restore standard layout with surrounding app controls. Your current questions, timer, and answers will remain intact.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowExitZenConfirm(false)}
                className="flex-1 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Keep Zen Mode
              </button>
              <button
                onClick={() => {
                  setShowExitZenConfirm(false);
                  handleToggleZen();
                }}
                className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-md"
              >
                Exit to Standard
              </button>
            </div>
          </div>
        </div>
      )}

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

      </div>
      <Calculator 
        isOpen={isCalculatorOpen} 
        onToggle={() => setIsCalculatorOpen(prev => !prev)} 
        onClose={() => setIsCalculatorOpen(false)}
        hideFloatingTrigger={zenActive}
        onInsertToNotes={(calcStr) => {
          setScratchpadNotes(prev => prev ? `${prev}\n${calcStr}` : calcStr);
          setShowScratchpad(true);
        }}
      />
    </div>
  );
}

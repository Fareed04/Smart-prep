import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  X, 
  CloudRain, 
  Waves, 
  Trees, 
  Brain, 
  Wind,
  CheckCircle2,
  Clock,
  ChevronDown,
  Minimize,
  Sliders,
  NotebookPen
} from 'lucide-react';
import { zenAudio, SoundscapeType } from '../lib/zenAudio';
import { cn } from '../lib/utils';

interface ZenModeProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function ZenMode({ isOpen, onClose, isMinimized = false, onToggleMinimize }: ZenModeProps) {
  // Timer state
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'break' | 'deep' | 'stopwatch'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Soundscape state
  const [soundscape, setSoundscape] = useState<SoundscapeType>('off');
  const [volume, setVolume] = useState(0.4);

  // Breathing tool state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quick scratchpad
  const [notes, setNotes] = useState(() => localStorage.getItem('zen_scratchpad_notes') || '');

  // Persistent notes
  useEffect(() => {
    localStorage.setItem('zen_scratchpad_notes', notes);
  }, [notes]);

  // Handle timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (timerMode === 'stopwatch') {
          setTimeLeft(prev => prev + 1);
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              setIsRunning(false);
              zenAudio.playZenChime();
              if (timerMode === 'pomodoro' || timerMode === 'deep') {
                setCompletedSessions(c => c + 1);
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerMode]);

  // Switch timer modes
  const handleSelectMode = (mode: 'pomodoro' | 'break' | 'deep' | 'stopwatch') => {
    setTimerMode(mode);
    setIsRunning(false);
    if (mode === 'pomodoro') setTimeLeft(25 * 60);
    else if (mode === 'break') setTimeLeft(5 * 60);
    else if (mode === 'deep') setTimeLeft(50 * 60);
    else if (mode === 'stopwatch') setTimeLeft(0);
  };

  // Soundscape handlers
  const handleToggleSoundscape = (type: SoundscapeType) => {
    if (soundscape === type) {
      setSoundscape('off');
      zenAudio.stopSoundscape();
    } else {
      setSoundscape(type);
      zenAudio.playSoundscape(type, volume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    zenAudio.setVolume(val);
  };

  // Box Breathing cycle (4s Inhale, 4s Hold, 4s Exhale, 4s Rest)
  useEffect(() => {
    if (!isBreathing) return;

    const phases: ('Inhale' | 'Hold' | 'Exhale' | 'Rest')[] = ['Inhale', 'Hold', 'Exhale', 'Rest'];
    let currentIdx = 0;
    let sec = 4;
    setBreathPhase('Inhale');
    setBreathSeconds(4);

    const breathInterval = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        currentIdx = (currentIdx + 1) % 4;
        setBreathPhase(phases[currentIdx]);
        sec = 4;
      }
      setBreathSeconds(sec);
    }, 1000);

    return () => clearInterval(breathInterval);
  }, [isBreathing]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Floating Minimized Widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md border border-slate-700/60 rounded-full shadow-2xl p-2 pl-4 pr-3 space-x-3 animate-in slide-in-from-bottom-5">
        <button
          onClick={onToggleMinimize}
          className="flex items-center space-x-2 text-left group"
          title="Expand Zen Mode"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-sm font-bold tracking-wider">{formatTime(timeLeft)}</span>
          <span className="text-xs text-slate-400 capitalize hidden sm:inline">({timerMode})</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {soundscape !== 'off' && (
          <button
            onClick={() => handleToggleSoundscape('off')}
            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition-colors flex items-center gap-1"
            title={`Ambient: ${soundscape} (Click to mute)`}
          >
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          </button>
        )}

        <button
          onClick={onToggleMinimize}
          className="p-1.5 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors"
          title="Expand Zen Sanctuary"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition-colors"
          title="Close Focus Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Full Screen / Sanctuary Modal View
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 text-slate-100 overflow-y-auto animate-in fade-in duration-300 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Zen Sanctuary
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Focus Mode</span>
            </h2>
            <p className="text-xs text-slate-400">Distraction-free environment for deep mastery & calm</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Minimize to Floating Widget"
            >
              <Minimize className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Exit Zen Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Focus Zone */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left / Center: Timer & Breathing */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-8">
          {/* Mode Selector */}
          <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <button
              onClick={() => handleSelectMode('pomodoro')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all",
                timerMode === 'pomodoro' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              )}
            >
              25m Focus
            </button>
            <button
              onClick={() => handleSelectMode('deep')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all",
                timerMode === 'deep' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              )}
            >
              50m Deep
            </button>
            <button
              onClick={() => handleSelectMode('break')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all",
                timerMode === 'break' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              )}
            >
              5m Rest
            </button>
            <button
              onClick={() => handleSelectMode('stopwatch')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all",
                timerMode === 'stopwatch' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white"
              )}
            >
              Flow
            </button>
          </div>

          {/* Large Zen Timer Display */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Glowing Aura Ring */}
            <div className={cn(
              "w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-slate-800 flex flex-col items-center justify-center transition-all duration-700 relative",
              isRunning ? "shadow-[0_0_80px_rgba(99,102,241,0.2)] border-indigo-500/30 bg-radial from-indigo-950/30 to-transparent" : "bg-slate-900/40"
            )}>
              <span className="font-mono text-6xl sm:text-7xl font-extrabold tracking-tight text-white mb-2">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                {isRunning ? (timerMode === 'break' ? 'Relax & Breathe' : 'Deep Concentration') : 'Paused'}
              </span>

              {completedSessions > 0 && (
                <div className="absolute bottom-6 flex items-center space-x-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{completedSessions} focus streak</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4 mt-8">
              <button
                onClick={() => handleSelectMode(timerMode)}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 hover:scale-105"
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isRunning ? "Pause" : "Begin Focus"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Soundscapes & Box Breathing & Scratchpad */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ambient Soundscapes */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Soundscapes</h3>
              </div>
              <span className="text-[11px] text-slate-400">Offline Synthesis</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleToggleSoundscape('rain')}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all",
                  soundscape === 'rain' 
                    ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-md" 
                    : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <CloudRain className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Gentle Rain</div>
                  <div className="text-[10px] text-slate-400">Calming rhythm</div>
                </div>
              </button>

              <button
                onClick={() => handleToggleSoundscape('waves')}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all",
                  soundscape === 'waves' 
                    ? "bg-teal-600/20 border-teal-500/50 text-teal-300 shadow-md" 
                    : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <Waves className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Ocean Waves</div>
                  <div className="text-[10px] text-slate-400">Deep tides</div>
                </div>
              </button>

              <button
                onClick={() => handleToggleSoundscape('forest')}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all",
                  soundscape === 'forest' 
                    ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-md" 
                    : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <Trees className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Forest Breeze</div>
                  <div className="text-[10px] text-slate-400">Gentle rustle</div>
                </div>
              </button>

              <button
                onClick={() => handleToggleSoundscape('alpha')}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all",
                  soundscape === 'alpha' 
                    ? "bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-md" 
                    : "bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <Brain className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">432Hz Alpha</div>
                  <div className="text-[10px] text-slate-400">Binaural focus</div>
                </div>
              </button>
            </div>

            {/* Volume Slider */}
            {soundscape !== 'off' && (
              <div className="pt-2 flex items-center space-x-3 text-slate-400">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <button
                  onClick={() => handleToggleSoundscape('off')}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  Mute
                </button>
              </div>
            )}
          </div>

          {/* Box Breathing Tool */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wind className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">4-4-4 Box Breathing</h3>
              </div>
              <button
                onClick={() => setIsBreathing(!isBreathing)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full font-semibold transition-all",
                  isBreathing ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400 hover:text-white"
                )}
              >
                {isBreathing ? "Stop" : "Guide Me"}
              </button>
            </div>

            {isBreathing ? (
              <div className="flex items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center font-bold text-lg text-white transition-all duration-1000",
                    breathPhase === 'Inhale' && "scale-125 bg-emerald-500/30 border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]",
                    breathPhase === 'Hold' && "scale-125 bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]",
                    breathPhase === 'Exhale' && "scale-90 bg-indigo-500/30 border-2 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]",
                    breathPhase === 'Rest' && "scale-90 bg-slate-800 border-2 border-slate-600"
                  )}>
                    {breathSeconds}s
                  </div>
                  <span className="text-sm font-bold text-emerald-300 tracking-wider uppercase mt-2">
                    {breathPhase}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Reset your nervous system before tackling complex questions. 4s inhale, 4s hold, 4s exhale, 4s rest.
              </p>
            )}
          </div>

          {/* Quick Scratchpad / Distraction Park */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <NotebookPen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Thought Park</h3>
              </div>
              <span className="text-[11px] text-slate-500">Auto-saved</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Park distracting thoughts here so your mind stays clear during your session..."
              className="w-full h-20 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Footer calm reminder */}
      <div className="max-w-5xl w-full mx-auto pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>"Focus is the bridge between ambition and mastery."</span>
        <div className="flex items-center space-x-3">
          <span>Shortcuts: <strong>Esc</strong> to close</span>
        </div>
      </div>
    </div>
  );
}

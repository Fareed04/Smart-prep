import React from 'react';
import { Loader2, Brain, Sparkles, CheckCircle2, FileSearch, Layers, Cpu } from 'lucide-react';

interface ProcessingScreenProps {
  progress: number;
  status?: string;
}

interface ExtractionMilestone {
  label: string;
  minPercent: number;
  icon: React.ComponentType<{ className?: string }>;
}

const MILESTONES: ExtractionMilestone[] = [
  { label: 'Ingestion & OCR', minPercent: 15, icon: FileSearch },
  { label: 'Extraction', minPercent: 40, icon: Cpu },
  { label: 'Deduplication', minPercent: 70, icon: Layers },
  { label: 'Finalizing Pool', minPercent: 95, icon: Sparkles },
];

export function ProcessingScreen({ progress, status }: ProcessingScreenProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Determine current active milestone index
  const activeMilestoneIndex = MILESTONES.findIndex((m, idx) => {
    const nextMilestone = MILESTONES[idx + 1];
    if (!nextMilestone) return true;
    return clampedProgress < nextMilestone.minPercent;
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-8 space-y-8 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      {/* Central Visual AI Processing Orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow rings */}
        <div className="absolute w-28 h-28 sm:w-32 sm:h-32 bg-blue-500/15 dark:bg-blue-500/25 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-md"></div>
        
        {/* Rotating orbital ring */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-slate-900 rounded-full shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
          <div className="absolute inset-1 rounded-full border-2 border-dashed border-blue-400/40 dark:border-blue-500/40 animate-spin [animation-duration:12s]" />
          <div className="relative flex items-center justify-center">
            <Brain className="w-9 h-9 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
            <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-bounce [animation-duration:2.5s]" />
          </div>
        </div>
      </div>
      
      {/* Heading & Status Text */}
      <div className="text-center space-y-2 max-w-lg">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          The AI Brain is Working
        </h2>
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 max-w-full">
          <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
            {status || "Extracting questions, applying OCR, deduplicating, and updating facts to 2026 standards..."}
          </p>
        </div>
      </div>

      {/* Visual Linear Progress Bar Card */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
        {/* Progress Bar Header Info */}
        <div className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              Extraction & Analysis
            </span>
          </div>
          
          <div className="flex items-baseline space-x-1">
            <span className="font-mono text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
              {clampedProgress}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500">%</span>
          </div>
        </div>

        {/* The Linear Progress Bar Track */}
        <div 
          className="relative h-4 sm:h-4.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 border border-slate-200/80 dark:border-slate-700/80 shadow-inner overflow-hidden"
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Extraction progress"
        >
          {/* Background milestone tick markers */}
          <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none opacity-20">
            <div className="w-px h-full bg-slate-900 dark:bg-white" />
            <div className="w-px h-full bg-slate-900 dark:bg-white" />
          </div>

          {/* Animated Linear Progress Bar Fill */}
          <div 
            className="relative h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-500 dark:via-indigo-500 dark:to-cyan-400 transition-[width] duration-700 ease-out shadow-xs overflow-hidden"
            style={{ width: `${clampedProgress}%` }}
          >
            {/* Moving diagonal shimmer beam */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/30 to-transparent animate-progress-shimmer pointer-events-none" />

            {/* Glowing leading-edge dot */}
            {clampedProgress > 2 && clampedProgress < 100 && (
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
            )}
          </div>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {MILESTONES.map((milestone, idx) => {
            const isCompleted = clampedProgress >= milestone.minPercent;
            const isCurrent = idx === activeMilestoneIndex && clampedProgress < 100;
            const IconComponent = milestone.icon;

            return (
              <div 
                key={milestone.label} 
                className="flex items-center space-x-2 p-1.5 rounded-lg transition-colors"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isCompleted 
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' 
                    : isCurrent 
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <IconComponent className="w-3 h-3" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] sm:text-xs font-semibold truncate ${
                    isCurrent 
                      ? 'text-blue-600 dark:text-blue-400 font-bold' 
                      : isCompleted 
                        ? 'text-slate-800 dark:text-slate-200' 
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {milestone.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assurance Footer Note */}
      <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>Synthesizing cognitive evaluation data with 2026 assessment standards</span>
      </div>
    </div>
  );
}

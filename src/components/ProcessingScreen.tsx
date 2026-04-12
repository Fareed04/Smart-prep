import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingScreenProps {
  progress: number;
}

export function ProcessingScreen({ progress }: ProcessingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
      
      <div className="text-center space-y-3 max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">The AI Brain is Working</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Extracting questions, applying OCR, deduplicating, and updating facts to 2026 standards...
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
          <span>Processing files</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

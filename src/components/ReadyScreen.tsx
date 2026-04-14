import React from 'react';
import { Play, FileText, Settings, Plus } from 'lucide-react';

interface ReadyScreenProps {
  poolSize: number;
  onStart: () => void;
  onAddMore: () => void;
  onUploadDifferent: () => void;
  masteryMode: boolean;
  setMasteryMode: (val: boolean) => void;
}

export function ReadyScreen({ poolSize, onStart, onAddMore, onUploadDifferent, masteryMode, setMasteryMode }: ReadyScreenProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-2">
          <FileText className="w-10 h-10" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Documents Processed!</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Successfully extracted a pool of <span className="font-semibold text-slate-900 dark:text-white">{poolSize}</span> unique questions.
          </p>
          
          <div className="flex items-center justify-center space-x-4 py-4">
            <button 
              onClick={() => setMasteryMode(true)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${masteryMode ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
            >
              <div className="font-bold text-slate-900 dark:text-white">Mastery Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Prioritizes unmastered questions to help you memorize the entire pool.</div>
            </button>
            <button 
              onClick={() => setMasteryMode(false)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all ${!masteryMode ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
            >
              <div className="font-bold text-slate-900 dark:text-white">Standard Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Random selection from the pool for a standard simulation.</div>
            </button>
          </div>

          {poolSize < 50 ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-800 dark:text-amber-300 text-sm">
              <p className="font-medium">Pool size is currently {poolSize}/50.</p>
              <p>You need at least 50 questions for a full simulation. Add more documents to reach the target!</p>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-500">
              Your simulation will consist of 50 questions selected from this pool based on your chosen mode.
            </p>
          )}
        </div>

        <div className="pt-6 space-y-4">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg text-lg"
          >
            <Play className="w-6 h-6" />
            <span>Start Simulation Now</span>
          </button>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onAddMore}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add More Docs</span>
            </button>
            <button
              onClick={onUploadDifferent}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Clear & Start Fresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

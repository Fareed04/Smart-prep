import { Play, FileText, Settings, Plus, Building2 } from 'lucide-react';
import { Question } from '../types';
import { cn } from '../lib/utils';

interface ReadyScreenProps {
  pool: Question[];
  onStart: () => void;
  onAddMore: () => void;
  onUploadDifferent: () => void;
  masteryMode: boolean;
  setMasteryMode: (val: boolean) => void;
  selectedCompany: string;
  setSelectedCompany: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
}

export function ReadyScreen({ 
  pool, 
  onStart, 
  onAddMore, 
  onUploadDifferent, 
  masteryMode, 
  setMasteryMode,
  selectedCompany,
  setSelectedCompany,
  selectedCategory,
  setSelectedCategory
}: ReadyScreenProps) {
  // Treat undefined company as 'KPMG' for legacy questions
  const companiesInPool = Array.from(new Set(pool.map(q => q.company || 'KPMG'))) as string[];
  
  const companyFilteredPool = selectedCompany === 'All' 
    ? pool 
    : pool.filter(q => (q.company || 'KPMG') === selectedCompany);
    
  const categoriesInPool = Array.from(new Set(companyFilteredPool.map(q => q.category).filter(Boolean))) as string[];
  
  const finalFilteredPool = selectedCategory === 'All'
    ? companyFilteredPool
    : companyFilteredPool.filter(q => q.category === selectedCategory);
  
  const poolSize = finalFilteredPool.length;

  return (
    <div className="max-w-2xl mx-auto p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-2">
          <FileText className="w-10 h-10" />
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Documents Processed!</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Successfully extracted a pool of <span className="font-semibold text-slate-900 dark:text-white">{pool.length}</span> total questions.
            </p>
          </div>

          {companiesInPool.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Filter by Company</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSelectedCompany('All')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all border-2",
                    selectedCompany === 'All'
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                  )}
                >
                  All Companies ({pool.length})
                </button>
                {companiesInPool.map(company => (
                  <button
                    key={company}
                    onClick={() => setSelectedCompany(company)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all border-2",
                      selectedCompany === company
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                    )}
                  >
                    {company} ({pool.filter(q => (q.company || 'KPMG') === company).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {categoriesInPool.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Filter by Category</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all border-2",
                    selectedCategory === 'All'
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                  )}
                >
                  All Categories ({companyFilteredPool.length})
                </button>
                {categoriesInPool.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all border-2",
                      selectedCategory === category
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                    )}
                  >
                    {category} ({companyFilteredPool.filter(q => q.category === category).length})
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4 py-2">
            <button 
              onClick={() => setMasteryMode(true)}
              className={cn(
                "flex-1 p-4 rounded-2xl border-2 transition-all text-left",
                masteryMode ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
              )}
            >
              <div className="font-bold text-slate-900 dark:text-white">Mastery Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Prioritizes unmastered questions to help you memorize the entire pool.</div>
            </button>
            <button 
              onClick={() => setMasteryMode(false)}
              className={cn(
                "flex-1 p-4 rounded-2xl border-2 transition-all text-left",
                !masteryMode ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
              )}
            >
              <div className="font-bold text-slate-900 dark:text-white">Standard Mode</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Random selection from the pool for a standard simulation.</div>
            </button>
          </div>

          {poolSize < 50 ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-800 dark:text-amber-300 text-sm">
              <p className="font-medium">Selected pool size is {poolSize}/50.</p>
              <p>You need at least 50 questions for a full simulation. Add more documents or adjust your filters!</p>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-500">
              Your simulation will consist of 50 questions selected from the <span className="font-semibold">{selectedCompany === 'All' ? 'entire' : selectedCompany}</span> pool
              {selectedCategory !== 'All' && <span>, focusing on <span className="font-semibold">{selectedCategory}</span></span>}.
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

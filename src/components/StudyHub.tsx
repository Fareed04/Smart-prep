import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirestoreQuotaExceeded } from '../lib/firebase';
import { StudyGuide } from '../types';
import { BookOpen, AlertCircle, Plus, ChevronLeft, Trash2, FileText, Loader2, Upload, LayoutList, Trophy, RefreshCw, ArrowRight, ArrowLeft, Layers } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateStudyGuide, generateKnowledgeCheck } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Question } from '../types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface StudyHubProps {
  user: User;
  pool: Question[];
  onBack: () => void;
}

export function StudyHub({ user, pool, onBack }: StudyHubProps) {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewingGuide, setViewingGuide] = useState<StudyGuide | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [checkQuestions, setCheckQuestions] = useState<Question[]>([]);
  const [isGeneratingCheck, setIsGeneratingCheck] = useState(false);
  const [checkAnswers, setCheckAnswers] = useState<Record<string, string>>({});
  const [showCheckResults, setShowCheckResults] = useState(false);
  
  const [hubMode, setHubMode] = useState<'library' | 'flashcards'>('library');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const flashcards = useMemo(() => {
    return [...pool].sort(() => 0.5 - Math.random());
  }, [pool]);

  const sections = useMemo(() => {
    if (!viewingGuide) return [];
    
    // Attempt to split by ## or ### headings
    const lines = viewingGuide.content.split('\n');
    const result: { title: string, content: string }[] = [];
    
    let currentTitle = 'Overview / Introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      // Find headings (h1, h2, h3)
      const match = line.match(/^(#{1,3})\s+(.*)/);
      if (match) {
        // Only split if we have enough content, or if we want to honor every heading
        // Let's create a new section for every h1 or h2, but keep h3 bundled?
        // Let's just break on h1 and h2
        if (match[1].length <= 2) {
          if (currentContent.length > 0 || currentTitle !== 'Overview / Introduction') {
            result.push({ title: currentTitle, content: currentContent.join('\n') });
          }
          currentTitle = match[2];
          currentContent = [line];
        } else {
          currentContent.push(line);
        }
      } else {
        currentContent.push(line);
      }
    }
    
    if (currentContent.length > 0) {
      result.push({ title: currentTitle, content: currentContent.join('\n') });
    }
    
    // Filter empty
    return result.filter(s => s.content.trim().length > 0);
  }, [viewingGuide]);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Strategy');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const categories = [
    'General Strategy',
    'Numerical Reasoning',
    'Verbal Reasoning',
    'Logical / Inductive Reasoning',
    'Situational Judgement (SJT)'
  ];

  useEffect(() => {
    const q = query(
      collection(db, 'studyGuides'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    let unsubscribe: () => void;
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as StudyGuide[];
      setGuides(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching study guides:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'studyGuides');
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
      if (unsubscribe) unsubscribe();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.uid]);

  const handleGenerate = async () => {
    if (!newTitle.trim()) {
      setError("Please provide a title for the study guide.");
      return;
    }

    if (isFirestoreQuotaExceeded) {
      setError("Database quota exceeded. You cannot save new study guides to the cloud at this time.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedContent = await generateStudyGuide(newCategory, pdfFile);
      
      await addDoc(collection(db, 'studyGuides'), {
        userId: user.uid,
        title: newTitle.trim(),
        category: newCategory,
        content: generatedContent,
        createdAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewTitle('');
      setPdfFile(null);
    } catch (e: any) {
      console.error(e);
      try {
        handleFirestoreError(e, OperationType.WRITE, 'studyGuides');
      } catch (err: any) {
        setError(err.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (guideId: string) => {
    if (confirm("Are you sure you want to delete this study guide?")) {
      try {
        await deleteDoc(doc(db, 'studyGuides', guideId));
        if (viewingGuide && viewingGuide.id === guideId) {
          setViewingGuide(null);
        }
      } catch (e) {
        console.error(e);
        try {
          handleFirestoreError(e, OperationType.DELETE, `studyGuides/${guideId}`);
        } catch (err: any) {
          setError(err.message);
        }
      }
    }
  };

  const handleStartCheck = async () => {
    if (!viewingGuide) return;
    setIsGeneratingCheck(true);
    setCheckAnswers({});
    setShowCheckResults(false);
    try {
      const q = await generateKnowledgeCheck(viewingGuide.content);
      setCheckQuestions(q);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGeneratingCheck(false);
    }
  };

  if (viewingGuide) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in">
        <button 
          onClick={() => {
            setViewingGuide(null);
            setActiveSection(0);
          }}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Library</span>
        </button>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar TOC */}
          <div className="w-full md:w-72 shrink-0 md:sticky md:top-6 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
               <div className="flex items-center space-x-2 mb-4">
                 <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md uppercase tracking-wider">
                   {viewingGuide.category}
                 </span>
               </div>
               <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{viewingGuide.title}</h1>
               <p className="text-xs text-slate-400 mb-6">
                 {format(viewingGuide.createdAt, 'MMM d, yyyy')}
               </p>
               
               <div className="space-y-1">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Table of Contents</h3>
                 {sections.map((section, idx) => (
                    <button
                       key={idx}
                       onClick={() => setActiveSection(idx)}
                       className={cn(
                         "w-full text-left px-3 py-2.5 text-sm font-medium transition-all rounded-xl flex items-center justify-between group",
                         activeSection === idx 
                           ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" 
                           : "text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 dark:text-slate-400"
                       )}
                    >
                        <span className="truncate pr-2">{section.title.replace(/[*_~`#]/g, '')}</span>
                        {activeSection === idx && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                        )}
                    </button>
                 ))}
               </div>
               <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleStartCheck}
                    disabled={isGeneratingCheck}
                    className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center justify-center space-x-2"
                  >
                    {isGeneratingCheck ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                    <span>{isGeneratingCheck ? 'Generating...' : 'Take Knowledge Check'}</span>
                  </button>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {checkQuestions.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Knowledge Check</h2>
                  <button 
                    onClick={() => setCheckQuestions([])}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-8">
                  {checkQuestions.map((q, idx) => {
                    const selected = checkAnswers[q.id];
                    const isCorrect = selected === q.answer;
                    
                    return (
                      <div key={q.id} className="space-y-4">
                        <p className="font-medium text-slate-900 dark:text-white">
                          <span className="text-indigo-600 dark:text-indigo-400 mr-2">{idx + 1}.</span>
                          {q.question}
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map(opt => (
                            <button
                              key={opt}
                              disabled={showCheckResults}
                              onClick={() => setCheckAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              className={cn(
                                "text-left px-4 py-3 rounded-xl border-2 transition-all text-sm",
                                selected === opt
                                  ? showCheckResults 
                                    ? isCorrect ? "bg-green-50 border-green-500 text-green-700" : "bg-red-50 border-red-500 text-red-700"
                                    : "bg-indigo-50 border-indigo-500 text-indigo-700"
                                  : showCheckResults && opt === q.answer
                                    ? "bg-green-50 border-green-500 text-green-700"
                                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {showCheckResults && selected && (
                          <div className={cn(
                            "p-4 rounded-xl text-sm flex items-start space-x-3 animate-in fade-in slide-in-from-top-2",
                            isCorrect ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                          )}>
                             {isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                             <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!showCheckResults ? (
                  <button
                    onClick={() => setShowCheckResults(true)}
                    disabled={Object.keys(checkAnswers).length < checkQuestions.length}
                    className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Check My Answers
                  </button>
                ) : (
                  <div className="flex space-x-3 mt-8">
                    <button
                      onClick={handleStartCheck}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Try New Questions
                    </button>
                    <button
                      onClick={() => setCheckQuestions([])}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      Return to Guide
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4">
                {sections[activeSection] ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 markdown-body prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-pre:bg-slate-50 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(() => {
                        // Prepend the title as an h2 if it doesn't already start with one, just to ensure consistency
                        let content = sections[activeSection].content;
                        if (!content.trim().startsWith('#')) {
                          content = `## ${sections[activeSection].title}\n\n${content}`;
                        }
                        return content;
                      })()}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">Select a section to view</div>
                )}
                
                {/* Pagination Controls */}
                <div className="mt-12 flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    disabled={activeSection === 0}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors flex items-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  
                  <div className="text-sm text-slate-400">
                    {activeSection + 1} of {sections.length}
                  </div>

                  <button
                    onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                    disabled={activeSection === sections.length - 1}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 transition-colors flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span>Study Hub</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Learn best practices and strategies to dominate assessments.</p>
          </div>
        </div>
        {!isCreating && (
          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setHubMode('library')}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  hubMode === 'library' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <BookOpen className="w-4 h-4" />
                <span>Library</span>
              </button>
              <button
                onClick={() => setHubMode('flashcards')}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  hubMode === 'flashcards' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <Layers className="w-4 h-4" />
                <span>Flashcards</span>
              </button>
            </div>
            
            {hubMode === 'library' && (
               <button
                 onClick={() => setIsCreating(true)}
                 className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md"
               >
                 <Plus className="w-5 h-5" />
                 <span className="hidden sm:inline">New Guide</span>
               </button>
            )}
          </div>
        )}
      </div>

      {hubMode === 'library' ? (
        <>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {isCreating && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-blue-200 dark:border-blue-800 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generate Study Guide</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., GMAT Numerical Strategies"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category / Topic</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Reference Material (Optional PDF)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {pdfFile ? pdfFile.name : "Click to upload a PDF (e.g., GMAT guide)"}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 35 * 1024 * 1024) {
                            setError(`File ${file.name} is too large (>${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file or specific chapter (max 35MB).`);
                            return;
                          }
                          setError(null);
                          setPdfFile(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewTitle('');
                      setPdfFile(null);
                    }}
                    className="px-6 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !newTitle.trim()}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                    <span>{isGenerating ? 'Generating...' : 'Generate Guide'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading study guides...</div>
          ) : guides.length === 0 && !isCreating ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mb-2">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Library is Empty</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Generate custom study guides based on categories, or upload your own reference PDFs to get AI-powered strategies and best practices.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors inline-block mt-2"
              >
                Create First Guide
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map(guide => (
                <div 
                  key={guide.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group"
                >
                  <div className="p-6 flex-1 cursor-pointer" onClick={() => setViewingGuide(guide)}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-md uppercase tracking-wider">
                        {guide.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                      {guide.content.replace(/[#_*~`]/g, '').substring(0, 150)}...
                    </p>
                  </div>
                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {format(guide.createdAt, 'MMM d, yyyy')}
                    </span>
                    <button
                      onClick={() => handleDelete(guide.id!)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center pt-8">
          {flashcards.length === 0 ? (
             <div className="text-center text-slate-500 dark:text-slate-400">
               No questions available. Add questions to your pool first.
             </div>
          ) : (
            <div className="w-full max-w-2xl">
              <div className="mb-6 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>Card {flashcardIndex + 1} of {flashcards.length}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                  {flashcards[flashcardIndex].category}
                </span>
              </div>
              
              <div 
                className="relative w-full h-[400px] mb-8 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div 
                  className={cn(
                    "w-full h-full transition-all duration-500 preserve-3d relative",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg p-8 flex flex-col justify-center items-center text-center hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                     <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 line-clamp-6">
                       {flashcards[flashcardIndex].question}
                     </p>
                     
                     <div className="absolute bottom-6 flex items-center text-slate-400 text-sm font-medium space-x-2 opacity-60">
                       <RefreshCw className="w-4 h-4" />
                       <span>Click to reveal</span>
                     </div>
                  </div>
                  
                  {/* Back */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-3xl shadow-lg p-8 flex flex-col justify-center items-center text-center rotate-y-180 overflow-y-auto"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                     <h3 className="text-sm uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-4">Answer</h3>
                     <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">
                       {flashcards[flashcardIndex].answer}
                     </p>
                     {flashcards[flashcardIndex].explanation && (
                       <p className="text-sm text-slate-600 dark:text-slate-300 prose prose-slate dark:prose-invert">
                         {flashcards[flashcardIndex].explanation}
                       </p>
                     )}
                     <div className="absolute bottom-6 flex items-center text-blue-400 text-sm font-medium space-x-2 opacity-60">
                       <RefreshCw className="w-4 h-4" />
                       <span>Click to hide</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                    setFlashcardIndex(prev => prev > 0 ? prev - 1 : flashcards.length - 1);
                  }}
                  className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                    setFlashcardIndex(prev => prev < flashcards.length - 1 ? prev + 1 : 0);
                  }}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-md font-medium"
                >
                  <span>Next Card</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

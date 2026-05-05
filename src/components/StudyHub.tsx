import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirestoreQuotaExceeded } from '../lib/firebase';
import { StudyGuide } from '../types';
import { BookOpen, AlertCircle, Plus, ChevronLeft, Trash2, FileText, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateStudyGuide } from '../lib/gemini';

interface StudyHubProps {
  user: User;
  onBack: () => void;
}

export function StudyHub({ user, onBack }: StudyHubProps) {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewingGuide, setViewingGuide] = useState<StudyGuide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  if (viewingGuide) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in">
        <button 
          onClick={() => setViewingGuide(null)}
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Library</span>
        </button>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md uppercase tracking-wider">
                {viewingGuide.category}
              </span>
              <span className="text-sm text-slate-400">
                {format(viewingGuide.createdAt, 'MMM d, yyyy')}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{viewingGuide.title}</h1>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 markdown-body prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {viewingGuide.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
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
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>New Guide</span>
          </button>
        )}
      </div>

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
    </div>
  );
}

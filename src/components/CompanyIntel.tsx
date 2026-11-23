import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2, Search, CheckCircle2, Copy, Download, ExternalLink,
  ArrowLeft, Trophy, Shield, Target, HelpCircle, Award, Loader2,
  Bookmark, BookmarkCheck, Briefcase, Globe, TrendingUp, Check,
  ChevronDown, AlertTriangle, RefreshCw, RotateCcw, Plus, Trash2,
  FileEdit, Clock, Sparkles
} from 'lucide-react';
import { CompanyDossier, Question } from '../types';
import {
  POPULAR_COMPANIES,
  ROLE_PRESETS,
  fetchCompanyResearch,
  fetchFreshCompanyQuiz,
  getSavedDossiers,
  saveDossierLocally,
  deleteDossierLocally,
  getCompanyPrepWorkspace,
  saveCompanyPrepWorkspace,
  CompanyPrepWorkspace
} from '../lib/companyResearch';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

interface CompanyIntelProps {
  initialCompany?: string;
  customCompanies?: string[];
  pool: Question[];
  onBack: () => void;
  onPracticeCompany?: (company: string) => void;
  onGenerateNewQuestions?: (company: string, isAdaptive?: boolean) => void;
  onAddQuestionsToPool?: (company: string) => Promise<number>;
}

type IntelTab =
  | 'overview'
  | 'values'
  | 'news'
  | 'pitches'
  | 'reverse_questions'
  | 'assessment'
  | 'quiz';

const PREP_CHECKLIST_ITEMS: { id: IntelTab; label: string }[] = [
  { id: 'overview', label: 'Footprint & Rivals' },
  { id: 'values', label: 'Core Values & STAR' },
  { id: 'news', label: 'Strategic Moves' },
  { id: 'pitches', label: 'Personal Pitch' },
  { id: 'reverse_questions', label: 'Questions to Ask' },
  { id: 'quiz', label: 'Knowledge Check' },
];

export function CompanyIntel({
  initialCompany = 'KPMG',
  customCompanies = [],
  pool,
  onBack,
  onPracticeCompany,
  onGenerateNewQuestions,
  onAddQuestionsToPool,
}: CompanyIntelProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>(initialCompany);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>(ROLE_PRESETS[0]);
  const [roleInput, setRoleInput] = useState<string>(ROLE_PRESETS[0]);
  const [dossier, setDossier] = useState<CompanyDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<IntelTab>('overview');
  const [switcherMode, setSwitcherMode] = useState<'presets' | 'saved'>('presets');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [savedList, setSavedList] = useState<CompanyDossier[]>(() => getSavedDossiers());

  // Personal prep workspace per company (script, checklist, pinned reverse questions)
  const [workspace, setWorkspace] = useState<CompanyPrepWorkspace>(() =>
    getCompanyPrepWorkspace(initialCompany)
  );
  const [questionFilter, setQuestionFilter] = useState<'all' | 'pinned'>('all');

  // Mini quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [askedQuizStems, setAskedQuizStems] = useState<string[]>([]);

  // Generate new questions menu state
  const [showGenerateMenu, setShowGenerateMenu] = useState<boolean>(false);
  const [isGeneratingPool, setIsGeneratingPool] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dossierContainerRef = useRef<HTMLDivElement>(null);
  const generateMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (generateMenuRef.current && !generateMenuRef.current.contains(event.target as Node)) {
        setShowGenerateMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combine popular and custom companies
  const availablePresets = useMemo(() => {
    const list = [...POPULAR_COMPANIES];
    for (const custom of customCompanies) {
      if (!list.some(p => p.name.toLowerCase() === custom.toLowerCase())) {
        list.push({
          name: custom,
          sector: 'Custom Employer',
          color: 'from-slate-700 to-slate-900',
        });
      }
    }
    return list;
  }, [customCompanies]);

  // Load workspace whenever selected company changes
  useEffect(() => {
    setWorkspace(getCompanyPrepWorkspace(selectedCompany));
    setQuestionFilter('all');
  }, [selectedCompany]);

  // Helper to update & persist workspace
  const updateWorkspace = (updater: (prev: CompanyPrepWorkspace) => CompanyPrepWorkspace) => {
    setWorkspace(prev => {
      const next = updater(prev);
      saveCompanyPrepWorkspace(dossier?.companyName || selectedCompany, next);
      return next;
    });
  };

  // Load dossier
  useEffect(() => {
    let isCurrent = true;
    const loadData = async () => {
      setLoading(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizError(null);
      try {
        const data = await fetchCompanyResearch(selectedCompany, targetRole, false);
        if (isCurrent) {
          setDossier(data);
          setSavedList(getSavedDossiers());
          setAskedQuizStems(data.miniQuiz.map(q => q.question));
        }
      } catch (err) {
        console.error('Failed to load company dossier:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadData();
    return () => {
      isCurrent = false;
    };
  }, [selectedCompany, targetRole]);

  const handleForceRefresh = async () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError(null);
    try {
      const fresh = await fetchCompanyResearch(selectedCompany, targetRole, true);
      setDossier(fresh);
      setSavedList(getSavedDossiers());
      setAskedQuizStems(fresh.miniQuiz.map(q => q.question));
      setFeedbackBanner({
        type: 'success',
        message: `Refreshed intelligence dossier for ${fresh.companyName} (${targetRole}).`,
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    } catch (err) {
      console.error('Failed to refresh dossier:', err);
      setFeedbackBanner({
        type: 'error',
        message: 'Could not refresh live intelligence right now. Showing saved dossier.',
      });
      setTimeout(() => setFeedbackBanner(null), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextCompany = searchQuery.trim() || selectedCompany;
    const nextRole = roleInput.trim() || ROLE_PRESETS[0];

    const companyChanged = nextCompany.toLowerCase() !== selectedCompany.toLowerCase();
    const roleChanged = nextRole.toLowerCase() !== targetRole.toLowerCase();

    if (searchQuery.trim()) {
      setSelectedCompany(nextCompany);
      setSearchQuery('');
    }
    if (roleChanged) {
      setTargetRole(nextRole);
    }
    if (!companyChanged && !roleChanged) {
      handleForceRefresh();
    }
  };

  const handleSelectSaved = (saved: CompanyDossier) => {
    const role = saved.targetRole || ROLE_PRESETS[0];
    setSelectedCompany(saved.companyName);
    setTargetRole(role);
    setRoleInput(role);
  };

  const handleDeleteSaved = (e: React.MouseEvent, companyName: string) => {
    e.stopPropagation();
    deleteDossierLocally(companyName);
    setSavedList(getSavedDossiers());
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(prev => (prev === id ? null : prev));
    }, 2200);
  };

  const toggleChecklistItem = (itemId: string) => {
    updateWorkspace(prev => {
      const exists = prev.checkedItems.includes(itemId);
      return {
        ...prev,
        checkedItems: exists
          ? prev.checkedItems.filter(id => id !== itemId)
          : [...prev.checkedItems, itemId],
      };
    });
  };

  const togglePinQuestion = (questionText: string) => {
    updateWorkspace(prev => {
      const exists = prev.pinnedQuestions.includes(questionText);
      return {
        ...prev,
        pinnedQuestions: exists
          ? prev.pinnedQuestions.filter(q => q !== questionText)
          : [...prev.pinnedQuestions, questionText],
      };
    });
  };

  const handleQuizAnswer = (qIndex: number, option: string) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (!dossier) return;
    const correctCount = dossier.miniQuiz.filter((q, idx) => quizAnswers[idx] === q.answer).length;
    if (correctCount >= Math.ceil(dossier.miniQuiz.length * 0.5)) {
      updateWorkspace(prev =>
        prev.checkedItems.includes('quiz')
          ? prev
          : { ...prev, checkedItems: [...prev.checkedItems, 'quiz'] }
      );
    }
    if (correctCount === dossier.miniQuiz.length && correctCount > 0) {
      confetti({
        particleCount: 70,
        spread: 55,
        origin: { y: 0.7 },
      });
    }
  };

  const handleGenerateFreshMiniQuiz = async () => {
    if (!dossier || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    setQuizError(null);
    try {
      const freshQuestions = await fetchFreshCompanyQuiz(dossier, askedQuizStems);
      const updatedDossier: CompanyDossier = {
        ...dossier,
        miniQuiz: freshQuestions,
      };
      setDossier(updatedDossier);
      saveDossierLocally(updatedDossier);
      setAskedQuizStems(prev => [...prev, ...freshQuestions.map(q => q.question)]);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } catch (err) {
      console.error('Fresh company quiz generation failed:', err);
      setQuizError('Could not generate new questions right now. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const exportPDF = async () => {
    if (!dossierContainerRef.current) return;
    setIsExporting(true);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(dossierContainerRef.current, {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        pixelRatio: 1.5,
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${dossier?.companyName || 'Company'}_Preparation_Dossier.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const companyPoolQuestions = useMemo(() => {
    if (!dossier) return [];
    return pool.filter(q => q.company?.toLowerCase() === dossier.companyName.toLowerCase());
  }, [pool, dossier]);

  const handleGenerateNew = (isAdaptive: boolean = false) => {
    if (!dossier) return;
    setShowGenerateMenu(false);
    if (onGenerateNewQuestions) {
      onGenerateNewQuestions(dossier.companyName, isAdaptive);
    } else if (onPracticeCompany) {
      onPracticeCompany(dossier.companyName);
    }
  };

  const handleAddPoolQuestions = async () => {
    if (!dossier || !onAddQuestionsToPool) return;
    setShowGenerateMenu(false);
    setIsGeneratingPool(true);
    setFeedbackBanner(null);
    try {
      const count = await onAddQuestionsToPool(dossier.companyName);
      setFeedbackBanner({
        type: 'success',
        message: `Added ${count} fresh ${dossier.companyName} questions to your practice pool.`,
      });
      setTimeout(() => setFeedbackBanner(null), 5000);
    } catch (err) {
      console.error('Failed to add questions:', err);
      setFeedbackBanner({
        type: 'error',
        message: 'Unable to generate questions right now. Please try again.',
      });
      setTimeout(() => setFeedbackBanner(null), 5000);
    } finally {
      setIsGeneratingPool(false);
    }
  };

  // Speaking pace metrics for Personal Pitch Scratchpad
  const pitchMetrics = useMemo(() => {
    const words = workspace.customPitch
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const seconds = words > 0 ? Math.round((words / 140) * 60) : 0;
    const paceStatus =
      words === 0
        ? 'Empty'
        : seconds < 35
          ? 'Brief'
          : seconds <= 75
            ? 'Ideal 45–75s length'
            : 'Trim slightly for crisp delivery';
    return { words, seconds, paceStatus };
  }, [workspace.customPitch]);

  const checklistProgress = useMemo(() => {
    const validCount = PREP_CHECKLIST_ITEMS.filter(item =>
      workspace.checkedItems.includes(item.id)
    ).length;
    return {
      completed: validCount,
      total: PREP_CHECKLIST_ITEMS.length,
      percent: Math.round((validCount / PREP_CHECKLIST_ITEMS.length) * 100),
    };
  }, [workspace.checkedItems]);

  const displayedReverseQuestions = useMemo(() => {
    if (!dossier) return [];
    if (questionFilter === 'pinned') {
      return dossier.smartReverseQuestions.filter(q =>
        workspace.pinnedQuestions.includes(q.question)
      );
    }
    return dossier.smartReverseQuestions;
  }, [dossier, questionFilter, workspace.pinnedQuestions]);

  const formatMonogram = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2 && name.length > 5) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 4).toUpperCase();
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">Company Intelligence</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">Commercial Awareness & Interview Brief</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
              Organization Research Dossier
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {dossier && (
            <>
              <button
                onClick={exportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer min-h-[40px] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
                <span>{isExporting ? 'Exporting PDF...' : 'Download PDF'}</span>
              </button>

              {onPracticeCompany && companyPoolQuestions.length > 0 && (
                <button
                  onClick={() => onPracticeCompany(dossier.companyName)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  title={`Retake ${companyPoolQuestions.length} existing saved question(s) in your pool`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="tabular-nums">Retake Saved ({companyPoolQuestions.length})</span>
                </button>
              )}

              {/* Generate Brand New Questions Split Button */}
              <div className="relative" ref={generateMenuRef}>
                <div className="inline-flex rounded-lg overflow-hidden border border-blue-700/20">
                  <button
                    onClick={() => handleGenerateNew(false)}
                    disabled={isGeneratingPool}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                    title={`Generate brand new simulation questions for ${dossier.companyName}`}
                  >
                    {isGeneratingPool ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Target className="w-4 h-4" />
                    )}
                    <span>{isGeneratingPool ? 'Generating...' : 'Generate New Questions'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGenerateMenu(prev => !prev)}
                    disabled={isGeneratingPool}
                    className="px-2.5 py-2 bg-blue-700 hover:bg-blue-800 text-white border-l border-blue-500/40 text-xs font-semibold transition-colors cursor-pointer min-h-[40px] flex items-center justify-center disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                    aria-label="More question generation options"
                    aria-expanded={showGenerateMenu}
                  >
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-150',
                        showGenerateMenu && 'rotate-180'
                      )}
                    />
                  </button>
                </div>

                {showGenerateMenu && (
                  <div className="absolute right-0 mt-2 w-76 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      New assessment for {dossier.companyName}
                    </div>
                    <button
                      onClick={() => handleGenerateNew(false)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Standard Mock (15 Fresh Questions)
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Timed simulation across Numerical, Verbal, Logical & SJT
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleGenerateNew(true)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Adaptive Mode (Dynamic Scaling)
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Difficulty adjusts in real time based on your answers
                        </div>
                      </div>
                    </button>
                    {onAddQuestionsToPool && (
                      <button
                        onClick={handleAddPoolQuestions}
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-start gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                      >
                        <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            Add Fresh Questions to Pool
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Generate & save 15 questions without starting immediately
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transient Feedback Banner */}
      {feedbackBanner && (
        <div
          className={cn(
            'px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in duration-150',
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
          )}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unified Research Command Bar & Saved Dossiers Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Organization Search Input */}
          <div className="md:col-span-5 relative">
            <label htmlFor="company-search-input" className="sr-only">
              Target organization
            </label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="company-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Organization (current: ${selectedCompany})`}
              className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Target Role Input + Datalist */}
          <div className="md:col-span-4 relative">
            <label htmlFor="target-role-input" className="sr-only">
              Target role
            </label>
            <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="target-role-input"
              list="smartprep-role-presets"
              type="text"
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              placeholder="Target role (e.g., Audit Associate)"
              className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <datalist id="smartprep-role-presets">
              {ROLE_PRESETS.map(r => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          {/* Submit & Refresh Actions */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || isRefreshing}
              className="flex-1 px-4 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Research</span>
            </button>
            <button
              type="button"
              onClick={handleForceRefresh}
              disabled={loading || isRefreshing}
              className="px-3 py-2.5 min-h-[44px] min-w-[44px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Refresh live search intelligence"
              aria-label="Refresh live search intelligence"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-600')} />
            </button>
          </div>
        </form>

        {/* Presets vs Saved Dossiers Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {/* Segmented Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200/70 dark:border-slate-800 shrink-0 self-start">
            <button
              type="button"
              onClick={() => setSwitcherMode('presets')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap',
                switcherMode === 'presets'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Quick Select
            </button>
            <button
              type="button"
              onClick={() => setSwitcherMode('saved')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                switcherMode === 'saved'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              Saved Dossiers ({savedList.length})
            </button>
          </div>

          {/* Horizontal Scrollable Employer List */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 flex-1 min-w-0"
            data-lenis-prevent
          >
            {switcherMode === 'presets' ? (
              availablePresets.map(preset => {
                const isSelected = selectedCompany.toLowerCase() === preset.name.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedCompany(preset.name)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 cursor-pointer min-h-[34px]',
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {preset.name}
                  </button>
                );
              })
            ) : savedList.length === 0 ? (
              <span className="text-xs text-slate-500 dark:text-slate-400 py-1.5">
                No saved dossiers yet. Search any organization above to build your library.
              </span>
            ) : (
              savedList.map(saved => {
                const isSelected = selectedCompany.toLowerCase() === saved.companyName.toLowerCase();
                return (
                  <div
                    key={saved.id || saved.companyName}
                    onClick={() => handleSelectSaved(saved)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectSaved(saved);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0 cursor-pointer min-h-[34px]',
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{saved.companyName}</span>
                    {saved.targetRole && (
                      <span className={cn('text-[11px]', isSelected ? 'text-blue-100' : 'text-slate-400')}>
                        · {saved.targetRole.split('/')[0].trim()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={e => handleDeleteSaved(e, saved.companyName)}
                      className={cn(
                        'p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer',
                        isSelected ? 'text-blue-100 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                      )}
                      aria-label={`Remove ${saved.companyName} from saved dossiers`}
                      title="Remove saved dossier"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Dossier Content */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 py-4">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Researching {selectedCompany} for {targetRole}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Gathering official core values, market positioning, rival differentiators, and recent initiatives.
              </p>
            </div>
          </div>
          {/* Clean Skeleton Preview matching final dossier geometry */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="space-y-2 animate-pulse">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800/70 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : dossier ? (
        <div ref={dossierContainerRef} className="space-y-6">
          {/* Executive Brief Header Card (Single-Elevation, Zero Pill Clutter) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl tracking-wide shrink-0">
                  {formatMonogram(dossier.companyName)}
                </div>
                <div className="space-y-1.5 min-w-0">
                  {/* Unboxed Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{dossier.industry}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dossier.headquarters}</span>
                    <span aria-hidden="true">·</span>
                    <span>Est. {dossier.founded}</span>
                    {dossier.isLiveGrounded && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Live Search Verified
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
                    {dossier.companyName}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 italic max-w-2xl">
                    “{dossier.tagline}”
                  </p>
                </div>
              </div>

              {/* Tailored Role & Leadership Summary */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:text-right shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tailored Role Focus</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {dossier.targetRole || targetRole}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Leadership</div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {dossier.ceoOrLeadership}
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Column Full-Width Key Brief Strip (Tabular Numerals) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
              <div className="px-6 py-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Assessment Publisher</div>
                <div
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate"
                  title={dossier.assessmentStyle.testProvider}
                >
                  {dossier.assessmentStyle.testProvider}
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Hiring Stages</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                  {dossier.assessmentStyle.stages.length} stages mapped
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Cultural Pillars</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                  {dossier.coreValues.length} official values
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">Practice Bank</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                  {companyPoolQuestions.length} saved questions
                </div>
              </div>
            </div>

            {/* Interactive Interview Readiness Checklist */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prep Checklist
                </span>
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
                    style={{ width: `${checklistProgress.percent}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {checklistProgress.completed}/{checklistProgress.total} ready
                </span>
              </div>

              <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar"
                data-lenis-prevent
              >
                {PREP_CHECKLIST_ITEMS.map(item => {
                  const checked = workspace.checkedItems.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border',
                        checked
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      )}
                    >
                      <Check
                        className={cn(
                          'w-3 h-3',
                          checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                        )}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Clean Underline Tab Navigation */}
          <nav
            aria-label="Dossier sections"
            className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x"
            data-lenis-prevent
          >
            {[
              { id: 'overview', label: 'Overview & Rivals', icon: Building2 },
              { id: 'values', label: 'Core Values & STAR', icon: Shield, count: dossier.coreValues.length },
              { id: 'news', label: 'Strategic Moves', icon: TrendingUp, count: dossier.recentDevelopments.length },
              { id: 'pitches', label: 'Pitches & Script', icon: FileEdit, count: dossier.whyThisCompanyPitches.length },
              { id: 'reverse_questions', label: 'Questions to Ask', icon: HelpCircle, count: dossier.smartReverseQuestions.length },
              { id: 'assessment', label: 'Assessment & Red Flags', icon: Target },
              { id: 'quiz', label: 'Knowledge Check', icon: Trophy, count: dossier.miniQuiz.length },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as IntelTab)}
                  className={cn(
                    'relative flex items-center gap-2 px-3.5 py-3 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer min-h-[44px] border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                    isActive
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* TAB 1: Overview, Divisions & Competitor Matrix */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left 7 Cols: Footprint + Competitive Moat */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 flex flex-col justify-between">
                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <h3 className="text-lg font-semibold">Commercial Footprint & Business Model</h3>
                    </div>
                    <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {dossier.overview}
                    </p>
                  </div>

                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                      <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <h3 className="text-lg font-semibold">Competitive Moat & Market Position</h3>
                    </div>
                    <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {dossier.marketPosition}
                    </p>
                  </div>
                </div>

                {/* Right 5 Cols: Core Business Divisions */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Core Business Divisions
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {dossier.divisions.length} units
                    </span>
                  </div>
                  <ol className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                    {dossier.divisions.map((div, i) => (
                      <li key={i} className="py-3.5 first:pt-1 last:pb-0 flex items-start gap-3.5">
                        <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums mt-0.5 shrink-0">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <span className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                          {div}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Competitor Positioning Matrix ("Why this firm over rivals?") */}
              {dossier.competitors && dossier.competitors.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Why {dossier.companyName} Over Direct Rivals?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Use these differentiators when interviewers test whether you researched competitors.
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dossier.competitors.map((comp, idx) => (
                      <div
                        key={idx}
                        className="px-6 sm:px-8 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-baseline"
                      >
                        <div className="md:col-span-3 flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400 tabular-nums">
                            vs.
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {comp.name}
                          </span>
                        </div>
                        <p className="md:col-span-9 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {comp.differentiator}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Core Values & STAR Behavioral Prompts */}
          {activeTab === 'values' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="font-semibold text-slate-900 dark:text-white">Assessment scoring note:</strong>{' '}
                Situational Judgement Tests (SJTs) and competency interviews at {dossier.companyName} are graded directly against these official pillars. Rehearse one concrete STAR story for each prompt below.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dossier.coreValues.map((v, i) => (
                  <article
                    key={i}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 mr-2 tabular-nums">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          {v.value}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {v.explanation}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                          How to demonstrate in SJT & interviews
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {v.interviewAdvice}
                        </p>
                      </div>

                      {v.starPrompt && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                              STAR Behavioral Practice Prompt
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(v.starPrompt!, `star-${i}`)}
                              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === `star-${i}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                            “{v.starPrompt}”
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Recent Strategic Moves & Verified Grounding Sources */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Commercial Awareness Brief (2024–2026)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Citing current strategic moves separates top-decile candidates from generic applicants.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dossier.recentDevelopments.map((item, i) => (
                    <article key={i} className="p-6 sm:p-8 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {item.dateOrContext && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.dateOrContext}</span>
                          </>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {item.headline}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
                        {item.summary}
                      </p>
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                          Interview talking point:{' '}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic">
                          “{item.relevanceToCandidate}”
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Verified Grounding Sources (extracted from live Google Search grounding) */}
              {dossier.groundingSources && dossier.groundingSources.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Verified Research Sources
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {dossier.groundingSources.length} references
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {dossier.groundingSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate font-medium">{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: "Why This Firm?" Pitches & Personal Script Builder */}
          {activeTab === 'pitches' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
              {/* Left 7 Cols: Curated Pitch Angles */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 sm:px-7 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    “Why {dossier.companyName}?” Frameworks
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Load any angle into your personal script builder on the right to tailor it to your background.
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dossier.whyThisCompanyPitches.map((pitchObj, i) => (
                    <div key={i} className="p-6 sm:p-7 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mr-2 tabular-nums">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          {pitchObj.angle}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateWorkspace(prev => ({ ...prev, customPitch: pitchObj.pitch }))
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Use as Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => copyText(pitchObj.pitch, `pitch-${i}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {copiedId === `pitch-${i}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        “{pitchObj.pitch}”
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Personal Pitch Scratchpad (auto-saved per company) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 lg:sticky lg:top-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Your Personal Pitch Script
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Auto-saved locally for {dossier.companyName}. Aim for 45–75 seconds spoken.
                    </p>
                  </div>
                </div>

                <textarea
                  value={workspace.customPitch}
                  onChange={e =>
                    updateWorkspace(prev => ({ ...prev, customPitch: e.target.value }))
                  }
                  rows={8}
                  placeholder={`Draft your personalized "Why ${dossier.companyName}?" response here, or click "Use as Draft" on any template...`}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />

                {/* Speaking Pace Telemetry */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 tabular-nums">
                    <span>{pitchMetrics.words} words</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5" />~{pitchMetrics.seconds}s spoken
                    </span>
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      pitchMetrics.seconds >= 35 && pitchMetrics.seconds <= 75
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {pitchMetrics.paceStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!workspace.customPitch.trim()}
                    onClick={() => updateWorkspace(prev => ({ ...prev, customPitch: '' }))}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    Clear Draft
                  </button>
                  <button
                    type="button"
                    disabled={!workspace.customPitch.trim()}
                    onClick={() => copyText(workspace.customPitch, 'custom-pitch')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    {copiedId === 'custom-pitch' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Script</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy My Script</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Smart Questions to Ask Interviewers (with Pinning) */}
          {activeTab === 'reverse_questions' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    High-Signal Questions for Your Interviewer
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Pin your favorite 2–3 questions to build a quick-reference shortlist for interview day.
                  </p>
                </div>

                {/* Interactive Filter Segmented Control */}
                <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 self-start">
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('all')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                      questionFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    All ({dossier.smartReverseQuestions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('pinned')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                      questionFilter === 'pinned'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    Pinned ({workspace.pinnedQuestions.length})
                  </button>
                </div>
              </div>

              {displayedReverseQuestions.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You have not pinned any questions for {dossier.companyName} yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('all')}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Browse All Questions
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {displayedReverseQuestions.map((item, i) => {
                    const isPinned = workspace.pinnedQuestions.includes(item.question);
                    return (
                      <article
                        key={item.question}
                        className={cn(
                          'bg-white dark:bg-slate-900 rounded-2xl p-6 border flex flex-col justify-between space-y-4 transition-colors',
                          isPinned
                            ? 'border-blue-300 dark:border-blue-700'
                            : 'border-slate-200 dark:border-slate-800'
                        )}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                              {String(i + 1).padStart(2, '0')}.
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => togglePinQuestion(item.question)}
                                className={cn(
                                  'p-2 rounded-lg transition-colors cursor-pointer',
                                  isPinned
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                )}
                                title={isPinned ? 'Unpin question' : 'Pin to shortlist'}
                                aria-label={isPinned ? 'Unpin question' : 'Pin to shortlist'}
                              >
                                {isPinned ? (
                                  <BookmarkCheck className="w-4 h-4" />
                                ) : (
                                  <Bookmark className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyText(item.question, `rev-q-${i}`)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Copy question"
                                aria-label="Copy question"
                              >
                                {copiedId === `rev-q-${i}` ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                            “{item.question}”
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Why it works:{' '}
                          </span>
                          {item.contextWhyToAsk}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Assessment Architecture, Traps & Interview Red Flags */}
          {activeTab === 'assessment' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Pipeline Stages */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 sm:px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {dossier.companyName} Recruitment Pipeline
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Publisher: {dossier.assessmentStyle.testProvider}
                      </p>
                    </div>
                  </div>
                  <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dossier.assessmentStyle.stages.map((stage, i) => (
                      <li key={i} className="px-6 sm:px-7 py-4 flex items-start gap-4">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed pt-0.5">
                          {stage}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="px-6 sm:px-7 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2">
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      Insider Strategy to Pass
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {dossier.assessmentStyle.tipsForSuccess}
                    </p>
                  </div>
                </div>

                {/* Right Column: Common Traps & Red Flags + Direct Practice Launch */}
                <div className="lg:col-span-5 space-y-6">
                  {dossier.assessmentStyle.commonTraps &&
                    dossier.assessmentStyle.commonTraps.length > 0 && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <h4 className="text-sm font-semibold">Common Assessment Pitfalls</h4>
                        </div>
                        <ul className="space-y-2.5">
                          {dossier.assessmentStyle.commonTraps.map((trap, i) => (
                            <li
                              key={i}
                              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5"
                            >
                              <span className="font-mono text-xs text-slate-400 tabular-nums mt-0.5">
                                {String(i + 1).padStart(2, '0')}.
                              </span>
                              <span>{trap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {dossier.redFlags && dossier.redFlags.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                        <Shield className="w-4 h-4 shrink-0" />
                        <h4 className="text-sm font-semibold">Interview Red Flags to Avoid</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {dossier.redFlags.map((flag, i) => (
                          <li
                            key={i}
                            className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2.5"
                          >
                            <span className="font-mono text-xs text-rose-500 tabular-nums mt-0.5">
                              ×
                            </span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ready to Practice CTA Block */}
                  <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-6 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold">
                        Simulate the {dossier.companyName} Assessment
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Generate 15 tailored Numerical, Verbal, Logical, and Situational Judgement questions now.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleGenerateNew(false)}
                        className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Start 15-Question Mock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateNew(true)}
                        className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Start Adaptive Mode
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Interactive Commercial Awareness Knowledge Check */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {dossier.companyName} Readiness Check
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Verify your recall of values, leadership, platforms, and situational judgement before interviewing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateFreshMiniQuiz}
                  disabled={isGeneratingQuiz}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  {isGeneratingQuiz ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>{isGeneratingQuiz ? 'Generating Fresh Set...' : 'Generate New Quiz Set'}</span>
                </button>
              </div>

              {quizError && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                  {quizError}
                </div>
              )}

              <div className="space-y-5">
                {dossier.miniQuiz.map((q, qIndex) => {
                  const selected = quizAnswers[qIndex];
                  const isCorrect = selected === q.answer;
                  return (
                    <div
                      key={`${qIndex}-${q.question.slice(0, 20)}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4"
                    >
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        Question {qIndex + 1} of {dossier.miniQuiz.length}
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                        {q.question}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {q.options.map((opt, optIndex) => {
                          const isOptionSelected = selected === opt;
                          let optionClasses =
                            'p-3.5 rounded-xl border text-sm font-medium transition-colors text-left flex items-center justify-between gap-2 min-h-[44px] cursor-pointer ';

                          if (!quizSubmitted) {
                            optionClasses += isOptionSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-900 dark:text-blue-200'
                              : 'bg-slate-50/70 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80';
                          } else {
                            optionClasses += 'cursor-default ';
                            if (opt === q.answer) {
                              optionClasses +=
                                'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
                            } else if (isOptionSelected && !isCorrect) {
                              optionClasses +=
                                'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200';
                            } else {
                              optionClasses +=
                                'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() => handleQuizAnswer(qIndex, opt)}
                              className={optionClasses}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && opt === q.answer && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span
                            className={cn(
                              'font-semibold mr-1.5',
                              isCorrect
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            )}
                          >
                            {isCorrect ? 'Correct:' : 'Review:'}
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted ? (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < dossier.miniQuiz.length}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Submit Knowledge Check
                    </button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      Score:{' '}
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {dossier.miniQuiz.filter((q, idx) => quizAnswers[idx] === q.answer).length}
                      </span>{' '}
                      / {dossier.miniQuiz.length} correct
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake This Set</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateFreshMiniQuiz}
                        disabled={isGeneratingQuiz}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingQuiz ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>Generate New Quiz Set</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateNew(false)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Launch Full Assessment</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No company intelligence available yet. Enter any organization name above to begin.
          </p>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CompanyDossier } from '../types';
import { COMPANY_PRESETS, POPULAR_COMPANY_NAMES, TRACK_PRESETS } from '../data/companyPresets';
import { 
  Building2, Search, Sparkles, BookOpen, Target, CheckCircle2, 
  HelpCircle, Download, Copy, ArrowLeft, RefreshCw, Layers, 
  Share2, Shield, TrendingUp, AlertTriangle, MessageSquare, 
  Briefcase, Globe, Award, ChevronRight, X, ExternalLink, 
  Compass, Check, Lightbulb
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface CompanyResearchHubProps {
  onBack: () => void;
  initialCompany?: string;
}

const STORAGE_KEY_DOSSIERS = 'smartprep_company_dossiers';

export function CompanyResearchHub({ onBack, initialCompany }: CompanyResearchHubProps) {
  // Load saved dossiers or initialize with presets
  const [savedDossiers, setSavedDossiers] = useState<CompanyDossier[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOSSIERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return COMPANY_PRESETS;
  });

  // Current active dossier
  const [selectedDossier, setSelectedDossier] = useState<CompanyDossier>(() => {
    if (initialCompany) {
      const found = savedDossiers.find(d => d.companyName.toLowerCase() === initialCompany.toLowerCase());
      if (found) return found;
      const presetFound = COMPANY_PRESETS.find(d => d.companyName.toLowerCase() === initialCompany.toLowerCase());
      if (presetFound) return presetFound;
    }
    return savedDossiers[0] || COMPANY_PRESETS[0];
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'values' | 'strategy' | 'why_us' | 'jargon' | 'scenario'>('overview');
  
  // Generation state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(TRACK_PRESETS[0]);
  const [customFocus, setCustomFocus] = useState('Assessment center, situational judgement, partner interview, firm values');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Scenario test state
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<number | null>(null);
  const [isScenarioAnswered, setIsScenarioAnswered] = useState(false);

  // Flash Quiz state
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  
  // Export and copy states
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const dossierRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Save dossiers on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOSSIERS, JSON.stringify(savedDossiers));
    } catch (e) {
      console.warn("Failed to persist dossiers", e);
    }
  }, [savedDossiers]);

  // Handle outside click for search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter popular suggestions based on input
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_COMPANY_NAMES;
    return POPULAR_COMPANY_NAMES.filter(name => 
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Reset scenario selection when switching dossiers
  useEffect(() => {
    setSelectedScenarioOption(null);
    setIsScenarioAnswered(false);
    setQuizScore(null);
    setQuizAnswers({});
  }, [selectedDossier.id]);

  // Handle AI generation for arbitrary company
  const handleGenerateDossier = async (targetCompany: string) => {
    const comp = targetCompany.trim();
    if (!comp) return;

    // Check if we already have it saved
    const existing = savedDossiers.find(d => d.companyName.toLowerCase() === comp.toLowerCase());
    if (existing) {
      setSelectedDossier(existing);
      setSearchQuery('');
      setShowSearchDropdown(false);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setShowSearchDropdown(false);

    try {
      const response = await fetch('/api/company-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: comp,
          targetRole: selectedTrack,
          customFocus: customFocus
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to research company (${response.status})`);
      }

      const newDossier: CompanyDossier = await response.json();
      
      setSavedDossiers(prev => [newDossier, ...prev.filter(d => d.companyName.toLowerCase() !== comp.toLowerCase())]);
      setSelectedDossier(newDossier);
      setSearchQuery('');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error("Dossier generation failed:", err);
      // If error, check if we have a preset fallback
      const preset = COMPANY_PRESETS.find(d => d.companyName.toLowerCase().includes(comp.toLowerCase()));
      if (preset) {
        setSelectedDossier(preset);
        setGenerationError("Notice: Live AI research timed out. Loaded verified curated briefing for " + preset.companyName + ".");
      } else {
        setGenerationError(err.message || "Failed to research company. Please check your internet connection and try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy "Why Us?" Cheat sheet to clipboard
  const handleCopyCheatSheet = () => {
    if (!selectedDossier) return;
    
    let text = `=== ${selectedDossier.companyName} PREP DOSSIER & CHEAT SHEET ===\n`;
    text += `Target Track: ${selectedDossier.targetRole || 'Graduate Trainee'}\n`;
    text += `Industry: ${selectedDossier.overview.industry}\n\n`;
    
    text += `--- CORE VALUES & BEHAVIORAL PROOFS ---\n`;
    selectedDossier.values.forEach(v => {
      text += `• ${v.name}: ${v.description}\n  How to prove: ${v.application}\n\n`;
    });

    text += `--- "WHY THIS FIRM?" TALKING POINTS ---\n`;
    selectedDossier.whyUsTalkingPoints.forEach(p => {
      text += `• ${p.angle}:\n  "${p.talkingPoint}"\n\n`;
    });

    text += `--- SMART QUESTIONS TO ASK INTERVIEWERS ---\n`;
    selectedDossier.assessmentIntel.smartQuestionsToAsk.forEach((q, i) => {
      text += `${i + 1}. "${q}"\n`;
    });

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Export dossier to PDF
  const handleExportPDF = async () => {
    if (!dossierRef.current) return;
    setIsExporting(true);
    try {
      const imgData = await toPng(dossierRef.current, {
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#ffffff',
      });
      
      const width = dossierRef.current.offsetWidth;
      const height = dossierRef.current.offsetHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 287));
      pdf.save(`${selectedDossier.companyName.replace(/\s+/g, '_')}_Prep_Dossier.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate 4-question flash quiz from dossier
  const flashQuizQuestions = useMemo(() => {
    if (!selectedDossier) return [];
    return [
      {
        question: `Which of the following is one of ${selectedDossier.companyName}'s official core values or cultural pillars?`,
        options: [
          selectedDossier.values[0]?.name || "Integrity & Excellence",
          "Move Fast and Break Things",
          "Revenue Over Process",
          "Individual Primacy"
        ].sort(() => 0.5 - Math.random()),
        correctAnswer: selectedDossier.values[0]?.name || "Integrity & Excellence",
        tip: `The firm explicitly emphasizes "${selectedDossier.values[0]?.name}": ${selectedDossier.values[0]?.description}`
      },
      {
        question: `In ${selectedDossier.companyName}'s assessment & interview process, what should you avoid or watch out for?`,
        options: [
          selectedDossier.assessmentIntel.interviewWatchouts[0] || "Being overly individualistic without team consensus",
          "Demonstrating commercial curiosity",
          "Knowing the firm's strategic partnerships",
          "Asking thoughtful questions about digital transformation"
        ].sort(() => 0.5 - Math.random()),
        correctAnswer: selectedDossier.assessmentIntel.interviewWatchouts[0] || "Being overly individualistic without team consensus",
        tip: `Watchout: ${selectedDossier.assessmentIntel.interviewWatchouts[0]}`
      },
      {
        question: `What is a primary strategic priority currently emphasized by ${selectedDossier.companyName}?`,
        options: [
          selectedDossier.strategicPriorities[0]?.title || "Enterprise Digital & AI Transformation",
          "Eliminating all consulting service lines",
          "Discontinuing graduate recruitment programs",
          "Moving exclusively to physical paper record-keeping"
        ].sort(() => 0.5 - Math.random()),
        correctAnswer: selectedDossier.strategicPriorities[0]?.title || "Enterprise Digital & AI Transformation",
        tip: `${selectedDossier.strategicPriorities[0]?.title}: ${selectedDossier.strategicPriorities[0]?.detail}`
      },
      {
        question: `When asked "Why do you want to work at ${selectedDossier.companyName} specifically over competitors?", what is a recommended authentic angle?`,
        options: [
          selectedDossier.whyUsTalkingPoints[0]?.angle || "Multidisciplinary collaboration and culture",
          "I simply applied to every company on the list",
          "Your office is closer to my home",
          "I think all firms in this industry are identical"
        ].sort(() => 0.5 - Math.random()),
        correctAnswer: selectedDossier.whyUsTalkingPoints[0]?.angle || "Multidisciplinary collaboration and culture",
        tip: `Strong talking point: ${selectedDossier.whyUsTalkingPoints[0]?.talkingPoint}`
      }
    ];
  }, [selectedDossier]);

  const handleSelectQuizAnswer = (qIdx: number, optIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleFinishQuiz = () => {
    let correct = 0;
    flashQuizQuestions.forEach((q, idx) => {
      const chosenIdx = quizAnswers[idx];
      if (chosenIdx !== undefined && q.options[chosenIdx] === q.correctAnswer) {
        correct++;
      }
    });
    setQuizScore(correct);
    if (correct >= 3) {
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-200">
      {/* Top Banner Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20 shadow-2xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Company Intelligence & Prep Dossier
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  AI Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Deep background research, verified values, strategic initiatives, and "Why Us?" talking points.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCheatSheet}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              title="Copy core talking points to notes"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Cheat Sheet</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsQuizModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-colors"
            >
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Test Firm Knowledge</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Research Input Bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            
            {/* Search Input with Autocomplete */}
            <div className="flex-1 relative" ref={searchContainerRef}>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleGenerateDossier(searchQuery);
                    }
                  }}
                  placeholder="Enter any organization (e.g. KPMG, McKinsey, Unilever, Shell, Standard Chartered)..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* Suggestions dropdown */}
              {showSearchDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Popular Candidate Target Companies
                  </div>
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleGenerateDossier(name)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors"
                    >
                      <span>{name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target Role Track Selector */}
            <div className="w-full sm:w-64">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TRACK_PRESETS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleGenerateDossier(searchQuery || selectedDossier.companyName)}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Researching Organization...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Research Organization</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-400 dark:text-slate-500 mr-1 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1" /> Quick Presets:
            </span>
            {COMPANY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedDossier(preset)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium transition-all",
                  selectedDossier.id === preset.id
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {preset.companyName}
              </button>
            ))}

            {savedDossiers.filter(d => !COMPANY_PRESETS.some(p => p.id === d.id)).map((custom) => (
              <button
                key={custom.id}
                onClick={() => setSelectedDossier(custom)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center space-x-1",
                  selectedDossier.id === custom.id
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                )}
              >
                <span>{custom.companyName}</span>
                <span className="text-[10px] opacity-75">★</span>
              </button>
            ))}
          </div>
        </div>

        {generationError && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-4 rounded-2xl flex items-start space-x-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">{generationError}</p>
          </div>
        )}

        {/* Dossier Content Body */}
        <div ref={dossierRef} className="space-y-6">
          
          {/* Company Hero Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {selectedDossier.overview.industry}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Track: {selectedDossier.targetRole || 'Graduate Trainee'}
                  </span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {selectedDossier.companyName}
                </h2>
                
                <p className="text-base text-slate-600 dark:text-slate-400 font-medium max-w-3xl">
                  {selectedDossier.tagline}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Values Documented</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedDossier.values.length} Pillars
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Why Us? Points</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedDossier.whyUsTalkingPoints.length} Arguments
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              {[
                { id: 'overview', label: 'Overview & Facts', icon: Globe },
                { id: 'values', label: 'Core Values & Cultural Alignment', icon: Shield },
                { id: 'strategy', label: 'Strategic Moves & Deals', icon: TrendingUp },
                { id: 'why_us', label: '"Why Us?" Cheat Sheet', icon: Lightbulb },
                { id: 'jargon', label: 'Key Jargon & Frameworks', icon: BookOpen },
                { id: 'scenario', label: 'Workplace SJT Scenario', icon: Target },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: OVERVIEW & FAST FACTS */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {/* Summary */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Organization Summary & Business Model</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedDossier.overview.summary}
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Direct Competitors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDossier.overview.primaryCompetitors.map(c => (
                      <span key={c} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fast Facts Bento */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Headquarters</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedDossier.overview.headquarters}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Global Scale & Footprint</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedDossier.overview.globalReach}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Executive Leadership</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedDossier.overview.keyLeadership}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4" />
                    <span>Candidate Recruiter Tip</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Always memorize the Global CEO's name and the primary competitive difference between {selectedDossier.companyName} and {selectedDossier.overview.primaryCompetitors[0] || 'competitors'}. Assessors test whether you truly know who you applied to.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CORE VALUES & CULTURAL ALIGNMENT */}
          {activeTab === 'values' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800/40 flex items-start space-x-3.5">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                    Why Company Values Matter in Your Assessment
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Situational Judgement Tests (SJT) and behavioral interview questions at {selectedDossier.companyName} are scored directly against these exact core values. When answering "Tell me about a time when...", frame your actions around these specific pillars.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {selectedDossier.values.map((val, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{val.name}</h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Core Pillar</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Internal Meaning</div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{val.description}</p>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-800/40">
                      <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>How To Prove This in Assessment / Interview</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{val.application}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STRATEGIC PRIORITIES & DEALS */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <span>Major Strategic Priorities</span>
                  </h3>

                  {selectedDossier.strategicPriorities.map((strat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                          Strategic Thrust
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{strat.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{strat.detail}</p>
                      
                      <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Candidate Interview Weave</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{strat.interviewTip}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    <span>Recent Milestones & Public Moves</span>
                  </h3>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mentioning a real initiative that occurred in the past 12-24 months demonstrates exceptional commercial awareness and proves you didn't just read Wikipedia five minutes before the interview.
                    </p>

                    <div className="space-y-3 pt-2">
                      {selectedDossier.recentInitiatives.map((init, i) => (
                        <div key={i} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                            {init}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/40">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                      Commercial Awareness Tip
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      Tie these strategic priorities to how your target role ({selectedDossier.targetRole || 'Graduate Trainee'}) will create value. For example, explain how automated tools allow trainees to perform deeper anomaly analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: "WHY US?" CHEAT SHEET & INTERVIEW INTEL */}
          {activeTab === 'why_us' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Why Us Cards */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      The "Why {selectedDossier.companyName}?" Battle-Tested Talking Points
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Never answer "Because you are a big prestigious firm." Use these specific, authentic angles:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {selectedDossier.whyUsTalkingPoints.map((pt, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                          {pt.angle}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        "{pt.talkingPoint}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment Watchouts & Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Watchouts */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2.5 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">Candidate Pitfalls & Red Flags</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mistakes that frequently lead to candidate rejection at {selectedDossier.companyName}:
                  </p>

                  <div className="space-y-2.5">
                    {selectedDossier.assessmentIntel.interviewWatchouts.map((w, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-900 dark:text-red-300">
                        <span className="font-bold text-red-500">•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Questions */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                    <MessageSquare className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Smart Questions to Ask the Partner
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    When the interviewer asks "Do you have any questions for us?", select from these high-caliber prompts:
                  </p>

                  <div className="space-y-2.5">
                    {selectedDossier.assessmentIntel.smartQuestionsToAsk.map((q, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed flex items-start space-x-2.5">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{idx + 1}.</span>
                        <span>"{q}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KEY JARGON & FRAMEWORKS */}
          {activeTab === 'jargon' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Firm Terminology & Proprietary Frameworks
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Understand the everyday terms used by {selectedDossier.companyName} teams on client engagements:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {selectedDossier.keyTerminology.map((item, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                      <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                        {item.term}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WORKPLACE SJT SCENARIO */}
          {activeTab === 'scenario' && selectedDossier.sampleScenario && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Situational Judgement Simulation ({selectedDossier.companyName})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Test how you would handle an ethical client dilemma based on {selectedDossier.companyName}'s culture.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    Interactive
                  </span>
                </div>

                {/* Scenario description */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedDossier.sampleScenario.scenario}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question: {selectedDossier.sampleScenario.question}
                  </h4>
                  
                  <div className="space-y-2.5 pt-2">
                    {selectedDossier.sampleScenario.options.map((opt, idx) => {
                      const isSelected = selectedScenarioOption === idx;
                      const isCorrect = idx === selectedDossier.sampleScenario?.correctIndex;
                      
                      let optionClasses = "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-300";
                      
                      if (isScenarioAnswered) {
                        if (isCorrect) {
                          optionClasses = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold";
                        } else if (isSelected && !isCorrect) {
                          optionClasses = "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200";
                        }
                      } else if (isSelected) {
                        optionClasses = "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isScenarioAnswered}
                          onClick={() => {
                            setSelectedScenarioOption(idx);
                            setIsScenarioAnswered(true);
                            if (isCorrect) {
                              confetti({ particleCount: 50, spread: 40, origin: { y: 0.7 } });
                            }
                          }}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition-all flex items-start space-x-3",
                            optionClasses
                          )}
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation feedback */}
                {isScenarioAnswered && (
                  <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Assessor Rationale</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedDossier.sampleScenario.explanation}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedScenarioOption(null);
                        setIsScenarioAnswered(false);
                      }}
                      className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FLASH QUIZ MODAL */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Test Your Knowledge: {selectedDossier.companyName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify you understand the firm's core values, strategic focus, and candidate watchouts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizScore === null ? (
              <div className="space-y-6">
                {flashQuizQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <span className="leading-relaxed">{q.question}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                            className={cn(
                              "w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all flex items-center space-x-2.5",
                              isSelected
                                ? "bg-blue-600 text-white font-semibold border-blue-600 shadow-2xs"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            )}
                          >
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                              {isSelected ? "✓" : ""}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleFinishQuiz}
                  disabled={Object.keys(quizAnswers).length < flashQuizQuestions.length}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  Submit & Score Knowledge Check
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {quizScore >= 3 ? "Excellent Preparation!" : "Review the Briefing"}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    You scored <strong className="text-blue-600 dark:text-blue-400">{quizScore} / {flashQuizQuestions.length}</strong> on {selectedDossier.companyName} research.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  {flashQuizQuestions.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Correct Answer: {q.correctAnswer}
                      </div>
                      <div className="text-slate-500 text-[11px] italic">
                        Tip: {q.tip}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    onClick={() => {
                      setQuizScore(null);
                      setQuizAnswers({});
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => setIsQuizModalOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building2, Search, Sparkles, BookOpen, CheckCircle2, Copy, Download, 
  ExternalLink, ArrowRight, ArrowLeft, Trophy, Star, Shield, Target, 
  Compass, HelpCircle, Layers, Award, Loader2, Bookmark, BookmarkCheck,
  Briefcase, Globe, Users, TrendingUp, Check, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { CompanyDossier, Question } from '../types';
import { 
  POPULAR_COMPANIES, 
  fetchCompanyResearch, 
  getSavedDossiers, 
  saveDossierLocally, 
  deleteDossierLocally 
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
}

export function CompanyIntel({
  initialCompany = 'KPMG',
  customCompanies = [],
  pool,
  onBack,
  onPracticeCompany,
}: CompanyIntelProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>(initialCompany);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('Graduate Trainee / Analyst');
  const [dossier, setDossier] = useState<CompanyDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'values' | 'news' | 'pitches' | 'reverse_questions' | 'assessment' | 'quiz'>('overview');
  const [copiedPitchIndex, setCopiedPitchIndex] = useState<number | null>(null);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [savedList, setSavedList] = useState<CompanyDossier[]>(() => getSavedDossiers());
  
  // Mini quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const dossierContainerRef = useRef<HTMLDivElement>(null);

  // Combine popular and custom companies
  const availablePresets = useMemo(() => {
    const list = [...POPULAR_COMPANIES];
    for (const custom of customCompanies) {
      if (!list.some(p => p.name.toLowerCase() === custom.toLowerCase())) {
        list.push({
          name: custom,
          sector: 'Custom Target Employer',
          color: 'from-purple-600 to-indigo-700'
        });
      }
    }
    return list;
  }, [customCompanies]);

  // Load dossier
  useEffect(() => {
    let isCurrent = true;
    const loadData = async () => {
      setLoading(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
      try {
        const data = await fetchCompanyResearch(selectedCompany, targetRole);
        if (isCurrent) {
          setDossier(data);
          setSavedList(getSavedDossiers());
        }
      } catch (err) {
        console.error("Failed to load company dossier:", err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadData();
    return () => {
      isCurrent = false;
    };
  }, [selectedCompany, targetRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCompany(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const copyToClipboard = (text: string, type: 'pitch' | 'question', index: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'pitch') {
      setCopiedPitchIndex(index);
      setTimeout(() => setCopiedPitchIndex(null), 2500);
    } else {
      setCopiedQuestionIndex(index);
      setTimeout(() => setCopiedQuestionIndex(null), 2500);
    }
  };

  const handleQuizAnswer = (qIndex: number, option: string) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (!dossier) return;
    const correctCount = dossier.miniQuiz.filter((q, idx) => quizAnswers[idx] === q.answer).length;
    if (correctCount === dossier.miniQuiz.length && correctCount > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const exportPDF = async () => {
    if (!dossierContainerRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(dossierContainerRef.current, {
        backgroundColor: '#0f172a',
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
      console.error("PDF generation failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // Questions in user pool for this company
  const companyPoolQuestions = useMemo(() => {
    if (!dossier) return [];
    return pool.filter(q => q.company?.toLowerCase() === dossier.companyName.toLowerCase());
  }, [pool, dossier]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Commercial Awareness & Fit
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Organization Background Research</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
              <span>Company Intelligence Dossier</span>
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
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
                className="flex items-center space-x-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold shadow-2xs disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4 text-blue-600" />}
                <span>{isExporting ? 'Generating PDF...' : 'Download Dossier (PDF)'}</span>
              </button>

              {onPracticeCompany && (
                <button
                  onClick={() => onPracticeCompany(dossier.companyName)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow"
                >
                  <Target className="w-4 h-4" />
                  <span>Practice {dossier.companyName} Test ({companyPoolQuestions.length || 'Mock'})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search Bar & Quick Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Research any organization (e.g., KPMG, Goldman Sachs, Paystack, McKinsey, Google)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 shrink-0 shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            <span>Generate Intelligence</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Select:</span>
          {availablePresets.map((preset) => {
            const isSelected = selectedCompany.toLowerCase() === preset.name.toLowerCase();
            return (
              <button
                key={preset.name}
                onClick={() => setSelectedCompany(preset.name)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dossier Content */}
      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 animate-spin"></div>
            <Building2 className="w-7 h-7 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Synthesizing Research for {selectedCompany}...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Extracting core values, market positioning, recent strategic initiatives, and interview talking points using Gemini with live search grounding.
            </p>
          </div>
        </div>
      ) : dossier ? (
        <div ref={dossierContainerRef} className="space-y-8">
          {/* Hero Firm Overview Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start space-x-4 sm:space-x-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl tracking-wider shadow-inner shrink-0">
                  {dossier.companyName.substring(0, 4).toUpperCase()}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      {dossier.industry}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-slate-300">
                      HQ: {dossier.headquarters}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {dossier.companyName}
                  </h2>
                  <p className="text-sm sm:text-base text-blue-200/90 font-medium italic">
                    "{dossier.tagline}"
                  </p>
                </div>
              </div>

              {/* Key Quick Stats Badge Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm lg:min-w-[340px]">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Founded</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{dossier.founded}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leadership</div>
                  <div className="text-sm font-semibold text-white mt-0.5 truncate max-w-[130px]" title={dossier.ceoOrLeadership}>
                    {dossier.ceoOrLeadership}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment Type</div>
                  <div className="text-sm font-semibold text-amber-300 mt-0.5 truncate" title={dossier.assessmentStyle.testProvider}>
                    {dossier.assessmentStyle.testProvider.split(' ')[0]}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'overview', label: 'Overview & Divisions', icon: Building2 },
              { id: 'values', label: 'Core Values & Fit', icon: Shield, badge: dossier.coreValues.length },
              { id: 'news', label: 'Recent Strategic Moves', icon: TrendingUp, badge: dossier.recentDevelopments.length },
              { id: 'pitches', label: '"Why This Firm?" Pitches', icon: Sparkles, badge: dossier.whyThisCompanyPitches.length },
              { id: 'reverse_questions', label: 'Smart Questions to Ask', icon: HelpCircle, badge: dossier.smartReverseQuestions.length },
              { id: 'assessment', label: 'Assessment Stages & Traps', icon: Target },
              { id: 'quiz', label: 'Test Your Knowledge', icon: Trophy, badge: `${dossier.miniQuiz.length} Qs` },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={cn(
                      "ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview & Divisions */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Executive Overview */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Commercial Footprint & Identity</h3>
                    </div>
                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {dossier.overview}
                    </p>
                  </div>

                  {/* Market Differentiation & Competitive Moat */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Competitive Moat & Market Position</h3>
                    </div>
                    <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {dossier.marketPosition}
                    </p>
                  </div>
                </div>

                {/* Right Column: Key Operating Divisions */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Core Business Divisions</h3>
                    </div>
                    <div className="space-y-2.5">
                      {dossier.divisions.map((div, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex items-start space-x-3">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {div}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Core Values & Fit */}
          {activeTab === 'values' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                  <strong>Why this matters for your assessment:</strong> Situational Judgement Tests (SJTs), blended psychometrics, and behavioral interview questions are scored directly against these exact values. When answering scenario dilemmas, always align your reasoning with the advice below.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dossier.coreValues.map((v, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        Value #{i + 1}
                      </span>
                      <Shield className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {v.value}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {v.explanation}
                    </p>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        <span>How to Demonstrate in Assessment & Interview</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                        {v.interviewAdvice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Recent Strategic Moves & News */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <span>Commercial Awareness Intelligence (2024–2026)</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Interviews frequently test whether you follow current business developments. Citing any of these strategic initiatives demonstrates superior preparation.
                </p>
              </div>

              <div className="space-y-4">
                {dossier.recentDevelopments.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        Strategic Initiative #{i + 1}
                      </span>
                      {item.dateOrContext && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {item.dateOrContext}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.headline}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Candidate Talking Point Strategy:
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic">
                        "{item.relevanceToCandidate}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Why This Company Pitches */}
          {activeTab === 'pitches' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>"Why Do You Want to Work at {dossier.companyName}?" Pitches</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select the angle that best resonates with your background. Practice delivering these responses smoothly in your own conversational tone.
                </p>
              </div>

              <div className="space-y-6">
                {dossier.whyThisCompanyPitches.map((pitchObj, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {pitchObj.angle}
                        </h4>
                      </div>
                      <button
                        onClick={() => copyToClipboard(pitchObj.pitch, 'pitch', i)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                      >
                        {copiedPitchIndex === i ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Pitch</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal font-sans">
                      "{pitchObj.pitch}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Smart Reverse Questions */}
          {activeTab === 'reverse_questions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  <span>Impressive Questions to Ask Your Interviewer</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  When the partner or interviewer asks "Do you have any questions for us?", asking these shows you conducted rigorous research on {dossier.companyName}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {dossier.smartReverseQuestions.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Question #{i + 1}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.question, 'question', i)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                          title="Copy Question"
                        >
                          {copiedQuestionIndex === i ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        "{item.question}"
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Why Ask This:</div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {item.contextWhyToAsk}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Assessment Stages & Traps */}
          {activeTab === 'assessment' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Assessment Architecture
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {dossier.companyName} Recruitment Journey
                    </h3>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    Publisher: {dossier.assessmentStyle.testProvider}
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="space-y-3 pt-2">
                  {dossier.assessmentStyle.stages.map((stage, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                        {stage}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Insider Tips for Success */}
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/40 space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-bold text-blue-900 dark:text-blue-300">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Insider Tactics to Pass & Common Traps to Avoid</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {dossier.assessmentStyle.tipsForSuccess}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Mini-Quiz (Knowledge Check) */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>Test Your Knowledge of {dossier.companyName}</span>
                  </h3>
                  {quizSubmitted && (
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                      }}
                      className="flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Verify that you have internalized {dossier.companyName}'s core values, flagship platforms, and strategic facts before your interview.
                </p>
              </div>

              <div className="space-y-6">
                {dossier.miniQuiz.map((q, qIndex) => {
                  const selected = quizAnswers[qIndex];
                  const isCorrect = selected === q.answer;
                  return (
                    <div key={qIndex} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Question {qIndex + 1} of {dossier.miniQuiz.length}</span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {q.question}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {q.options.map((opt, optIndex) => {
                          const isOptionSelected = selected === opt;
                          let optionClasses = "p-3.5 rounded-2xl border text-sm font-medium transition-all text-left flex items-center justify-between ";

                          if (!quizSubmitted) {
                            optionClasses += isOptionSelected
                              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-600 text-blue-900 dark:text-blue-200"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900";
                          } else {
                            if (opt === q.answer) {
                              optionClasses += "bg-green-50 dark:bg-green-950/30 border-green-500 text-green-900 dark:text-green-200 font-bold";
                            } else if (isOptionSelected && !isCorrect) {
                              optionClasses += "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-900 dark:text-red-200";
                            } else {
                              optionClasses += "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() => handleQuizAnswer(qIndex, opt)}
                              className={optionClasses}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && opt === q.answer && (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className={cn(
                          "p-3.5 rounded-2xl text-xs sm:text-sm border leading-relaxed",
                          isCorrect
                            ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-900 dark:text-green-300"
                            : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300"
                        )}>
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < dossier.miniQuiz.length}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all shadow-sm"
                    >
                      Submit Knowledge Check
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No company intelligence available.
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { 
  Compass, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  Flame,
  Award,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { Question, QuestionProgress, QuizSession, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, isSameDay } from 'date-fns';

interface StudyRoadmapProps {
  pool: Question[];
  progress: Record<string, QuestionProgress>;
  sessions: QuizSession[];
  userProfile: UserProfile | null;
  onPracticeCategory?: (category: string) => void;
  onOpenStudyHub?: () => void;
}

interface CategoryMastery {
  category: string;
  total: number;
  attempted: number;
  mastered: number;
  accuracy: number; // 0 - 100
  masteryPercentage: number; // 0 - 100
  status: 'critical' | 'moderate' | 'mastered' | 'unstarted';
  recommendation: string;
}

export function StudyRoadmap({
  pool,
  progress,
  sessions,
  userProfile,
  onPracticeCategory,
  onOpenStudyHub,
}: StudyRoadmapProps) {
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<string | null>(null);

  // Default core categories if none in pool yet
  const defaultCategories = [
    'Numerical Reasoning',
    'Verbal Reasoning',
    'Logical Reasoning',
    'Situational Judgement',
    'Reading Comprehension',
    'Abstract Reasoning',
  ];

  // 1. Calculate Category Mastery Breakdown
  const categoryStats = useMemo(() => {
    const statsMap: Record<string, { total: number; attempted: number; mastered: number; totalCorrect: number; totalAttempts: number }> = {};

    // Initialize with pool categories or defaults
    const poolCategories = Array.from(new Set(pool.map(q => q.category).filter(Boolean)));
    const allCategories = poolCategories.length > 0 ? poolCategories : defaultCategories;

    allCategories.forEach(cat => {
      statsMap[cat] = { total: 0, attempted: 0, mastered: 0, totalCorrect: 0, totalAttempts: 0 };
    });

    pool.forEach(q => {
      const cat = q.category || 'General';
      if (!statsMap[cat]) {
        statsMap[cat] = { total: 0, attempted: 0, mastered: 0, totalCorrect: 0, totalAttempts: 0 };
      }
      statsMap[cat].total += 1;

      const p = progress[q.id];
      if (p) {
        if (p.correctCount > 0 || p.incorrectCount > 0) {
          statsMap[cat].attempted += 1;
          statsMap[cat].totalCorrect += p.correctCount;
          statsMap[cat].totalAttempts += (p.correctCount + p.incorrectCount);
        }
        if (p.mastered) {
          statsMap[cat].mastered += 1;
        }
      }
    });

    const result: CategoryMastery[] = Object.entries(statsMap).map(([category, data]) => {
      const total = data.total;
      const attempted = data.attempted;
      const mastered = data.mastered;
      const accuracy = data.totalAttempts > 0 ? Math.round((data.totalCorrect / data.totalAttempts) * 100) : 0;
      const masteryPercentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

      let status: 'critical' | 'moderate' | 'mastered' | 'unstarted' = 'unstarted';
      let recommendation = 'Not started yet. Begin foundational practice.';

      if (attempted === 0) {
        status = 'unstarted';
        recommendation = 'New topic! Complete 5-10 questions to establish baseline mastery.';
      } else if (masteryPercentage >= 75) {
        status = 'mastered';
        recommendation = 'High mastery level. Periodic review recommended to stay sharp.';
      } else if (masteryPercentage >= 40 || accuracy >= 60) {
        status = 'moderate';
        recommendation = 'Good progress! Target incorrect items to convert to full mastery.';
      } else {
        status = 'critical';
        recommendation = 'Priority focus area! Focus on step-by-step explanations and fundamentals.';
      }

      return {
        category,
        total,
        attempted,
        mastered,
        accuracy,
        masteryPercentage,
        status,
        recommendation,
      };
    });

    // Sort priority: critical first, then unstarted, then moderate, then mastered
    const priorityOrder = { critical: 0, unstarted: 1, moderate: 2, mastered: 3 };
    return result.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status] || a.masteryPercentage - b.masteryPercentage);
  }, [pool, progress]);

  // Priority topic to review next
  const nextPriorityTopic = categoryStats[0] || null;

  // 2. Daily Progress Visualization (Past 7 days)
  const last7Days = useMemo(() => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      
      // Calculate questions answered on this date
      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.createdAt);
        return isSameDay(sessionDate, date);
      });

      const questionsCount = daySessions.reduce((acc, s) => acc + s.totalQuestions, 0);
      const avgScore = daySessions.length > 0 
        ? Math.round(daySessions.reduce((acc, s) => acc + s.score, 0) / daySessions.length)
        : 0;

      days.push({
        date,
        dayName: format(date, 'EEE'),
        dateStr: format(date, 'MMM d'),
        isToday: i === 0,
        questionsCount,
        avgScore,
        metGoal: questionsCount >= (userProfile?.dailyGoal || 20),
      });
    }

    return days;
  }, [sessions, userProfile]);

  const weeklyQuestionsTotal = last7Days.reduce((acc, d) => acc + d.questionsCount, 0);
  const dailyGoal = userProfile?.dailyGoal || 20;

  // Overall Roadmap Stage
  const overallMastery = useMemo(() => {
    const totalQ = pool.length;
    if (totalQ === 0) return 0;
    const totalMastered = Object.values(progress).filter(p => p.mastered).length;
    return Math.round((totalMastered / totalQ) * 100);
  }, [pool, progress]);

  const roadmapStages = [
    { level: 1, title: 'Foundations', req: '0 - 25% Mastery', unlocked: true, current: overallMastery < 25 },
    { level: 2, title: 'Weakness Remediation', req: '25% - 50% Mastery', unlocked: overallMastery >= 25, current: overallMastery >= 25 && overallMastery < 50 },
    { level: 3, title: 'Speed & Precision', req: '50% - 75% Mastery', unlocked: overallMastery >= 50, current: overallMastery >= 50 && overallMastery < 75 },
    { level: 4, title: 'Assessment Mastery', req: '75%+ Mastery', unlocked: overallMastery >= 75, current: overallMastery >= 75 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Study Roadmap</h2>
              <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                Adaptive AI Path
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Targeted learning roadmap generated from your question mastery and speed metrics
            </p>
          </div>
        </div>

        {onOpenStudyHub && (
          <button
            onClick={onOpenStudyHub}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm transition-colors shrink-0"
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span>Open Study Guides</span>
          </button>
        )}
      </div>

      {/* 1. Milestone Path Progression */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-500" />
            Prep Journey Milestones
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {overallMastery}% Overall Mastery
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roadmapStages.map((stage) => (
            <div
              key={stage.level}
              className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                stage.current
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-400/30'
                  : stage.unlocked
                  ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  stage.current
                    ? 'bg-indigo-600 text-white'
                    : stage.unlocked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  Level {stage.level}
                </span>
                {stage.unlocked ? (
                  <CheckCircle2 className={`w-4 h-4 ${stage.current ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-500'}`} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{stage.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stage.req}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Priority Recommendation Card */}
      {nextPriorityTopic && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden border border-indigo-700/50">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">Recommended Next Step</span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">{nextPriorityTopic.category}</h3>
                <p className="text-indigo-200 text-sm mt-1 max-w-xl">
                  {nextPriorityTopic.recommendation}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs font-medium text-indigo-300">
                <span>Total Pool: {nextPriorityTopic.total} Qs</span>
                <span>•</span>
                <span>Mastered: {nextPriorityTopic.mastered} / {nextPriorityTopic.total}</span>
                <span>•</span>
                <span>Accuracy: {nextPriorityTopic.accuracy}%</span>
              </div>
            </div>

            {onPracticeCategory && (
              <button
                onClick={() => onPracticeCategory(nextPriorityTopic.category)}
                className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-indigo-500/20 shrink-0"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Practice {nextPriorityTopic.category}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Daily Progress Visualization (7-Day Track) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Progress Visualization (Past 7 Days)</h3>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Weekly Volume: <span className="font-bold text-slate-800 dark:text-slate-200">{weeklyQuestionsTotal} questions</span>
          </div>
        </div>

        {/* 7-Day Bar / Node Chart */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {last7Days.map((day) => {
            const heightPercent = Math.min((day.questionsCount / (dailyGoal * 1.5)) * 100, 100);
            return (
              <div key={day.dateStr} className="flex flex-col items-center space-y-2 group">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {day.questionsCount > 0 ? day.questionsCount : '0'}
                </div>

                <div className="w-full h-24 bg-slate-200/70 dark:bg-slate-700/50 rounded-xl relative overflow-hidden flex items-end p-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, day.questionsCount > 0 ? 15 : 4)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`w-full rounded-lg transition-all ${
                      day.metGoal
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : day.questionsCount > 0
                        ? 'bg-indigo-500 dark:bg-indigo-400'
                        : 'bg-slate-300 dark:bg-slate-600 opacity-30'
                    }`}
                  />
                </div>

                <div className="text-center">
                  <div className={`text-xs font-bold ${day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {day.dayName}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{day.dateStr}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Goal Met ({dailyGoal}+ Qs)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Activity Recorded</span>
            </span>
          </div>
          <span className="font-medium">Target: {dailyGoal} Qs/day</span>
        </div>
      </div>

      {/* 4. Category Mastery Grid & Next Topics to Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Topics & Mastery Breakdown</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Ordered by Review Priority
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryStats.map((item) => {
            const isSelected = selectedCategoryDetails === item.category;

            return (
              <div
                key={item.category}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  item.status === 'critical'
                    ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10'
                    : item.status === 'mastered'
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.category}</h4>
                      {item.status === 'critical' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          Review Priority
                        </span>
                      )}
                      {item.status === 'mastered' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          Mastered
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.recommendation}</p>
                  </div>

                  <span className={`text-lg font-bold ${
                    item.status === 'mastered' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : item.status === 'critical'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {item.masteryPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.status === 'mastered'
                          ? 'bg-emerald-500'
                          : item.status === 'critical'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${item.masteryPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.mastered} of {item.total} mastered</span>
                    <span>Accuracy: {item.accuracy}%</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setSelectedCategoryDetails(isSelected ? null : item.category)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center space-x-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isSelected ? 'Hide Details' : 'View Tips'}</span>
                  </button>

                  {onPracticeCategory && (
                    <button
                      onClick={() => onPracticeCategory(item.category)}
                      className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <span>Practice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Expandable Details */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1.5"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">Pro Tip for {item.category}:</div>
                    {item.category.includes('Numerical') && (
                      <p>Focus on percentage change short-cuts, ratio simplifications, and quick estimates before detailed calculations.</p>
                    )}
                    {item.category.includes('Verbal') && (
                      <p>Rely strictly on stated passage facts. Avoid using external knowledge or assumptions for True/False/Cannot Say questions.</p>
                    )}
                    {item.category.includes('Logical') || item.category.includes('Abstract') && (
                      <p>Look for movement rules first (rotation, reflection, grid shifting) followed by element addition/subtraction cycles.</p>
                    )}
                    {item.category.includes('Situational') && (
                      <p>Align decisions with core organizational competencies: ownership, effective stakeholder communication, and structured problem-solving.</p>
                    )}
                    {(!item.category.includes('Numerical') && !item.category.includes('Verbal') && !item.category.includes('Logical') && !item.category.includes('Situational')) && (
                      <p>Break down questions into core concepts. Master fundamental formulas or rules to improve both speed and accuracy.</p>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

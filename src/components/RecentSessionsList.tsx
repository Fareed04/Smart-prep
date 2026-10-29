import React, { useState, useMemo } from 'react';
import { QuizSession } from '../types';
import { 
  History, Clock, Target, Calendar, ArrowRight, CheckCircle2, 
  AlertCircle, TrendingUp, Cloud, HardDrive, Play, Zap, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, isToday, isSameDay, subDays } from 'date-fns';
import { cn } from '../lib/utils';

interface RecentSessionsListProps {
  sessions: QuizSession[];
  loading?: boolean;
  onViewReport: (session: QuizSession) => void;
  onStartNew: () => void;
  onQuickStart?: () => void;
}

export function RecentSessionsList({
  sessions,
  loading = false,
  onViewReport,
  onStartNew,
  onQuickStart
}: RecentSessionsListProps) {
  const [filter, setFilter] = useState<'all' | 'passed' | 'review'>('all');
  const [showAll, setShowAll] = useState(false);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    if (filter === 'passed') {
      return sessions.filter(s => s.score >= 70);
    }
    if (filter === 'review') {
      return sessions.filter(s => s.score < 70);
    }
    return sessions;
  }, [sessions, filter]);

  // Pagination display count
  const displayedSessions = showAll ? filteredSessions : filteredSessions.slice(0, 6);

  // Summary Metrics
  const stats = useMemo(() => {
    if (sessions.length === 0) return { avgAccuracy: 0, totalTime: 0, passedCount: 0, bestScore: 0 };
    const totalScore = sessions.reduce((acc, s) => acc + (s.score || 0), 0);
    const avgAccuracy = Math.round(totalScore / sessions.length);
    const totalTime = sessions.reduce((acc, s) => acc + (s.timeTaken || 0), 0);
    const passedCount = sessions.filter(s => s.score >= 70).length;
    const bestScore = Math.max(...sessions.map(s => s.score || 0));
    return { avgAccuracy, totalTime, passedCount, bestScore };
  }, [sessions]);

  // Format date helper safely
  const formatSessionDate = (rawDate: any) => {
    try {
      const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(d.getTime())) {
        return { fullDate: 'Recently', timeString: '', relativeBadge: 'Recent' };
      }
      const fullDate = format(d, 'MMM d, yyyy');
      const timeString = format(d, 'h:mm a');
      const relativeBadge = isToday(d) 
        ? 'Today' 
        : isSameDay(d, subDays(new Date(), 1)) 
          ? 'Yesterday' 
          : format(d, 'MMM d');
      return { fullDate, timeString, relativeBadge };
    } catch {
      return { fullDate: 'Recently', timeString: '', relativeBadge: 'Recent' };
    }
  };

  // Format time taken in seconds to a clean readable string
  const formatTotalTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '< 1 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // Format cumulative time helper
  const formatCumulativeTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Recent Sessions
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {sessions.length} {sessions.length === 1 ? 'Stored' : 'Stored Results'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review your quiz results, accuracy scores, and completion times from local storage & cloud
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        {sessions.length > 0 && (
          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                filter === 'all'
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                filter === 'passed'
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              )}
            >
              Passed ({stats.passedCount})
            </button>
            <button
              onClick={() => setFilter('review')}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all",
                filter === 'review'
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
              )}
            >
              Needs Work ({sessions.length - stats.passedCount})
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats Strip (When sessions exist) */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 sm:p-4 bg-slate-50/40 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Accuracy</div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{stats.avgAccuracy}%</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Score</div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{stats.bestScore}%</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Invested</div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatCumulativeTime(stats.totalTime)}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pass Rate</div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {sessions.length > 0 ? Math.round((stats.passedCount / sessions.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main List Body */}
      <div className="p-3 sm:p-5 flex-1">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm space-y-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading recent sessions...</span>
          </div>
        ) : sessions.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-xs">
              <History className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                No Previous Sessions Stored
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Take your first practice quiz or timed simulation. Once finished, your <strong>date</strong>, <strong>accuracy score</strong>, and <strong>total time taken</strong> will automatically appear here.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {onQuickStart && (
                <button
                  onClick={onQuickStart}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Quick 15 Qs</span>
                </button>
              )}
              <button
                onClick={onStartNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start New Simulation</span>
              </button>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          /* Empty Filter Result */
          <div className="py-8 text-center space-y-2 text-slate-500">
            <p className="text-sm">No sessions match the selected filter ({filter}).</p>
            <button
              onClick={() => setFilter('all')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Reset to view all {sessions.length} sessions
            </button>
          </div>
        ) : (
          /* Mapped Sessions List */
          <div className="space-y-3">
            {displayedSessions.map((session, index) => {
              const { fullDate, timeString, relativeBadge } = formatSessionDate(session.createdAt);
              const totalTimeText = formatTotalTime(session.timeTaken);
              const isPassed = session.score >= 70;
              const isPerfect = session.score === 100;
              const isLocal = !session.id || session.id.startsWith('local_');
              const secPerQuestion = session.totalQuestions > 0 ? Math.round(session.timeTaken / session.totalQuestions) : 0;

              return (
                <div
                  key={session.id || `session-${index}-${session.createdAt}`}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all shadow-2xs hover:shadow-xs group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Date & Meta Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Date Badge */}
                      <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{fullDate}</span>
                        {timeString && (
                          <span className="text-slate-400 font-normal">at {timeString}</span>
                        )}
                      </div>

                      {/* Relative time indicator */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {relativeBadge}
                      </span>

                      {/* Company badge */}
                      {session.company && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                          {session.company}
                        </span>
                      )}

                      {/* Storage Source Badge */}
                      <span 
                        className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/60"
                        title={isLocal ? "Preserved locally in browser storage" : "Synchronized with Firestore database"}
                      >
                        {isLocal ? (
                          <>
                            <HardDrive className="w-2.5 h-2.5" />
                            <span>Local Storage</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-2.5 h-2.5 text-emerald-500" />
                            <span>Cloud Synced</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Categories Attempted */}
                    {session.categoriesAttempted && session.categoriesAttempted.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] text-slate-400">Streams:</span>
                        {session.categoriesAttempted.map((cat, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-md text-[11px] font-medium text-slate-700 dark:text-slate-300"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Middle / Right Column: Accuracy Score & Total Time Taken */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Total Time Taken Display */}
                    <div className="text-left sm:text-right min-w-[100px]">
                      <div className="flex items-center sm:justify-end space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="uppercase tracking-wider text-[10px]">Total Time</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {totalTimeText}
                      </div>
                      {secPerQuestion > 0 && (
                        <div className="text-[10px] text-slate-400">
                          ~{secPerQuestion}s/question
                        </div>
                      )}
                    </div>

                    {/* Accuracy Score Display */}
                    <div className="text-left sm:text-right min-w-[120px]">
                      <div className="flex items-center sm:justify-end space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        <span className="uppercase tracking-wider text-[10px]">Accuracy Score</span>
                      </div>
                      <div className="flex items-baseline sm:justify-end space-x-1.5 mt-0.5">
                        <span className={cn(
                          "text-lg sm:text-xl font-black tracking-tight",
                          isPerfect 
                            ? "text-purple-600 dark:text-purple-400"
                            : isPassed 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-amber-600 dark:text-amber-400"
                        )}>
                          {session.score}%
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          ({session.correctAnswers}/{session.totalQuestions})
                        </span>
                      </div>
                      <div className="w-full sm:w-28 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 sm:ml-auto">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isPassed ? "bg-emerald-500" : "bg-amber-500"
                          )} 
                          style={{ width: `${Math.min(100, Math.max(5, session.score))}%` }}
                        />
                      </div>
                    </div>

                    {/* Review Report Button */}
                    <button
                      onClick={() => onViewReport(session)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 group-hover:bg-blue-600 dark:bg-slate-800 dark:group-hover:bg-blue-600 text-slate-700 group-hover:text-white dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="View complete question breakdown, answer review, and explanations"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Toggle Show All / Show Less button */}
        {filteredSessions.length > 6 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <span>{showAll ? 'Show Fewer Sessions' : `View All ${filteredSessions.length} Sessions`}</span>
              {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

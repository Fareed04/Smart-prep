import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calculator as CalcIcon, 
  X, 
  Delete, 
  Trash2, 
  GripHorizontal, 
  Copy, 
  Check, 
  Minus, 
  Maximize2, 
  FileText,
  History,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, useDragControls } from 'motion/react';

export interface CalculatorProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  onInsertToNotes?: (value: string) => void;
  hideFloatingTrigger?: boolean;
}

type AngleMode = 'DEG' | 'RAD';
type CalcMode = 'standard' | 'scientific';
type CalcTab = 'keypad' | 'history';

export interface HistoryItem {
  id: string;
  equation: string;
  result: string;
  timestamp: number;
}

const MAX_HISTORY = 5;

// Factorial helper
function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity; // JS Number overflow threshold
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// Clean floating point artifacts (e.g. 0.1 + 0.2 -> 0.3)
function formatCleanNumber(num: number): string {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';
  
  // Format with high precision and strip trailing zeros
  const prec = Number(num.toPrecision(12));
  return String(prec);
}

// Format relative time for history display
function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

// Safe evaluation of mathematical expressions
function evaluateMathExpression(expr: string, angleMode: AngleMode): { success: boolean; result: string } {
  try {
    let s = expr.trim();
    if (!s) return { success: false, result: '0' };

    // Replace display operators with evaluation equivalents
    s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

    // Auto-balance parentheses
    let openCount = 0;
    for (const char of s) {
      if (char === '(') openCount++;
      if (char === ')') openCount--;
    }
    while (openCount > 0) {
      s += ')';
      openCount--;
    }

    // Replace constants
    s = s.replace(/\bπ\b/g, `(${Math.PI})`);
    s = s.replace(/\be\b/g, `(${Math.E})`);

    // Handle factorial syntax: num!
    s = s.replace(/(\d+(\.\d+)?)!/g, (_, n) => `factorial(${n})`);

    // Trig transformations respecting angle mode
    const toRad = angleMode === 'DEG' ? `* (${Math.PI} / 180)` : '';
    const fromRad = angleMode === 'DEG' ? `* (180 / ${Math.PI})` : '';

    s = s.replace(/\bsin\(([^)]+)\)/g, `Math.sin(($1) ${toRad})`);
    s = s.replace(/\bcos\(([^)]+)\)/g, `Math.cos(($1) ${toRad})`);
    s = s.replace(/\btan\(([^)]+)\)/g, `Math.tan(($1) ${toRad})`);
    s = s.replace(/\basin\(([^)]+)\)/g, `(Math.asin($1) ${fromRad})`);
    s = s.replace(/\bacos\(([^)]+)\)/g, `(Math.acos($1) ${fromRad})`);
    s = s.replace(/\batan\(([^)]+)\)/g, `(Math.atan($1) ${fromRad})`);

    // Math functions
    s = s.replace(/\bln\(/g, 'Math.log(');
    s = s.replace(/\blog\(/g, 'Math.log10(');
    s = s.replace(/\bsqrt\(/g, 'Math.sqrt(');
    s = s.replace(/\bcbrt\(/g, 'Math.cbrt(');
    s = s.replace(/\babs\(/g, 'Math.abs(');

    // Exponents: x^y -> Math.pow(x, y)
    while (s.includes('^')) {
      s = s.replace(/([a-zA-Z0-9_.]+|\([^\(\)]+\))\^([a-zA-Z0-9_.]+|\([^\(\)]+\))/, 'Math.pow($1, $2)');
    }

    // Implicit multiplication: e.g. 2(3) -> 2*(3) or (2)(3) -> (2)*(3)
    s = s.replace(/(\d+)\s*\(/g, '$1*(');
    s = s.replace(/\)\s*(\d+)/g, ')*$1');
    s = s.replace(/\)\s*\(/g, ')*(');

    // Check for division by zero before evaluation
    if (/\/0(?![.0-9])/.test(s)) {
      return { success: false, result: 'Cannot divide by 0' };
    }

    // Sandbox execution with restricted scope
    const evalFn = new Function('Math', 'factorial', `return (${s});`);
    const rawResult = evalFn(Math, factorial);

    if (typeof rawResult !== 'number' || isNaN(rawResult)) {
      return { success: false, result: 'Error' };
    }

    return { success: true, result: formatCleanNumber(rawResult) };
  } catch {
    return { success: false, result: 'Error' };
  }
}

export function Calculator({ 
  isOpen: controlledIsOpen, 
  onToggle, 
  onClose,
  onInsertToNotes,
  hideFloatingTrigger = false
}: CalculatorProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Mode and settings
  const [calcMode, setCalcMode] = useState<CalcMode>(() => {
    return (localStorage.getItem('smartprep_calc_mode') as CalcMode) || 'standard';
  });
  const [activeTab, setActiveTab] = useState<CalcTab>('keypad');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [isMinimized, setIsMinimized] = useState(false);

  // Math state
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  
  // History of the last 5 calculations performed
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartprep_calc_history');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_HISTORY).map((item) => ({
          id: item.id || Math.random().toString(36).substring(2, 9),
          equation: item.equation || '',
          result: String(item.result ?? ''),
          timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now()
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [memory, setMemory] = useState<number | null>(null);
  const [justCalculated, setJustCalculated] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [insertedToast, setInsertedToast] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [insertedHistoryId, setInsertedHistoryId] = useState<string | null>(null);

  const displayRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Save history and mode
  useEffect(() => {
    localStorage.setItem('smartprep_calc_mode', calcMode);
  }, [calcMode]);

  useEffect(() => {
    try {
      localStorage.setItem('smartprep_calc_history', JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // ignore quota
    }
  }, [history]);

  const handleOpen = () => {
    if (onToggle) onToggle();
    else setInternalIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (onToggle) onToggle();
    else setInternalIsOpen(false);
  };

  // Helper to store calculation to history (limited to last 5)
  const addToHistory = (eq: string, res: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      equation: eq,
      result: res,
      timestamp: Date.now()
    };
    // Keep strictly the last 5 calculations performed (newest first)
    setHistory(prev => [newItem, ...prev].slice(0, MAX_HISTORY));
  };

  // Input numbers and dots
  const handleNum = (val: string) => {
    if (display === 'Error' || display === 'Cannot divide by 0' || justCalculated) {
      setDisplay(val === '.' ? '0.' : val);
      setJustCalculated(false);
      return;
    }
    if (val === '.') {
      if (!display.includes('.')) {
        setDisplay(display + '.');
      }
      return;
    }
    if (display === '0') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  // Binary operators (+, −, ×, ÷, ^)
  const handleOperator = (op: string) => {
    setJustCalculated(false);
    if (display === 'Error' || display === 'Cannot divide by 0') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (equation && display === '0' && /[\+\−\×\÷\^]\s*$/.test(equation)) {
      setEquation(equation.replace(/[\+\−\×\÷\^]\s*$/, `${op} `));
      return;
    }

    setEquation(prev => `${prev}${display} ${op} `);
    setDisplay('0');
  };

  // Immediate unary functions
  const handleUnary = (fn: string) => {
    if (display === 'Error' || display === 'Cannot divide by 0') return;
    const current = Number(display);
    if (isNaN(current)) return;

    let res = 0;
    switch (fn) {
      case '±':
        res = current * -1;
        break;
      case '%':
        res = current / 100;
        break;
      case '1/x':
        if (current === 0) {
          setDisplay('Cannot divide by 0');
          return;
        }
        res = 1 / current;
        break;
      case 'x²':
        res = Math.pow(current, 2);
        break;
      case 'x³':
        res = Math.pow(current, 3);
        break;
      case '√':
        if (current < 0) {
          setDisplay('Error');
          return;
        }
        res = Math.sqrt(current);
        break;
      case '∛':
        res = Math.cbrt(current);
        break;
      case 'n!':
        if (current < 0 || !Number.isInteger(current)) {
          setDisplay('Error');
          return;
        }
        res = factorial(current);
        break;
      case '|x|':
        res = Math.abs(current);
        break;
      case '10ˣ':
        res = Math.pow(10, current);
        break;
      case 'eˣ':
        res = Math.exp(current);
        break;
      case 'ln':
        if (current <= 0) {
          setDisplay('Error');
          return;
        }
        res = Math.log(current);
        break;
      case 'log':
        if (current <= 0) {
          setDisplay('Error');
          return;
        }
        res = Math.log10(current);
        break;
      case 'sin': {
        const rad = angleMode === 'DEG' ? current * (Math.PI / 180) : current;
        res = Math.sin(rad);
        break;
      }
      case 'cos': {
        const rad = angleMode === 'DEG' ? current * (Math.PI / 180) : current;
        res = Math.cos(rad);
        break;
      }
      case 'tan': {
        const rad = angleMode === 'DEG' ? current * (Math.PI / 180) : current;
        res = Math.tan(rad);
        break;
      }
      default:
        return;
    }

    const formatted = formatCleanNumber(res);
    if (fn !== '±') {
      addToHistory(`${fn}(${display}) =`, formatted);
    }
    setDisplay(formatted);
    setJustCalculated(true);
  };

  // Add parentheses or constants
  const handleInsertSymbol = (sym: string) => {
    if (sym === 'π') {
      setDisplay(String(Math.PI));
      setJustCalculated(true);
    } else if (sym === 'e') {
      setDisplay(String(Math.E));
      setJustCalculated(true);
    } else if (sym === '(') {
      if (display === '0') {
        setEquation(prev => prev + '(');
      } else {
        setEquation(prev => prev + `${display} × (`);
        setDisplay('0');
      }
    } else if (sym === ')') {
      setEquation(prev => prev + `${display}) `);
      setDisplay('0');
    }
  };

  // Evaluate expression
  const calculate = () => {
    if (display === 'Error' || display === 'Cannot divide by 0') return;
    const fullExpr = `${equation}${display}`;
    if (!fullExpr.trim()) return;

    const { success, result } = evaluateMathExpression(fullExpr, angleMode);
    
    if (success) {
      addToHistory(`${fullExpr} =`, result);
      setDisplay(result);
      setEquation('');
      setJustCalculated(true);
    } else {
      setDisplay(result);
      setJustCalculated(true);
    }
  };

  // Recall a history calculation result into active display
  const recallHistoryResult = (item: HistoryItem) => {
    setDisplay(item.result);
    setJustCalculated(true);
    setActiveTab('keypad');
  };

  // Copy history calculation result
  const copyHistoryResult = (item: HistoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(item.result);
    setCopiedHistoryId(item.id);
    setTimeout(() => setCopiedHistoryId(null), 1500);
  };

  // Insert history calculation to scratchpad notes
  const insertHistoryToNotes = (item: HistoryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onInsertToNotes) {
      onInsertToNotes(`Calc: ${item.equation} ${item.result}`);
      setInsertedHistoryId(item.id);
      setTimeout(() => setInsertedHistoryId(null), 1500);
    }
  };

  // Memory operations
  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => {
    const currentNum = Number(display);
    if (isNaN(currentNum)) return;

    switch (op) {
      case 'MC':
        setMemory(null);
        break;
      case 'MR':
        if (memory !== null) {
          setDisplay(formatCleanNumber(memory));
          setJustCalculated(true);
        }
        break;
      case 'MS':
        setMemory(currentNum);
        break;
      case 'M+':
        setMemory((prev) => (prev ?? 0) + currentNum);
        break;
      case 'M-':
        setMemory((prev) => (prev ?? 0) - currentNum);
        break;
    }
  };

  // Clear operations
  const clearAll = () => {
    setDisplay('0');
    setEquation('');
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    if (display === 'Error' || display === 'Cannot divide by 0' || justCalculated) {
      clearAll();
      return;
    }
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  // Copy result
  const copyResult = () => {
    if (display && display !== 'Error') {
      navigator.clipboard.writeText(display);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 1500);
    }
  };

  // Insert to rough work notes
  const insertToNotes = () => {
    if (onInsertToNotes && display && display !== 'Error') {
      onInsertToNotes(`Calc: ${equation ? equation + ' ' : ''}${display}`);
      setInsertedToast(true);
      setTimeout(() => setInsertedToast(false), 1500);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isMinimized) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleNum(key);
      } else if (key === '.') {
        e.preventDefault();
        handleNum('.');
      } else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-') {
        e.preventDefault();
        handleOperator('−');
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === '^') {
        e.preventDefault();
        handleOperator('^');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        handleInsertSymbol(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        clearAll();
      } else if (key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveTab(prev => prev === 'keypad' ? 'history' : 'keypad');
      } else if (key.toLowerCase() === 'p') {
        e.preventDefault();
        handleInsertSymbol('π');
      } else if (key === '!') {
        e.preventDefault();
        handleUnary('n!');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, display, equation, angleMode, justCalculated]);

  // Unclosed parenthesis counter
  const unclosedParens = useMemo(() => {
    let count = 0;
    for (const char of equation) {
      if (char === '(') count++;
      if (char === ')') count--;
    }
    return Math.max(0, count);
  }, [equation]);

  // If closed and not hidden, show floating toggle button
  if (!isOpen) {
    if (hideFloatingTrigger) return null;
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 p-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 z-40 border border-slate-700/50 flex items-center justify-center group"
        title="Open Calculator (Press C)"
      >
        <CalcIcon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
      </button>
    );
  }

  // Minimized floating pill
  if (isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white dark:bg-slate-800/95 border border-slate-700 rounded-full shadow-2xl px-4 py-2.5 flex items-center space-x-3 backdrop-blur-md cursor-move select-none"
      >
        <div className="flex items-center space-x-2" onClick={() => setIsMinimized(false)}>
          <CalcIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Calc:</span>
          <span className="font-mono text-sm font-bold text-white max-w-[120px] truncate">{display}</span>
        </div>
        <div className="flex items-center space-x-1 pl-2 border-l border-slate-700">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:text-indigo-400 text-slate-400 rounded transition-colors"
            title="Expand Calculator"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:text-red-400 text-slate-400 rounded transition-colors"
            title="Close Calculator"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed bottom-6 right-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 flex flex-col transition-all duration-300",
        calcMode === 'scientific' ? "w-[390px] sm:w-[460px]" : "w-[320px] sm:w-[350px]"
      )}
    >
      {/* Title Bar & Drag Header */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800/80 cursor-move select-none"
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <div className="flex items-center space-x-1.5 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            <CalcIcon className="w-4 h-4 text-indigo-500" />
            <span>Aptitude Calc</span>
          </div>
          {memory !== null && (
            <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-mono px-1.5 py-0.5 rounded border border-indigo-500/20" title={`Stored Memory: ${memory}`}>
              M
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5" onPointerDown={(e) => e.stopPropagation()}>
          {/* History Tab Toggle Button */}
          <button
            onClick={() => setActiveTab(prev => prev === 'keypad' ? 'history' : 'keypad')}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded-lg transition-colors border flex items-center gap-1",
              activeTab === 'history'
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-300 dark:hover:bg-slate-600"
            )}
            title="Toggle Calculation History (H)"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {history.length > 0 && (
              <span className={cn(
                "px-1 py-0.2 rounded-full text-[9px] font-bold",
                activeTab === 'history' ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
              )}>
                {history.length}
              </span>
            )}
          </button>

          {/* Mode Switcher */}
          <button
            onClick={() => setCalcMode(prev => prev === 'standard' ? 'scientific' : 'standard')}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded-lg transition-colors border",
              calcMode === 'scientific' 
                ? "bg-slate-800 text-white dark:bg-slate-700 border-slate-600" 
                : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-300 dark:hover:bg-slate-600"
            )}
            title="Toggle Scientific functions"
          >
            {calcMode === 'scientific' ? 'Sci' : 'Std'}
          </button>

          {/* Angle mode toggle when in scientific */}
          {calcMode === 'scientific' && (
            <button
              onClick={() => setAngleMode(prev => prev === 'DEG' ? 'RAD' : 'DEG')}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              title="Toggle Degree / Radian"
            >
              {angleMode}
            </button>
          )}

          {/* Minimize */}
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
            title="Minimize to dock"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button 
            onClick={handleClose} 
            className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="p-3.5 space-y-2.5">
        {/* Crisp Display Area */}
        <div 
          ref={displayRef} 
          className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl text-right flex flex-col justify-between h-28 border border-slate-200/70 dark:border-slate-800/70"
        >
          {/* Top Status & Last Answer Reference */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 overflow-hidden">
              {unclosedParens > 0 && (
                <span className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
                  ({unclosedParens} open)
                </span>
              )}
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setDisplay(history[0].result);
                    setJustCalculated(true);
                  }}
                  className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 truncate max-w-[140px] bg-slate-200/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded"
                  title={`Previous result (Ans: ${history[0].result}). Click to recall.`}
                >
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Ans:</span>
                  <span className="truncate">{history[0].result}</span>
                </button>
              )}
            </div>

            <div className="truncate max-w-[170px] font-medium text-slate-600 dark:text-slate-300">
              {equation}
            </div>
          </div>

          {/* Bottom Live Number & Utility Actions */}
          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-center space-x-1">
              <button
                onClick={copyResult}
                className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors rounded"
                title="Copy result"
              >
                {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {onInsertToNotes && (
                <button
                  onClick={insertToNotes}
                  className="p-1 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors rounded"
                  title="Insert to Notes"
                >
                  {insertedToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileText className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div className={cn(
              "font-mono font-bold text-slate-900 dark:text-white truncate tracking-tight text-right",
              display.length > 12 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            )}>
              {display}
            </div>
          </div>
        </div>

        {/* Quick Reference Strip for Last 5 Calculations (Visible on Keypad Tab) */}
        {activeTab === 'keypad' && history.length > 0 && (
          <div className="flex items-center justify-between px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800/70 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1">
                <History className="w-3 h-3 text-indigo-500" />
                <span>Last 5:</span>
              </span>
              {history.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => recallHistoryResult(item)}
                  className="shrink-0 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-[11px] font-mono font-medium transition-all flex items-center gap-1 group shadow-xs cursor-pointer"
                  title={`#${idx + 1}: ${item.equation} ${item.result} (Click to recall into display)`}
                >
                  <span className="text-[9px] text-slate-400 font-sans group-hover:text-indigo-500 font-semibold">#{idx + 1}</span>
                  <span className="font-semibold">{item.result}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('history')}
              className="shrink-0 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-1.5 px-1 py-0.5"
              title="View full history details"
            >
              Details
            </button>
          </div>
        )}

        {/* Tab 1: Keypad View */}
        {activeTab === 'keypad' && (
          <>
            {/* Memory Bar */}
            <div className="grid grid-cols-5 gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <button 
                onClick={() => handleMemory('MC')}
                disabled={memory === null}
                className="py-1 px-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                MC
              </button>
              <button 
                onClick={() => handleMemory('MR')}
                disabled={memory === null}
                className="py-1 px-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                MR
              </button>
              <button 
                onClick={() => handleMemory('M+')}
                className="py-1 px-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                M+
              </button>
              <button 
                onClick={() => handleMemory('M-')}
                className="py-1 px-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                M-
              </button>
              <button 
                onClick={() => handleMemory('MS')}
                className="py-1 px-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                MS
              </button>
            </div>

            {/* Scientific Functions Grid */}
            {calcMode === 'scientific' && (
              <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                {[
                  { label: 'sin', action: () => handleUnary('sin') },
                  { label: 'cos', action: () => handleUnary('cos') },
                  { label: 'tan', action: () => handleUnary('tan') },
                  { label: 'π', action: () => handleInsertSymbol('π') },
                  { label: 'ln', action: () => handleUnary('ln') },
                  { label: 'log', action: () => handleUnary('log') },
                  { label: 'xʸ', action: () => handleOperator('^') },
                  { label: 'e', action: () => handleInsertSymbol('e') },
                  { label: 'x²', action: () => handleUnary('x²') },
                  { label: 'x³', action: () => handleUnary('x³') },
                  { label: '√x', action: () => handleUnary('√') },
                  { label: '∛x', action: () => handleUnary('∛') },
                  { label: '10ˣ', action: () => handleUnary('10ˣ') },
                  { label: 'eˣ', action: () => handleUnary('eˣ') },
                  { label: 'n!', action: () => handleUnary('n!') },
                  { label: '|x|', action: () => handleUnary('|x|') },
                ].map(btn => (
                  <button
                    key={btn.label}
                    onClick={btn.action}
                    className="py-1.5 px-2 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors border border-indigo-100 dark:border-indigo-900/50"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Standard Keypad Grid */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
              {/* Row 1: Clear, Parentheses, Backspace */}
              <button 
                onClick={clearAll} 
                className="p-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm transition-colors"
                title="Clear All (C)"
              >
                C
              </button>
              <button 
                onClick={() => handleInsertSymbol('(')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-sm transition-colors"
              >
                (
              </button>
              <button 
                onClick={() => handleInsertSymbol(')')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-sm transition-colors"
              >
                )
              </button>
              <button 
                onClick={handleBackspace} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>

              {/* Row 2: Standard Unary Quickies & Divide */}
              <button 
                onClick={() => handleUnary('√')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-sm transition-colors"
              >
                √
              </button>
              <button 
                onClick={() => handleUnary('%')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-sm transition-colors"
              >
                %
              </button>
              <button 
                onClick={() => handleUnary('1/x')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                1/x
              </button>
              <button 
                onClick={() => handleOperator('÷')} 
                className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-base transition-colors"
              >
                ÷
              </button>

              {/* Row 3: 7 8 9 × */}
              <button 
                onClick={() => handleNum('7')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                7
              </button>
              <button 
                onClick={() => handleNum('8')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                8
              </button>
              <button 
                onClick={() => handleNum('9')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                9
              </button>
              <button 
                onClick={() => handleOperator('×')} 
                className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-base transition-colors"
              >
                ×
              </button>

              {/* Row 4: 4 5 6 − */}
              <button 
                onClick={() => handleNum('4')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                4
              </button>
              <button 
                onClick={() => handleNum('5')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                5
              </button>
              <button 
                onClick={() => handleNum('6')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                6
              </button>
              <button 
                onClick={() => handleOperator('−')} 
                className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-base transition-colors"
              >
                −
              </button>

              {/* Row 5: 1 2 3 + */}
              <button 
                onClick={() => handleNum('1')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                1
              </button>
              <button 
                onClick={() => handleNum('2')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                2
              </button>
              <button 
                onClick={() => handleNum('3')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                3
              </button>
              <button 
                onClick={() => handleOperator('+')} 
                className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-base transition-colors"
              >
                +
              </button>

              {/* Row 6: ± 0 . = */}
              <button 
                onClick={() => handleUnary('±')} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 text-sm transition-colors"
                title="Toggle Sign (±)"
              >
                ±
              </button>
              <button 
                onClick={() => handleNum('0')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                0
              </button>
              <button 
                onClick={() => handleNum('.')} 
                className="p-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold text-base text-slate-900 dark:text-white transition-colors"
              >
                .
              </button>
              <button 
                onClick={calculate} 
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-lg shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center cursor-pointer"
                title="Calculate (Enter or =)"
              >
                =
              </button>
            </div>
          </>
        )}

        {/* Tab 2: Detailed History View of the Last 5 Calculations */}
        {activeTab === 'history' && (
          <div className="space-y-2.5 pt-1">
            {/* History Header & Clear Action */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Calculation History</span>
                  <span className="text-[10px] font-normal text-slate-400">({history.length}/{MAX_HISTORY} stored)</span>
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  Quickly reference and reuse previous assessment results
                </p>
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-[11px] text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* List of Last 5 Calculations */}
            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 opacity-60" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No calculations recorded yet</p>
                <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  Perform calculations during your assessment to track and reference your last 5 results here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[310px] overflow-y-auto pr-0.5">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          #{index + 1}
                        </span>
                        {index === 0 && (
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-500 font-sans font-semibold px-1 py-0.2 rounded border border-indigo-500/20">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mb-1">
                      {item.equation}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-white truncate max-w-[160px]">
                        {item.result}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => recallHistoryResult(item)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 transition-colors shadow-xs"
                          title="Recall this result into active calculation"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Recall</span>
                        </button>
                        <button
                          onClick={(e) => copyHistoryResult(item, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Copy result"
                        >
                          {copiedHistoryId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {onInsertToNotes && (
                          <button
                            onClick={(e) => insertHistoryToNotes(item, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Insert equation and result into scratchpad notes"
                          >
                            {insertedHistoryId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileText className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back to Keypad Button */}
            <button
              onClick={() => setActiveTab('keypad')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <CalcIcon className="w-3.5 h-3.5" />
              <span>Back to Keypad</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

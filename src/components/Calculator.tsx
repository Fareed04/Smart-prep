import React, { useState } from 'react';
import { Calculator as CalcIcon, X, Minus, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Calculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<{eq: string, res: string}[]>([]);
  const displayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [history, display, equation]);

  const handleNum = (num: string) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const handleOp = (op: string) => {
    setEquation(equation + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      // Safe eval equivalent for simple math
      const fullEq = equation + display;
      const result = new Function('return ' + fullEq)();
      const stringResult = String(result);
      setHistory(prev => [...prev, { eq: fullEq + ' =', res: stringResult }].slice(-10));
      setDisplay(stringResult);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-transform hover:scale-105 active:scale-95"
      >
        <CalcIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-8">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
          <CalcIcon className="w-4 h-4" />
          <span>Calculator</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div ref={displayRef} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-right space-y-1 flex flex-col h-32 overflow-y-auto">
          {history.map((item, idx) => (
            <div key={idx} className="flex flex-col text-sm text-slate-500 dark:text-slate-400">
              <span className="text-xs">{item.eq}</span>
              <span className="font-semibold">{item.res}</span>
            </div>
          ))}
          <div className="mt-auto">
            <div className="text-xs text-slate-500 dark:text-slate-400 min-h-[1rem]">{equation}</div>
            <div className="text-2xl font-mono font-semibold text-slate-900 dark:text-white truncate">{display}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {['C', '(', ')', '/'].map((btn) => (
            <button key={btn} onClick={btn === 'C' ? clear : () => handleOp(btn)} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 transition-colors">
              {btn}
            </button>
          ))}
          {['7', '8', '9', '*'].map((btn) => (
            <button key={btn} onClick={() => ['*'].includes(btn) ? handleOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors", ['*'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
          {['4', '5', '6', '-'].map((btn) => (
            <button key={btn} onClick={() => ['-'].includes(btn) ? handleOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors", ['-'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
          {['1', '2', '3', '+'].map((btn) => (
            <button key={btn} onClick={() => ['+'].includes(btn) ? handleOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors", ['+'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
          {['0', '.', '=', ''].map((btn, i) => (
            btn ? (
              <button key={btn} onClick={() => btn === '=' ? calculate() : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors", btn === '=' ? "bg-blue-600 hover:bg-blue-700 text-white col-span-2" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
                {btn}
              </button>
            ) : <div key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

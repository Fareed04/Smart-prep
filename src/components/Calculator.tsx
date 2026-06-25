import React, { useState } from 'react';
import { Calculator as CalcIcon, X, Delete, Trash2, GripHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, useDragControls } from 'motion/react';

export function Calculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<{eq: string, res: string}[]>([]);
  const displayRef = React.useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  React.useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [history, display, equation]);

  const handleNum = (num: string) => {
    if (display === 'Error') {
      setDisplay(num === '.' ? '0.' : num);
      return;
    }
    setDisplay(display === '0' && num !== '.' ? num : display + num);
  };

  const handleOp = (op: string) => {
    if (display === 'Error') {
      setDisplay('0');
      setEquation('0 ' + op + ' ');
      return;
    }
    setEquation(equation + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEq = equation + display;
      let cleanedEq = fullEq.trim();
      if (/[\+\-\*\/]$/.test(cleanedEq)) {
        cleanedEq = cleanedEq.slice(0, -1);
      }
      if (!cleanedEq) return;
      const result = new Function('return ' + cleanedEq)();
      const stringResult = String(Number(result.toFixed(6))); // Avoid floating point artifacts
      setHistory(prev => [...prev, { eq: cleanedEq + ' =', res: stringResult }].slice(-20));
      setDisplay(stringResult);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleUnaryOp = (op: string) => {
    if (display === 'Error') return;
    const currentNum = Number(display);
    let newNum = 0;
    
    switch(op) {
      case '√':
        if (currentNum < 0) {
          setDisplay('Error');
          return;
        }
        newNum = Math.sqrt(currentNum);
        break;
      case 'x²':
        newNum = Math.pow(currentNum, 2);
        break;
      case '%':
        newNum = currentNum / 100;
        break;
      case '1/x':
        if (currentNum === 0) {
          setDisplay('Error');
          return;
        }
        newNum = 1 / currentNum;
        break;
      case '±':
        newNum = currentNum * -1;
        break;
    }
    
    const resultStr = String(Number(newNum.toFixed(8)));
    setDisplay(resultStr);
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDel = () => {
    if (display === 'Error') {
      clear();
      return;
    }
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const key = e.key;
      if (/[0-9.]/.test(key)) {
        e.preventDefault();
        handleNum(key);
      } else if (['+', '-', '*', '/', '(', ')'].includes(key)) {
        e.preventDefault();
        handleOp(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleDel();
      } else if (key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        clear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, equation, history]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-transform hover:scale-105 active:scale-95 z-50"
      >
        <CalcIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 flex flex-col"
    >
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 cursor-move"
      >
        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-medium">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <CalcIcon className="w-4 h-4" />
          <span className="select-none">Calculator</span>
        </div>
        <div className="flex items-center space-x-1">
          {history.length > 0 && (
            <button onClick={() => setHistory([])} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer" title="Clear History" onPointerDown={(e) => e.stopPropagation()}>
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer" onPointerDown={(e) => e.stopPropagation()}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div ref={displayRef} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-right space-y-2 flex flex-col h-40 overflow-y-auto overflow-x-hidden">
          {history.map((item, idx) => (
            <div key={idx} className="flex flex-col text-sm text-slate-500 dark:text-slate-400">
              <span className="text-xs opacity-75">{item.eq}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.res}</span>
            </div>
          ))}
          <div className="mt-auto border-t border-slate-200 dark:border-slate-700/50 pt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 min-h-[1rem] break-all">{equation}</div>
            <div className="text-3xl font-mono font-semibold text-slate-900 dark:text-white truncate mt-1">{display}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {['C', '(', ')', '⌫'].map((btn) => (
            <button key={btn} onClick={btn === 'C' ? clear : btn === '⌫' ? handleDel : () => handleOp(btn)} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center">
              {btn === '⌫' ? <Delete className="w-5 h-5" /> : btn}
            </button>
          ))}
          {['√', 'x²', '%', '/'].map((btn) => (
            <button key={btn} onClick={() => ['/'].includes(btn) ? handleOp(btn) : handleUnaryOp(btn)} className={cn("p-3 rounded-lg font-medium transition-colors text-lg", ['/'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300")}>
              {btn}
            </button>
          ))}
          {['7', '8', '9', '*'].map((btn) => (
            <button key={btn} onClick={() => ['*'].includes(btn) ? handleOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors text-lg", ['*'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
          {['4', '5', '6', '-'].map((btn) => (
            <button key={btn} onClick={() => ['-'].includes(btn) ? handleOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors text-lg", ['-'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
          {['1', '2', '3', '+'].map((btn) => (
            <button key={btn} onClick={() => ['+'].includes(btn) ? handleOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors text-lg", ['+'].includes(btn) ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
          {['±', '0', '.', '='].map((btn) => (
            <button key={btn} onClick={() => btn === '=' ? calculate() : btn === '±' ? handleUnaryOp(btn) : handleNum(btn)} className={cn("p-3 rounded-lg font-medium transition-colors text-lg flex items-center justify-center", btn === '=' ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white")}>
              {btn}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadScreenProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onStartProcessing: (company: string) => void;
  onGenerateMock: (company: string) => void;
  customCompanies?: string[];
  onAddCompany: (company: string) => void;
  errorMessage?: string | null;
  isProcessing?: boolean;
  processingStatus?: string;
  progress?: number;
}

const DEFAULT_COMPANIES = ['KPMG', 'EY', 'PwC', 'Deloitte'];

export function UploadScreen({ 
  files, 
  setFiles, 
  onStartProcessing, 
  onGenerateMock, 
  customCompanies = [], 
  onAddCompany,
  errorMessage, 
  isProcessing = false, 
  processingStatus = "", 
  progress = 0 
}: UploadScreenProps) {
  const [selectedCompany, setSelectedCompany] = useState('KPMG');
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);

  const allCompanies = [...DEFAULT_COMPANIES, ...customCompanies, 'Other'];

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      onAddCompany(newCompanyName.trim());
      setSelectedCompany(newCompanyName.trim());
      setNewCompanyName('');
      setIsAddingCompany(false);
    }
  };

  // Track which file is currently processing based on the status string
  useEffect(() => {
    if (!isProcessing) {
      setCurrentFileIndex(-1);
    } else if (processingStatus) {
      const idx = files.findIndex(f => processingStatus.toLowerCase().includes(f.name.toLowerCase()));
      if (idx !== -1) {
        setCurrentFileIndex(idx);
      }
    }
  }, [processingStatus, isProcessing, files]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isProcessing) return;
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 40)); // Max 40 files
  }, [setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDrop as any,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 40,
  } as any);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Big 4 Smart-Prep</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Upload past questions to generate your AI-powered simulation.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Which company are these files for?
        </label>
        <div className="flex flex-wrap gap-3">
          {allCompanies.map((company) => (
            <button
              key={company}
              onClick={() => {
                if (company === 'Other') {
                  setIsAddingCompany(true);
                } else {
                  setSelectedCompany(company);
                  setIsAddingCompany(false);
                }
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                selectedCompany === company && !isAddingCompany
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500",
                isProcessing && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {company}
            </button>
          ))}
        </div>

        {isAddingCompany && (
          <div className="flex items-center space-x-2 animate-in slide-in-from-top-2">
            <input
              type="text"
              autoFocus
              placeholder="Enter company name (e.g. ARM)"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 rounded-xl text-sm focus:outline-none dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCompany();
                if (e.key === 'Escape') setIsAddingCompany(false);
              }}
            />
            <button
              onClick={handleAddCompany}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingCompany(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center transition-colors duration-200",
          isDragActive ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700",
          isProcessing ? "opacity-50 cursor-not-allowed blur-[1px]" : "cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900 dark:text-white">
              {isDragActive ? "Drop files here..." : "Drag & drop files here"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports PDF, PNG, JPG, DOCX (Max 40 files)
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 max-w-xs mx-auto">
              Note: Very large PDFs (100+ pages) may cause timeouts. If processing fails, try splitting your files.
            </p>
          </div>
        </div>
      </div>

      {files.length === 0 && !isProcessing && (
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Don't have any past questions?</p>
          <button
            onClick={() => onGenerateMock(selectedCompany)}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center space-x-2 mx-auto"
          >
            <Loader2 className={cn("w-4 h-4", isProcessing ? "animate-spin" : "hidden")} />
            <span>Generate Mock {selectedCompany} Assessment</span>
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Selected Files ({files.length}/40)</h3>
            <button
              onClick={() => onStartProcessing(selectedCompany)}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isProcessing ? `Processing (${progress}%)` : 'Process & Start Simulation'}</span>
            </button>
          </div>
          
          {isProcessing && (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse text-right">
              {processingStatus}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {files.map((file, i) => {
              const fileIsProcessing = isProcessing && i === currentFileIndex;
              const fileIsDone = isProcessing && currentFileIndex !== -1 && i < currentFileIndex;
              const fileIsPending = isProcessing && currentFileIndex !== -1 && i > currentFileIndex;

              return (
                <div key={i} className={cn(
                  "flex items-center justify-between p-3 bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-all",
                  fileIsProcessing ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200 dark:border-slate-700",
                  fileIsPending ? "opacity-60" : "opacity-100"
                )}>
                  <div className="flex flex-col flex-1 overflow-hidden min-w-0 mr-3">
                    <div className="flex items-center space-x-3">
                      <FileText className={cn("w-5 h-5 shrink-0", fileIsDone ? "text-green-500" : fileIsProcessing ? "text-blue-500" : "text-blue-500 dark:text-blue-400")} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                    </div>
                    {fileIsProcessing && (
                      <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse w-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {isProcessing ? (
                    <div className="shrink-0 flex items-center justify-center p-1">
                      {fileIsProcessing && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {fileIsDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

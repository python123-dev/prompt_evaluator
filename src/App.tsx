import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, Wand2, MessageSquare, CheckCircle2, ChevronDown, History, X, Trash2, Sun, Moon, Eye, GitCompare } from 'lucide-react';
import { ScoreRing } from './components/ScoreRing';
import { DiffView } from './components/DiffView';
import { PromptEvaluation, HistoryEntry } from './types';

const PROMPT_TEMPLATES = [
  {
    label: 'Select a template...',
    value: '',
  },
  {
    label: '✏️ Writing: Blog Post Outline',
    value: 'Write a comprehensive outline for a blog post about [Topic]. The outline should include an introduction, 3-4 main sections with bullet points for sub-topics, and a conclusion. Target audience is [Audience].',
  },
  {
    label: '💻 Coding: Code Review',
    value: 'Review the following [Language] code for bugs, security issues, and performance optimizations. Provide specific refactoring suggestions and explain your reasoning.\n\n```[Language]\n[Paste Code Here]\n```',
  },
  {
    label: '📊 Analysis: Pros & Cons',
    value: 'Perform a detailed pros and cons analysis of [Topic]. Please provide at least 5 points for each side, ranked by importance, and conclude with a summarizing recommendation.',
  },
  {
    label: '🎨 Creative: Brainstorming Ideas',
    value: 'Generate 10 creative and unconventional ideas for [Project/Problem]. For each idea, briefly explain the core concept and why it might be effective.',
  }
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [evaluatedPrompt, setEvaluatedPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<PromptEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('promptHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }

    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', String(newMode));
      return newMode;
    });
  };

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      setPrompt(selectedValue);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem('promptHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptHistory');
  };

  const evaluatePrompt = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setEvaluation(null);
    setShowDiff(false);

    try {
      const res = await fetch('/api/evaluate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate prompt. Please try again later.');
      }

      const data = await res.json();
      setEvaluation(data);
      setEvaluatedPrompt(prompt);
      
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt,
        evaluation: data,
      };
      
      setHistory(prev => {
        const newHistory = [newEntry, ...prev].slice(0, 5);
        localStorage.setItem('promptHistory', JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOptimized = () => {
    if (evaluation?.optimizedPrompt) {
      navigator.clipboard.writeText(evaluation.optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const originalWordCount = getWordCount(evaluatedPrompt);
  const optimizedWordCount = evaluation ? getWordCount(evaluation.optimizedPrompt) : 0;
  const wordCountDiff = optimizedWordCount - originalWordCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-200 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="w-full py-6 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Prompt Evaluator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight hidden sm:block">AI-Powered Optimization</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-10 h-10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs py-0.5 px-2 rounded-full font-bold">{history.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 sm:px-12 py-12 flex flex-col items-center">
        
        <div className="w-full max-w-2xl text-center space-y-4 mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Measure and refine your AI prompts.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
            Input your prompt below to get a detailed evaluation based on clarity, specificity, and relevance, along with a perfectly optimized rewrite.
          </p>
        </div>

        {/* Input Region */}
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-500 transition-all duration-300 overflow-hidden flex flex-col">
          
          <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
              Prompt Playground
            </span>
            <div className="relative">
              <select 
                onChange={handleTemplateChange}
                defaultValue=""
                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg pl-3 pr-9 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
              >
                {PROMPT_TEMPLATES.map((template, idx) => (
                  <option key={idx} value={template.value} disabled={idx === 0}>
                    {template.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here... e.g., 'Write a blog post about artificial intelligence.'"
            className="w-full min-h-[140px] appearance-none bg-transparent border-0 resize-y focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 p-5 text-lg"
          />
          <div className="flex justify-between items-center p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium ml-2">
               <MessageSquare className="w-4 h-4 mr-2" />
               {prompt.length > 0 ? `${prompt.length} characters` : 'Ready'}
            </div>
            <div className="flex items-center space-x-2">
              {prompt.length > 0 && (
                <button
                  onClick={() => {
                    setPrompt('');
                    setEvaluation(null);
                    setError(null);
                  }}
                  className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              <button
                onClick={evaluatePrompt}
                disabled={loading || prompt.trim().length === 0}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Evaluating</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Evaluate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-medium border border-rose-200 dark:border-rose-900/50"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {evaluation && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Scores Column */}
              <div className="lg:col-span-4 flex flex-col space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-2 px-4 shadow-sm flex justify-center items-center">
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      {evaluation.promptType}
                    </span>
                  </div>
                  <span className="text-sm font-medium tracking-wide uppercase text-slate-500 mb-6 mt-6">Overall Score</span>
                  <ScoreRing score={evaluation.overallScore} label="" size="lg" isOverall={true} />
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-4">
                  <ScoreRing score={evaluation.clarityScore} label="Clarity" />
                  <ScoreRing score={evaluation.specificityScore} label="Specificity" />
                  <ScoreRing score={evaluation.relevanceScore} label="Relevance" />
                </div>
              </div>

              {/* Feedback and Rewrite Column */}
              <div className="lg:col-span-8 flex flex-col space-y-6">
                
                {/* Actionable Feedback */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-full max-h-min">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    Actionable Feedback
                  </h3>
                  <div className="prose prose-slate dark:prose-invert prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300 max-w-none">
                     <p>{evaluation.feedback}</p>
                  </div>
                </div>

                {/* Optimized Rewrite */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles className="w-32 h-32 text-indigo-700 dark:text-indigo-400" />
                   </div>
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 flex items-center">
                          Optimized Prompt
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setShowDiff(!showDiff)}
                            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${showDiff ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200' : 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'}`}
                          >
                            {showDiff ? <Eye className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
                            <span>{showDiff ? 'View Result' : 'View Diff'}</span>
                          </button>
                          <button 
                            onClick={handleCopyOptimized}
                            className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-full transition-colors"
                          >
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                     </div>
                     
                     {showDiff ? (
                        <div className="mb-4">
                          <DiffView original={evaluatedPrompt} optimized={evaluation.optimizedPrompt} />
                        </div>
                     ) : (
                       <div className="bg-white/60 dark:bg-slate-900/50 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm shadow-inner mb-4">
                          <p className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed select-all whitespace-pre-wrap">
                            {evaluation.optimizedPrompt}
                          </p>
                       </div>
                     )}
                     
                     <div className="flex items-center text-sm font-medium">
                        <div className="flex flex-col">
                          <span className="text-indigo-900/60 dark:text-indigo-300/60 text-xs uppercase tracking-wider mb-0.5">Original</span>
                          <span className="text-indigo-900 dark:text-indigo-300">{originalWordCount} words</span>
                        </div>
                        <div className="flex items-center text-indigo-300 dark:text-indigo-500/50 mx-4">
                           <ArrowRight className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-indigo-900/60 dark:text-indigo-300/60 text-xs uppercase tracking-wider mb-0.5">Optimized</span>
                          <span className="text-indigo-900 dark:text-indigo-300">{optimizedWordCount} words</span>
                        </div>
                        {wordCountDiff !== 0 && (
                          <div className={`ml-8 px-2.5 py-1 rounded-md text-xs tracking-wide ${wordCountDiff > 0 ? 'bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                            {wordCountDiff > 0 ? '+' : ''}{wordCountDiff} words
                          </div>
                        )}
                     </div>
                   </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      
      {/* Footer */}
      <footer className="w-full py-8 text-center text-slate-400 text-sm font-medium">
        Powered by Gemini • Built in AI Studio
      </footer>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <History className="w-5 h-5 text-indigo-500" />
                  <span>Recent Evaluations</span>
                </div>
                <div className="flex items-center space-x-1">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors mr-2"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10">
                    <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No history yet.</p>
                    <p className="text-sm mt-1">Evaluate a prompt to see it here.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => {
                          setPrompt(item.prompt);
                          setEvaluatedPrompt(item.prompt);
                          setEvaluation(item.evaluation);
                          setIsHistoryOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all pr-12"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                            <Sparkles className="w-3 h-3" />
                            <span>{item.evaluation.overallScore}/10</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {item.prompt}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        title="Delete entry"
                        className="absolute top-3 right-3 p-2 text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

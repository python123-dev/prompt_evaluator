import React from 'react';
import * as Diff from 'diff';

interface DiffViewProps {
  original: string;
  optimized: string;
}

export function DiffView({ original, optimized }: DiffViewProps) {
  const diffResult = Diff.diffWordsWithSpace(original, optimized);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Original Prompt</h4>
        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {diffResult.map((part, index) => {
            if (part.added) return null;
            if (part.removed) {
              return (
                <span key={index} className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 line-through">
                  {part.value}
                </span>
              );
            }
            return <span key={index}>{part.value}</span>;
          })}
        </div>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30">
        <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Optimized Prompt</h4>
        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {diffResult.map((part, index) => {
            if (part.removed) return null;
            if (part.added) {
              return (
                <span key={index} className="bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 font-medium">
                  {part.value}
                </span>
              );
            }
            return <span key={index}>{part.value}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

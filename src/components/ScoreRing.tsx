import React from 'react';
import { motion } from 'motion/react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  isOverall?: boolean;
}

export function ScoreRing({ score, label, size = 'md', isOverall = false }: ScoreRingProps) {
  const radius = size === 'lg' ? 76 : size === 'md' ? 36 : 24;
  const stroke = size === 'lg' ? 10 : size === 'md' ? 6 : 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 10) * circumference;

  const colorClass = score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-slate-200 dark:text-slate-700"
          />
          <motion.circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={colorClass}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-semibold ${size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-2xl' : 'text-lg'} text-slate-800 dark:text-slate-100`}>
            {score}
            {isOverall && <span className="text-2xl text-slate-400 dark:text-slate-500 font-medium tracking-tighter">/10</span>}
          </span>
        </div>
      </div>
      <span className={`font-medium text-slate-500 dark:text-slate-400 ${size === 'lg' ? 'text-base' : 'text-xs uppercase tracking-wider'}`}>{label}</span>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Home, 
    LayoutDashboard, 
    Tag, 
    ArrowRight, 
    AlertTriangle, 
    RefreshCw, 
    Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
    const [score, setScore] = useState(100);
    const [statusText, setStatusText] = useState('Initializing AI crawler...');
    const pathname = usePathname();

    // Simulate ATS Scan descending to 0
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (score > 0) {
            timer = setTimeout(() => {
                const nextScore = Math.max(0, score - Math.floor(Math.random() * 12) - 4);
                setScore(nextScore);
                
                // Update status text based on score progress
                if (nextScore > 75) {
                    setStatusText('Crawling directory structures...');
                } else if (nextScore > 50) {
                    setStatusText('Comparing route keywords...');
                } else if (nextScore > 25) {
                    setStatusText('Searching database index schemas...');
                } else if (nextScore > 0) {
                    setStatusText('Running compatibility algorithms...');
                } else {
                    setStatusText('Scan complete: Compatibility failure.');
                }
            }, 80);
        }
        return () => clearTimeout(timer);
    }, [score]);

    const handleRestartScan = () => {
        setScore(100);
        setStatusText('Initializing AI crawler...');
    };

    const containerBg = 'bg-[#F7F9FC] dark:bg-[#050B18]';
    const cardBg = 'bg-white dark:bg-[#091324]/60 border-slate-200 dark:border-[rgba(43,127,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:backdrop-blur-xl';

    const textMuted = 'text-slate-500 dark:text-[#8FA5C7]';
    const textTitle = 'text-slate-900 dark:text-white';

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden transition-colors duration-300 ${containerBg} ${textTitle}`}>
            {/* Ambient Background Glow (hidden in light mode via opacity) */}
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-0 opacity-0 dark:opacity-100">
                <div className="w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[140px]" />
                <div className="w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] transform translate-y-12" />
            </div>

            <div className="relative z-10 text-center max-w-xl w-full">
                {/* Visual ATS Radar/Scan Circle */}
                <div className="flex justify-center mb-8">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                        {/* Outer rotating/pulsing rings */}
                        <div className={`absolute inset-0 rounded-full border border-dashed animate-spin [animation-duration:15s] ${
                            score > 0 
                                ? 'border-blue-500/30' 
                                : 'border-red-500/20'
                        }`} />
                        <div className={`absolute inset-2 rounded-full border border-double animate-reverse-spin [animation-duration:10s] ${
                            score > 0 
                                ? 'border-indigo-500/20' 
                                : 'border-red-500/10'
                        }`} />
                        
                        {/* Circular progress background */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="72"
                                cy="72"
                                r="64"
                                className="stroke-slate-100 dark:stroke-white/5"
                                strokeWidth="6"
                                fill="transparent"
                            />
                            <circle
                                cx="72"
                                cy="72"
                                r="64"
                                className={`transition-all duration-100 ${
                                    score > 0 
                                        ? 'stroke-blue-500' 
                                        : 'stroke-red-500'
                                }`}
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 64}
                                strokeDashoffset={2 * Math.PI * 64 * (1 - score / 100)}
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Centered Match Score */}
                        <div className="absolute flex flex-col items-center justify-center">
                            <motion.span 
                                key={score}
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-3xl font-black tracking-tighter ${
                                    score > 0 
                                        ? 'text-blue-500' 
                                        : 'text-red-500'
                                }`}
                            >
                                {score}%
                            </motion.span>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Match Score</span>
                        </div>
                    </div>
                </div>

                {/* Score Description */}
                <h1 className={`text-3xl font-black tracking-tight mb-2 ${textTitle}`}>
                    {score > 0 ? 'Evaluating URL Compatibility...' : 'ATS Mismatch: Route Not Found'}
                </h1>
                
                <p className={`text-sm mb-8 max-w-md mx-auto ${textMuted}`}>
                    {score > 0 
                        ? 'Our career index algorithm is parsing the requested endpoint to determine compatibility.'
                        : 'The page you requested returned a compatibility score of 0%. It either doesn\'t exist or was moved.'
                    }
                </p>

                {/* Interactive Scan Output Console */}
                <div className={`p-6 rounded-2xl border text-left mb-10 transition-all ${cardBg}`}>
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 pb-3 mb-4">
                        <span className="text-[10px] font-bold tracking-widest uppercase opacity-60 flex items-center gap-1.5 font-mono">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            AI ATS Scanner Output
                        </span>
                        {score === 0 && (
                            <button 
                                onClick={handleRestartScan}
                                className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1 font-mono"
                            >
                                <RefreshCw className="w-3 h-3 animate-pulse" /> Re-scan Path
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between">
                            <span className="opacity-50">SCANNED PATH:</span>
                            <span className="font-semibold truncate max-w-[280px] text-indigo-600 dark:text-[#5BA3FF]">
                                {pathname || '/unknown-route'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-50">STATUS ENUM:</span>
                            <span className={`font-bold ${score > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                {score > 0 ? 'COMPILING' : '404_NOT_FOUND'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-50">SCANNER FEEDBACK:</span>
                            <span className="text-right max-w-[260px] truncate">{statusText}</span>
                        </div>
                        
                        {score === 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 5 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="pt-3 border-t border-gray-200 dark:border-white/5 mt-3 space-y-1.5"
                            >
                                <div className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> CRITICAL ERROR FINDINGS:
                                </div>
                                <p className="text-[10px] opacity-75 leading-relaxed">
                                    Missing key directory mappings. Suggested fix: recalibrate route parameters using target console buttons below.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 text-sm"
                    >
                        <Home className="w-4 h-4" /> Recalibrate Search
                    </Link>
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                        <LayoutDashboard className="w-4 h-4" /> Student Console
                    </Link>
                    <Link
                        href="/pricing"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                        <Tag className="w-4 h-4" /> Upgrade Plan
                    </Link>
                </div>

                <div className="mt-8">
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline font-semibold"
                    >
                        Report a broken index to admin <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

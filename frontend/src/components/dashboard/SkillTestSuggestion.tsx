'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Clock, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

interface SkillTest {
    id: string;
    title: string;
    difficulty: string;
    durationMinutes: number;
    skill: { id: string; name: string };
    _count: { questions: number };
}

interface TestAttempt {
    id: string;
    passed: boolean;
    test: { id: string };
}

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
    EASY: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Easy' },
    MEDIUM: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Medium' },
    HARD: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Hard' },
};

export default function SkillTestSuggestion() {
    const { user } = useAuthStore();
    const [suggestedTest, setSuggestedTest] = useState<SkillTest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (!user) return;
            try {
                const [testsRes, attemptsRes] = await Promise.all([
                    authFetch(`/validation/tests`),
                    authFetch(`/validation/attempts`)
                ]);

                if (testsRes.ok && attemptsRes.ok) {
                    const testsData = await testsRes.json();
                    const attemptsData = await attemptsRes.json();

                    const allTests: SkillTest[] = testsData.data || [];
                    const attempts: TestAttempt[] = attemptsData.data || [];

                    const passedTestIds = new Set(attempts.filter(a => a.passed).map(a => a.test.id));
                    const availableTests = allTests.filter(t => !passedTestIds.has(t.id));

                    if (availableTests.length > 0) {
                        const randomTest = availableTests[Math.floor(Math.random() * availableTests.length)];
                        setSuggestedTest(randomTest);
                    }
                }
            } catch (error) {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestion();
    }, [user]);

    if (loading) {
        return (
            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 overflow-hidden animate-pulse">
                <div className="h-1 bg-gray-100 dark:bg-white/5" />
                <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/3" />
                    <div className="h-5 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
                </div>
            </div>
        );
    }

    if (!suggestedTest) return null;

    const diff = DIFFICULTY_CONFIG[suggestedTest.difficulty?.toUpperCase()] || DIFFICULTY_CONFIG.MEDIUM;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300"
        >
            {/* Gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                        Next Challenge
                    </span>
                </div>

                {/* Test name */}
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {suggestedTest.title}
                </h3>

                {/* Meta info */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${diff.bg} ${diff.border} ${diff.color}`}>
                        <BarChart2 className="w-3 h-3" />
                        {diff.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {suggestedTest.durationMinutes} min
                    </span>
                </div>

                {/* CTA */}
                <Link
                    href={`/dashboard/test/${suggestedTest.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-indigo-500/20"
                >
                    Start Test <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </motion.div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Award, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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
    test: {
        id: string;
    };
}

export default function SkillTestSuggestion() {
    const { accessToken, user } = useAuthStore();
    const [suggestedTest, setSuggestedTest] = useState<SkillTest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (!accessToken) return;

            try {
                const [testsRes, attemptsRes] = await Promise.all([
                    fetch(`${API_URL}/validation/tests`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    }),
                    fetch(`${API_URL}/validation/attempts`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    })
                ]);

                if (testsRes.ok && attemptsRes.ok) {
                    const testsData = await testsRes.json();
                    const attemptsData = await attemptsRes.json();

                    const allTests: SkillTest[] = testsData.data || [];
                    const attempts: TestAttempt[] = attemptsData.data || [];

                    // Filter out passed tests
                    const passedTestIds = new Set(
                        attempts.filter(a => a.passed).map(a => a.test.id)
                    );

                    const availableTests = allTests.filter(t => !passedTestIds.has(t.id));

                    if (availableTests.length > 0) {
                        // Prioritize based on target role if available, otherwise random
                        // For now, simpler logic: just pick the first available one or random
                        const randomTest = availableTests[Math.floor(Math.random() * availableTests.length)];
                        setSuggestedTest(randomTest);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch skill test suggestion', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestion();
    }, [accessToken]);

    if (loading) {
        return (
            <div className="p-4 rounded-xl glass-card border border-white/5 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!suggestedTest) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl glass-card border border-white/5 hover:border-purple-500/30 transition-all relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-16 h-16 text-purple-400 rotate-12" />
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">
                        Suggested Skill Test
                    </h4>

                    <h3 className="text-lg font-bold text-white mb-1">
                        {suggestedTest.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 uppercase text-[10px] tracking-wider">
                            {suggestedTest.difficulty}
                        </span>
                        <span>{suggestedTest.durationMinutes} min</span>
                    </div>

                    <Link
                        href={`/dashboard/test/${suggestedTest.id}`}
                        className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                    >
                        Start Test <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

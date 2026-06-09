'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Flame, Zap, Award, Sparkles, Clock, ArrowRight,
    BookOpen, CheckCircle, XCircle, ChevronLeft, ChevronRight,
    FileText, Mic, TrendingUp, Code, Users, Rocket, Star,
    HelpCircle, Smile, ThumbsUp, Lightbulb
} from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
// @ts-ignore
import confetti from 'canvas-confetti';

interface TestQuestion {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer?: string;
    explanation?: string;
}

interface DailyChallengeState {
    challengeId: string;
    date: string;
    quiz: {
        skillId: string;
        skillName: string;
        completed: boolean;
        score: number | null;
        correct: number | null;
        total: number | null;
        timeMs: number | null;
        questions: TestQuestion[];
    };
    insight: {
        id: string;
        title: string;
        content: string;
        category: string;
        icon: string;
        color: string;
        tags: string[];
        read: boolean;
        reaction: string | null;
    } | null;
    sprint: {
        skillId: string;
        skillName: string;
        completed: boolean;
    };
    isPerfectDay: boolean;
    totalXpEarned: number;
}

interface SprintCard {
    id: string;
    front: string;
    back: string;
    difficulty: string;
    tags: string[];
}

export default function DailyChallengeHub() {
    const [challenge, setChallenge] = useState<DailyChallengeState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Gamification stats from billing/engagement
    const [streak, setStreak] = useState(0);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [sevenDayCalendar, setSevenDayCalendar] = useState<any[]>([]);

    // Quiz modal state
    const [quizActive, setQuizActive] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [quizTimeRemaining, setQuizTimeRemaining] = useState(60);
    const [quizTimerActive, setQuizTimerActive] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [quizResults, setQuizResults] = useState<{
        score: number;
        correct: number;
        total: number;
        xpGranted: number;
        breakdown: { base: number; accuracy: number; speed: number };
        perfectDayAwarded: boolean;
        results: Array<{ questionId: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; explanation: string }>;
    } | null>(null);

    // Flashcard (Sprint) state
    const [sprintActive, setSprintActive] = useState(false);
    const [sprintCards, setSprintCards] = useState<SprintCard[]>([]);
    const [loadingCards, setLoadingCards] = useState(false);
    const [activeCardIdx, setActiveCardIdx] = useState(0);
    const [cardFlipped, setCardFlipped] = useState(false);
    const [sprintReviewedCount, setSprintReviewedCount] = useState(0);
    const [sprintReviewedIds, setSprintReviewedIds] = useState<Set<string>>(new Set());

    // Reaction popup & animation helpers
    const [activeReaction, setActiveReaction] = useState<string | null>(null);
    const [insightSubmitting, setInsightSubmitting] = useState(false);

    // Refs
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchChallengeAndStats();
    }, []);

    // Timer logic for quiz
    useEffect(() => {
        if (quizTimerActive && quizTimeRemaining > 0) {
            timerIntervalRef.current = setTimeout(() => {
                setQuizTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (quizTimeRemaining === 0 && quizTimerActive) {
            // Auto-submit or skip question
            handleQuizQuestionTimeout();
        }

        return () => {
            if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
        };
    }, [quizTimeRemaining, quizTimerActive]);

    const fetchChallengeAndStats = async () => {
        try {
            setLoading(true);
            const challengeRes = await authFetch('/daily-challenges');
            if (challengeRes.ok) {
                const challengeData = await challengeRes.json();
                setChallenge(challengeData.data);
                if (challengeData.data.insight?.reaction) {
                    setActiveReaction(challengeData.data.insight.reaction);
                }
            } else {
                setError('Failed to fetch today\'s daily challenge.');
            }

            const statsRes = await authFetch('/engagement/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStreak(statsData.data.streakCount);
                setXp(statsData.data.xp);
                setLevel(statsData.data.level);
                setSevenDayCalendar(statsData.data.sevenDayCalendar || []);
            }
        } catch (err) {
            setError('An unexpected error occurred while loading data.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuizQuestionTimeout = () => {
        // Move to next question or auto-submit
        const currentQuestion = challenge?.quiz.questions[currentQuestionIdx];
        if (currentQuestion) {
            setQuizAnswers(prev => ({
                ...prev,
                [currentQuestion.id]: '' // empty answer representing timeout
            }));
        }

        if (challenge && currentQuestionIdx < challenge.quiz.questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setQuizTimeRemaining(60);
        } else {
            // Last question timed out, trigger submit
            submitQuizAnswers();
        }
    };

    const startQuiz = () => {
        if (!challenge || challenge.quiz.completed) return;
        setQuizActive(true);
        setCurrentQuestionIdx(0);
        setQuizAnswers({});
        setQuizTimeRemaining(60);
        setQuizTimerActive(true);
        setQuizStartTime(Date.now());
        setQuizResults(null);
    };

    const selectQuizOption = (option: string) => {
        const currentQuestion = challenge?.quiz.questions[currentQuestionIdx];
        if (!currentQuestion) return;

        setQuizAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: option
        }));

        // Automatically advance or wait for user to click next
        if (challenge && currentQuestionIdx < challenge.quiz.questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestionIdx(prev => prev + 1);
                setQuizTimeRemaining(60);
            }, 300);
        } else {
            // Last question answered, pause timer and submit
            setQuizTimerActive(false);
            setTimeout(() => {
                submitQuizAnswers();
            }, 300);
        }
    };

    const submitQuizAnswers = async () => {
        if (!challenge) return;
        setQuizSubmitting(true);
        setQuizTimerActive(false);

        const elapsed = quizStartTime ? Date.now() - quizStartTime : 0;

        try {
            const res = await authFetch('/daily-challenges/submit-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challengeId: challenge.challengeId,
                    answers: quizAnswers,
                    timeMs: elapsed
                })
            });

            if (res.ok) {
                const data = await res.json();
                setQuizResults(data.data);
                
                // Show celebration confetti
                triggerConfetti(2);

                // Update local challenge status
                setChallenge(prev => prev ? {
                    ...prev,
                    quiz: {
                        ...prev.quiz,
                        completed: true,
                        score: data.data.score,
                        correct: data.data.correct,
                        total: data.data.total
                    },
                    isPerfectDay: prev.isPerfectDay || data.data.perfectDayAwarded,
                    totalXpEarned: prev.totalXpEarned + data.data.xpGranted
                } : prev);

                // Refresh overall XP/streak stats
                fetchChallengeAndStats();
            }
        } catch {
            setError('Failed to submit quiz.');
        } finally {
            setQuizSubmitting(false);
        }
    };

    const triggerConfetti = (seconds = 2) => {
        const end = Date.now() + (seconds * 1000);
        const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899'];

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const handleInsightReaction = async (reaction: string) => {
        if (!challenge || insightSubmitting) return;
        setInsightSubmitting(true);

        try {
            const res = await authFetch('/daily-challenges/read-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    challengeId: challenge.challengeId,
                    reaction
                })
            });

            if (res.ok) {
                const data = await res.json();
                setActiveReaction(reaction);
                
                if (data.data.xpGranted > 0) {
                    // Confetti burst for micro-engagement
                    confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { y: 0.8 }
                    });
                }

                setChallenge(prev => prev ? {
                    ...prev,
                    insight: prev.insight ? {
                        ...prev.insight,
                        read: true,
                        reaction
                    } : null,
                    isPerfectDay: prev.isPerfectDay || data.data.perfectDayAwarded,
                    totalXpEarned: prev.totalXpEarned + data.data.xpGranted
                } : prev);

                fetchChallengeAndStats();
            }
        } catch {
            // Silent error
        } finally {
            setInsightSubmitting(false);
        }
    };

    const triggerReadInsightOnly = async () => {
        if (!challenge || challenge.insight?.read) return;
        handleInsightReaction('');
    };

    const startSprint = async () => {
        if (!challenge) return;
        setLoadingCards(true);
        setSprintActive(true);
        setActiveCardIdx(0);
        setCardFlipped(false);
        setSprintReviewedCount(0);
        setSprintReviewedIds(new Set());

        try {
            const res = await authFetch(`/daily-challenges/sprint-cards?skillId=${challenge.sprint.skillId}`);
            if (res.ok) {
                const data = await res.json();
                setSprintCards(data.data);
            }
        } catch {
            setError('Failed to fetch sprint flashcards.');
        } finally {
            setLoadingCards(false);
        }
    };

    const rateFlashcard = async (confidence: number) => {
        const currentCard = sprintCards[activeCardIdx];
        if (!currentCard || !challenge) return;

        // Mark as reviewed in local UI
        const newReviewed = new Set(sprintReviewedIds);
        newReviewed.add(currentCard.id);
        setSprintReviewedIds(newReviewed);

        try {
            // Submit SM-2 spaced repetition log in the background
            authFetch('/daily-challenges/sprint-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: currentCard.id,
                    confidence
                })
            });

            // Increment count
            const nextReviewedCount = sprintReviewedCount + 1;
            setSprintReviewedCount(nextReviewedCount);

            if (nextReviewedCount >= sprintCards.length) {
                // Sprint fully completed!
                const res = await authFetch('/daily-challenges/complete-sprint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ challengeId: challenge.challengeId })
                });

                if (res.ok) {
                    const data = await res.json();
                    triggerConfetti(1.5);
                    setChallenge(prev => prev ? {
                        ...prev,
                        sprint: {
                            ...prev.sprint,
                            completed: true
                        },
                        isPerfectDay: prev.isPerfectDay || data.data.perfectDayAwarded,
                        totalXpEarned: prev.totalXpEarned + data.data.xpGranted
                    } : prev);
                    
                    fetchChallengeAndStats();
                }

                // Show success modal state or close
                setTimeout(() => {
                    setSprintActive(false);
                }, 1000);
            } else {
                // Go to next card
                setCardFlipped(false);
                setTimeout(() => {
                    setActiveCardIdx(prev => prev + 1);
                }, 300);
            }
        } catch {
            // Silent error
        }
    };

    // Calculate progress rings/bars
    const completedTasksCount = (challenge ? [challenge.quiz.completed, challenge.insight?.read, challenge.sprint.completed].filter(Boolean).length : 0);
    const progressPercent = (completedTasksCount / 3) * 100;

    // Mapping icons for categories
    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'FileText': return FileText;
            case 'Mic': return Mic;
            case 'TrendingUp': return TrendingUp;
            case 'Code': return Code;
            case 'Users': return Users;
            case 'Rocket': return Rocket;
            default: return TrendingUp;
        }
    };

    if (loading && !challenge) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading today's challenges...</p>
            </div>
        );
    }

    if (error && !challenge) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6 text-center">
                <XCircle className="w-12 h-12 text-rose-500" />
                <p className="text-base font-semibold text-gray-900 dark:text-white">{error}</p>
                <button
                    onClick={fetchChallengeAndStats}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header / Stats Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-indigo-800/40">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
                        <Sparkles className="w-4 h-4" /> Daily Hub
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Your Daily Placement Habit</h1>
                    <p className="text-sm text-indigo-200 max-w-md">
                        Complete your daily activities to build placement readiness, level up your profile, and earn premium mock credits.
                    </p>
                </div>

                {/* Gamification summary */}
                <div className="flex items-center gap-6 self-start md:self-center bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <Flame className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-200">Daily Streak</p>
                            <p className="text-lg font-bold text-orange-400">{streak} Days</p>
                        </div>
                    </div>
                    
                    <div className="w-px h-10 bg-white/10" />

                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-200">Total XP</p>
                            <p className="text-lg font-bold text-indigo-400">{xp.toLocaleString()} XP</p>
                        </div>
                    </div>

                    <div className="w-px h-10 bg-white/10" />

                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-200">Level</p>
                            <p className="text-lg font-bold text-emerald-400">Lv {level}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Perfect Day Banner & Progress */}
            {challenge && (
                <div className={`relative rounded-3xl p-6 border transition-all duration-300 ${
                    challenge.isPerfectDay
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'
                } shadow-md`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                challenge.isPerfectDay
                                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                            }`}>
                                <Trophy className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {challenge.isPerfectDay ? '✨ Perfect Day Achieved! 🎉' : 'Your Progress Today'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {challenge.isPerfectDay
                                        ? 'Amazing work! You completed all 3 tasks and received +100 XP Perfect Day Bonus!'
                                        : `${completedTasksCount} of 3 tasks completed. Finish all to unlock a +100 XP bonus.`}
                                </p>
                            </div>
                        </div>

                        {/* Progress bar / Indicator */}
                        <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[240px]">
                            <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full bg-gradient-to-r ${
                                        challenge.isPerfectDay ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-violet-600'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {completedTasksCount}/3 Completed
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Challenge Calendar (7-Day Completion Tracker) */}
            {challenge && sevenDayCalendar.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150/40 dark:border-slate-800/80 p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Weekly Activity Tracker</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your daily placement activities over the last 7 days.</p>
                        </div>
                        <div className="self-start sm:self-center flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Perfect Day Bonus (+100 XP)
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 md:gap-4 mt-2 overflow-x-auto min-w-[550px] sm:min-w-0">
                        {sevenDayCalendar.map((day) => {
                            return (
                                <div
                                    key={day.date}
                                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                                        day.isPerfect
                                            ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100 shadow-inner'
                                            : day.hasActivity
                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-100'
                                            : 'bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800/60 text-gray-500'
                                    } ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">{day.label}</span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-550 mt-0.5">{new Date(day.date).getDate()}</span>
                                    
                                    <div className="mt-3 flex flex-col items-center gap-1.5">
                                        {day.isPerfect ? (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                                                <Star className="w-4 h-4 fill-white text-white" />
                                            </div>
                                        ) : day.hasActivity ? (
                                            <div className="w-8 h-8 rounded-full bg-indigo-550/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
                                                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-300 dark:text-slate-700">
                                                ✕
                                            </div>
                                        )}
                                    </div>

                                    {/* Mini task completion indicators */}
                                    <div className="flex items-center gap-1 mt-3">
                                        <div
                                            title="Daily MCQ Quiz"
                                            className={`w-2 h-2 rounded-full ${
                                                day.quizDone ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'
                                            }`}
                                        />
                                        <div
                                            title="Daily Career Insight"
                                            className={`w-2 h-2 rounded-full ${
                                                day.insightDone ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'
                                            }`}
                                        />
                                        <div
                                            title="Skill Flashcard Sprint"
                                            className={`w-2 h-2 rounded-full ${
                                                day.sprintDone ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'
                                            }`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Daily Challenges Grid */}
            {challenge && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. Timed Quiz Card */}
                    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
                        {challenge.quiz.completed && (
                            <div className="absolute top-4 right-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                                Completed ({challenge.quiz.score}%)
                            </div>
                        )}
                        <div className="flex-1 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                                    Quiz
                                </span>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">Daily Skill MCQ</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Assess your skills on **{challenge.quiz.skillName}** in a 5-question timed quiz sprint.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Timed (60s / q)
                                </span>
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                    <Zap className="w-3.5 h-3.5" /> +50 XP Base
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                            {challenge.quiz.completed ? (
                                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Got {challenge.quiz.correct}/{challenge.quiz.total} correct!
                                </div>
                            ) : (
                                <button
                                    onClick={startQuiz}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                                >
                                    Start Quiz <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. Insight Card */}
                    {challenge.insight && (
                        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
                            {challenge.insight.read && (
                                <div className="absolute top-4 right-4 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">
                                    Read {activeReaction && `· ${activeReaction}`}
                                </div>
                            )}
                            <div className="flex-1 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-500">
                                    {(() => {
                                        const Icon = getIconComponent(challenge.insight.icon);
                                        return <Icon className="w-6 h-6" />;
                                    })()}
                                </div>
                                <div onClick={triggerReadInsightOnly} className="cursor-pointer">
                                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                                        {challenge.insight.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 hover:underline">
                                        {challenge.insight.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">
                                        "{challenge.insight.content}"
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {challenge.insight.tags.map(t => (
                                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Reactions panel */}
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                                <p className="text-xs text-gray-400 font-semibold">How did you find this insight?</p>
                                <div className="flex items-center gap-2">
                                    {[
                                        { emoji: '👍', name: 'Useful', Icon: ThumbsUp, color: 'hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' },
                                        { emoji: '💡', name: 'Inspired', Icon: Lightbulb, color: 'hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' },
                                        { emoji: '🔥', name: 'Excited', Icon: Flame, color: 'hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10' }
                                    ].map(r => (
                                        <button
                                            key={r.emoji}
                                            disabled={insightSubmitting}
                                            onClick={() => handleInsightReaction(r.emoji)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                                activeReaction === r.emoji
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 ' + r.color
                                            }`}
                                        >
                                            <span>{r.emoji}</span>
                                            <span>{r.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Skill Sprint (Flashcards) Card */}
                    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
                        {challenge.sprint.completed && (
                            <div className="absolute top-4 right-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                                Completed
                            </div>
                        )}
                        <div className="flex-1 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded-md">
                                    Skill Sprint
                                </span>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">Flashcard Review</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Review 5 micro-learning cards on **{challenge.sprint.skillName}** to improve recall.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                                    <Zap className="w-3.5 h-3.5" /> +30 XP Base
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                            {challenge.sprint.completed ? (
                                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Spaced repetition updated!
                                </div>
                            ) : (
                                <button
                                    onClick={startSprint}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                                >
                                    Start Sprint <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            <AnimatePresence>
                {quizActive && challenge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden"
                        >
                            {/* Exit button */}
                            {!quizSubmitting && (
                                <button
                                    onClick={() => setQuizActive(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    ✕
                                </button>
                            )}

                            {quizResults ? (
                                /* Results display */
                                <div className="space-y-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                                        <Trophy className="w-9 h-9" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Daily Quiz Completed!</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            You scored **{quizResults.score}%** in this sprint.
                                        </p>
                                    </div>

                                    {/* XP breakdown */}
                                    <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-5 max-w-md mx-auto grid grid-cols-3 gap-4 border border-indigo-100/30">
                                        <div>
                                            <p className="text-xs text-indigo-400 font-semibold uppercase">Base XP</p>
                                            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                                                +{quizResults.breakdown.base}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-indigo-400 font-semibold uppercase">Accuracy</p>
                                            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                                                +{quizResults.breakdown.accuracy}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-indigo-400 font-semibold uppercase">Speed Bonus</p>
                                            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                                                +{quizResults.breakdown.speed}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Questions review */}
                                    <div className="text-left space-y-4 max-h-[300px] overflow-y-auto pr-2 mt-4">
                                        {quizResults.results.map((r, i) => (
                                            <div key={r.questionId} className={`p-4 rounded-xl border ${
                                                r.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                                            }`}>
                                                <div className="flex items-start gap-2.5">
                                                    {r.isCorrect ? (
                                                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                            {i + 1}. {challenge.quiz.questions[i].questionText}
                                                        </p>
                                                        <div className="text-xs space-y-1 mt-2 text-gray-600 dark:text-gray-400">
                                                            <p>Your answer: <span className="font-bold">{r.userAnswer || 'No answer'}</span></p>
                                                            {!r.isCorrect && <p>Correct answer: <span className="font-bold text-emerald-600">{r.correctAnswer}</span></p>}
                                                            <p className="text-gray-400 italic mt-1 font-medium">"{r.explanation}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setQuizActive(false)}
                                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors mt-6"
                                    >
                                        Awesome, Next Task!
                                    </button>
                                </div>
                            ) : (
                                /* Active Quiz Question */
                                <div className="space-y-6">
                                    {/* Progress Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                                        <div>
                                            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                                                {challenge.quiz.skillName} Quiz
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Question {currentQuestionIdx + 1} of {challenge.quiz.questions.length}
                                            </p>
                                        </div>

                                        {/* Timer ring */}
                                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-full text-sm">
                                            <Clock className="w-4 h-4 animate-spin" /> {quizTimeRemaining}s
                                        </div>
                                    </div>

                                    {/* Question text */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                                            {challenge.quiz.questions[currentQuestionIdx].questionText}
                                        </h4>

                                        {/* Options list */}
                                        <div className="grid grid-cols-1 gap-3 pt-2">
                                            {challenge.quiz.questions[currentQuestionIdx].options.map(option => (
                                                <button
                                                    key={option}
                                                    disabled={quizSubmitting}
                                                    onClick={() => selectQuizOption(option)}
                                                    className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-sm font-semibold transition-all flex items-center justify-between group text-gray-700 dark:text-gray-300"
                                                >
                                                    <span>{option}</span>
                                                    <span className="w-6 h-6 rounded-full border border-gray-300 dark:border-slate-700 group-hover:border-indigo-600 flex items-center justify-center text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Skill Sprint (Flashcards) Modal */}
            <AnimatePresence>
                {sprintActive && challenge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden"
                        >
                            {/* Exit button */}
                            <button
                                onClick={() => setSprintActive(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                ✕
                            </button>

                            {loadingCards ? (
                                <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs text-gray-500">Retrieving flashcards...</p>
                                </div>
                            ) : sprintCards.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Progress Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                                        <div>
                                            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                                                {challenge.sprint.skillName} Sprint
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                Card {activeCardIdx + 1} of {sprintCards.length}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
                                            {sprintReviewedCount}/5 Reviewed
                                        </span>
                                    </div>

                                    {/* CSS 3D Flippable Card */}
                                    <div className="perspective-1000 w-full min-h-[240px] cursor-pointer" onClick={() => setCardFlipped(!cardFlipped)}>
                                        <div
                                            className="transform-style-3d relative w-full h-full min-h-[240px] duration-500 ease-in-out"
                                            style={{
                                                transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                            }}
                                        >
                                            {/* Front Side */}
                                            <div className="backface-hidden absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl p-6 flex flex-col justify-between border border-indigo-200/40 shadow-inner">
                                                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
                                                    <span>Question / Concept</span>
                                                    <span className="px-2 py-0.5 bg-indigo-200/50 dark:bg-slate-700/50 rounded">{sprintCards[activeCardIdx].difficulty}</span>
                                                </div>
                                                <p className="text-lg md:text-xl font-bold text-center text-gray-900 dark:text-white my-auto px-4">
                                                    {sprintCards[activeCardIdx].front}
                                                </p>
                                                <p className="text-xs text-center text-indigo-500 font-medium animate-pulse">
                                                    Click card to reveal answer
                                                </p>
                                            </div>

                                            {/* Back Side */}
                                            <div
                                                className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl p-6 flex flex-col justify-between border border-emerald-200/40 shadow-inner"
                                            >
                                                <div className="flex items-center justify-between text-xs text-emerald-500 font-semibold">
                                                    <span>Answer / Explanation</span>
                                                    <div className="flex gap-1">
                                                        {sprintCards[activeCardIdx].tags.map(t => (
                                                            <span key={t} className="px-1.5 py-0.5 bg-emerald-200/50 dark:bg-slate-700/50 rounded text-[9px]">#{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-base font-bold text-center text-gray-800 dark:text-white my-auto px-4 leading-relaxed">
                                                    {sprintCards[activeCardIdx].back}
                                                </p>
                                                <p className="text-xs text-center text-emerald-600 font-medium">
                                                    Click card to see question again
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confidence self-rating (visible when card is flipped) */}
                                    {cardFlipped && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3 pt-2"
                                        >
                                            <p className="text-xs font-semibold text-center text-gray-500">
                                                How confident are you with this concept?
                                            </p>
                                            <div className="grid grid-cols-5 gap-2">
                                                {[1, 2, 3, 4, 5].map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        onClick={() => rateFlashcard(lvl)}
                                                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                                                            lvl >= 4
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                                                : lvl === 3
                                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 hover:text-white'
                                                                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white'
                                                        }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-400 px-1 font-medium">
                                                <span>Forgot (Review tomorrow)</span>
                                                <span>Mastered (Review later)</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-gray-500">No cards available for review today.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
